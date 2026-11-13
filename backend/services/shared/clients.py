"""Cliente HTTP para a comunicação entre os microsserviços.

Nenhum serviço lê o banco de outro. Dados de leitura frequente (nomes,
categorias, situação dos vídeos) chegam por eventos Kafka e ficam em réplicas
locais (ver eventos.py). Este cliente é usado para o resto: comandos que
precisam de resposta imediata (moderar/arquivar vídeo, checar uso de uma
categoria) e consultas agregadas (estatísticas e vídeos de um profissional).

Endereços configurados por variável de ambiente:

    IDENTIDADE_API_URL, CONTA_API_URL, PROFISSIONAIS_API_URL, CATALOGO_API_URL

Sem a variável, usa as portas locais padrão (8001 a 8004).
"""

import logging
import os
import time

import httpx
from fastapi import HTTPException

from backend.services.shared.auth import issue_service_token
from backend.services.shared.observabilidade import ESTADO, request_id

log = logging.getLogger("wellflix.rest")

DEFAULT_URLS = {
    "identidade": "http://localhost:8001",
    "conta": "http://localhost:8002",
    "profissionais": "http://localhost:8003",
    "catalogo": "http://localhost:8004",
}

_client: httpx.Client | None = None


def _http() -> httpx.Client:
    global _client
    if _client is None:
        # No plano gratuito do Render um serviço "dormindo" demora para acordar.
        timeout = float(os.getenv("SERVICE_TIMEOUT_SECONDS", "30"))
        _client = httpx.Client(timeout=timeout)
    return _client


def base_url(service: str) -> str:
    url = os.getenv(f"{service.upper()}_API_URL", "").strip() or DEFAULT_URLS[service]
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    return url.rstrip("/")


def unavailable(service: str) -> HTTPException:
    return HTTPException(503, detail={"code": "SERVICE_UNAVAILABLE", "message": "Este recurso está temporariamente indisponível. Tente novamente em instantes."})


def call(
    service: str,
    method: str,
    path: str,
    *,
    caller: str,
    params: dict | None = None,
    json: dict | None = None,
    user_token: str | None = None,
    not_found_ok: bool = False,
    forward_errors: bool = False,
):
    """Chama outro serviço e devolve o campo ``data`` da resposta.

    - Rotas ``/internal`` recebem um token de serviço assinado por ``caller``.
    - Com ``user_token`` o token do usuário é repassado (ex.: /api/usuarios/me).
    - ``not_found_ok`` devolve ``None`` em vez de erro quando a resposta é 404.
    - ``forward_errors`` repassa erros 4xx do outro serviço ao cliente.
    """
    token = user_token or issue_service_token(caller)
    headers = {"Authorization": f"Bearer {token}", "X-Servico-Origem": caller}
    if request_id.get() != "-":
        headers["X-Request-ID"] = request_id.get()  # mesma correlação nos dois serviços
    inicio = time.perf_counter()
    try:
        response = _http().request(method, base_url(service) + path, params=params, json=json, headers=headers)
    except httpx.HTTPError as error:
        log.warning("REST %s -> %s %s falhou: %s", caller, service, path, type(error).__name__)
        ESTADO.registrar("rest", destino=service, metodo=method, caminho=path, erro=type(error).__name__)
        raise unavailable(service)
    ms = (time.perf_counter() - inicio) * 1000
    log.info("REST %s -> %s %s %s -> %s em %.0f ms", caller, service, method, path, response.status_code, ms)
    ESTADO.registrar("rest", destino=service, metodo=method, caminho=path, status=response.status_code,
                     ms=round(ms), erro=response.status_code >= 500)
    if response.status_code == 404 and not_found_ok:
        return None
    if response.is_success:
        return response.json().get("data")
    if forward_errors and 400 <= response.status_code < 500:
        try:
            error = response.json()["error"]
        except (ValueError, KeyError, TypeError):
            error = {"code": "UPSTREAM_ERROR", "message": "Não foi possível concluir a solicitação. Tente novamente."}
        raise HTTPException(response.status_code, detail=error)
    if response.status_code >= 500:
        raise unavailable(service)
    raise HTTPException(502, detail={"code": "UPSTREAM_ERROR", "message": "Não foi possível concluir a solicitação. Tente novamente."})

