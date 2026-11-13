"""Reuso operacional comum aos quatro microsserviços (o "sidecar" do WellFlix).

No capítulo 17 de *Fundamentals of Software Architecture* (Richards e Ford), os
microsserviços evitam acoplamento de domínio, mas compartilham as
preocupações operacionais (logs, monitoramento, verificação de saúde) por um
componente comum a todos, o *sidecar*. Este módulo faz esse papel: todos os
serviços o usam do mesmo jeito, e nenhum conhece o domínio do outro.

O que ele oferece:

- **Logs padronizados** em todos os serviços:
  ``2026-11-13 18:00:00.123 | catalogo      | INFO  | eventos | [req=1a2b3c4d] mensagem``
- **Correlação entre serviços**: cada requisição HTTP recebe um ``X-Request-ID``
  (ou reaproveita o que veio). Ele é repassado nas chamadas REST a outros
  serviços e gravado nos eventos do outbox, então uma mesma ação pode ser
  seguida nos logs de todos os serviços que ela atravessa.
- **Estado operacional** (``/status``): banco, broker, eventos publicados e
  consumidos, chamadas REST e o último *heartbeat* recebido de cada serviço.
"""

import contextvars
import logging
import os
import sys
import threading
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, Request

SERVICOS = ["identidade", "conta", "profissionais", "catalogo"]

request_id: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")
INSTANCIA = os.getenv("RENDER_INSTANCE_ID") or uuid.uuid4().hex[:8]
_log_http = logging.getLogger("wellflix.http")


def agora() -> datetime:
    return datetime.now(timezone.utc)


def novo_request_id() -> str:
    return uuid.uuid4().hex[:8]


# --- Logs -------------------------------------------------------------------


class _Contexto(logging.Filter):
    def __init__(self, servico: str):
        super().__init__()
        self.servico = servico

    def filter(self, record: logging.LogRecord) -> bool:
        record.servico = self.servico
        record.req = request_id.get()
        record.componente = record.name.removeprefix("wellflix.")
        return True


def configurar_logs(servico: str) -> None:
    nivel = os.getenv("LOG_LEVEL", "INFO").upper()
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(_Contexto(servico))
    handler.setFormatter(logging.Formatter(
        "%(asctime)s.%(msecs)03d | %(servico)-13s | %(levelname)-5s | %(componente)-9s | [req=%(req)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    raiz = logging.getLogger("wellflix")
    raiz.handlers[:] = [handler]
    raiz.setLevel(nivel)
    raiz.propagate = False
    # Mensagens do librdkafka/uvicorn continuam no formato deles; os logs de
    # acesso do uvicorn são substituídos pelo middleware abaixo.
    logging.getLogger("uvicorn.access").disabled = True


# --- Estado operacional -----------------------------------------------------


class Estado:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.iniciado_em = agora()
        self.servico = "-"
        self.banco: dict = {"ok": None}
        self.broker: dict = {"configurado": False, "conectado": False, "erro": None}
        self.publicados = {"total": 0, "ultimo": None}
        self.consumidos = {"total": 0, "ultimo": None, "por_origem": {}}
        self.rest = {"total": 0, "erros": 0, "ultimo": None}
        self.heartbeats: dict[str, dict] = {}
        self.heartbeat_seq = 0

    def registrar(self, campo: str, **dados) -> None:
        with self.lock:
            alvo = getattr(self, campo)
            alvo["total"] = alvo.get("total", 0) + 1
            alvo["ultimo"] = {**dados, "em": agora().isoformat()}
            if campo == "consumidos":
                origem = dados.get("origem", "?")
                alvo["por_origem"][origem] = alvo["por_origem"].get(origem, 0) + 1
            if campo == "rest" and dados.get("erro"):
                alvo["erros"] += 1

    def resumo(self) -> dict:
        with self.lock:
            momento = agora()
            pares = {}
            for nome, hb in self.heartbeats.items():
                visto = hb["recebido_em"]
                pares[nome] = {
                    **{k: v for k, v in hb.items() if k != "recebido_em"},
                    "recebido_em": visto.isoformat(),
                    "segundos_desde_ultimo": round((momento - visto).total_seconds(), 1),
                }
            return {
                "servico": self.servico,
                "instancia": INSTANCIA,
                "no_ar_desde": self.iniciado_em.isoformat(),
                "banco": self.banco,
                "broker": self.broker,
                "eventos_publicados": self.publicados,
                "eventos_consumidos": self.consumidos,
                "chamadas_rest": self.rest,
                "heartbeats_enviados": self.heartbeat_seq,
                "heartbeats_recebidos": pares,
            }


ESTADO = Estado()


# --- Ligação com o FastAPI ----------------------------------------------------


def instalar(app: FastAPI, servico: str) -> None:
    """Liga logs, correlação de requisições e ``/status`` num serviço."""
    configurar_logs(servico)
    ESTADO.servico = servico

    @app.middleware("http")
    async def correlacionar(request: Request, call_next):
        rid = request.headers.get("x-request-id") or novo_request_id()
        token = request_id.set(rid[:36])
        inicio = time.perf_counter()
        status = 500
        try:
            response = await call_next(request)
            status = response.status_code
            response.headers["X-Request-ID"] = rid
            return response
        finally:
            ms = (time.perf_counter() - inicio) * 1000
            origem = request.headers.get("x-servico-origem")
            quem = f" (chamado por {origem})" if origem else ""
            caminho = request.url.path
            nivel = logging.DEBUG if caminho in ("/health", "/status", "/") else logging.INFO
            _log_http.log(nivel, "%s %s -> %s em %.0f ms%s", request.method, caminho, status, ms, quem)
            request_id.reset(token)

    @app.get("/status", tags=["operacional"], summary="Estado operacional: banco, broker, eventos, REST e heartbeats")
    def status():
        from backend.services.shared.config import success
        from backend.services.shared.database import connect, resolve_schema

        try:
            with connect(resolve_schema(servico), connect_timeout=5) as conn:
                conn.execute("SELECT 1")
                pendentes = None
                tem_outbox = conn.execute("SELECT to_regclass('outbox_eventos') IS NOT NULL AS ok").fetchone()["ok"]
                if tem_outbox:
                    pendentes = conn.execute("SELECT count(*) AS n FROM outbox_eventos WHERE publicado_em IS NULL").fetchone()["n"]
            ESTADO.banco = {"ok": True, "schema": resolve_schema(servico), "outbox_pendentes": pendentes}
        except Exception as erro:  # o /status precisa responder mesmo sem banco
            ESTADO.banco = {"ok": False, "erro": type(erro).__name__}
        return success(ESTADO.resumo())
