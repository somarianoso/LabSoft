from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from psycopg.errors import ForeignKeyViolation, UniqueViolation

from backend.services.shared.auth import require_role
from backend.services.shared.config import configure_app, success
from backend.services.shared.database import connection
from backend.services.shared.errors import install_error_handlers

app = FastAPI(title="WellFlix — Planos, assinaturas e trilhas", version="1.0.0")
configure_app(app)
install_error_handlers(app)
Athlete = Annotated[dict, Depends(require_role("atleta"))]


class SubscriptionRequest(BaseModel):
    codigo_plano: str = Field(min_length=1, max_length=40)
    metodo_pagamento: str
    categorias: list[str] = Field(default_factory=list)


class TrailRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    privacidade: str = "privada"

    @field_validator("nome")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("O nome da trilha é obrigatório.")
        return normalized


class TrailUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=120)
    privacidade: str | None = None

    @field_validator("nome")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("O nome da trilha não pode ficar vazio.")
        return normalized


class ProgressRequest(BaseModel):
    segundos_assistidos: int = Field(ge=0)
    concluido: bool


@app.get("/health")
def health():
    return success({"status": "ok", "service": "conta"})


@app.get("/api/planos")
def list_plans():
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, codigo, nome, descricao, preco_mensal_centavos, limite_categorias FROM planos WHERE ativo = TRUE ORDER BY preco_mensal_centavos")
        rows = cur.fetchall()
    return success(rows)


@app.post("/api/assinaturas", status_code=status.HTTP_201_CREATED)
def create_subscription(body: SubscriptionRequest, user: Athlete):
    if body.metodo_pagamento not in {"cartao", "pix", "boleto"}:
        raise HTTPException(422, detail={"code": "INVALID_PAYMENT_METHOD", "message": "Use cartao, pix ou boleto."})
    names = [name.strip() for name in body.categorias]
    if any(not name for name in names) or len(set(names)) != len(names):
        raise HTTPException(422, detail={"code": "INVALID_CATEGORY_SELECTION", "message": "Categorias vazias ou repetidas não são permitidas."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, codigo, nome, preco_mensal_centavos, limite_categorias FROM planos WHERE codigo = %s AND ativo = TRUE", (body.codigo_plano.strip(),))
        plan = cur.fetchone()
        if not plan:
            raise HTTPException(404, detail={"code": "PLAN_NOT_FOUND", "message": "Plano não encontrado ou inativo."})
        limit = plan["limite_categorias"]
        if limit is not None and len(names) != limit:
            raise HTTPException(422, detail={"code": "INVALID_CATEGORY_SELECTION", "message": f"Este plano exige exatamente {limit} categorias."})
        cur.execute("SELECT id, nome FROM categorias WHERE nome = ANY(%s)", (names,))
        categories = cur.fetchall() if names else []
        if len(categories) != len(names):
            raise HTTPException(422, detail={"code": "UNKNOWN_CATEGORY", "message": "Uma ou mais categorias não existem."})
        cur.execute("INSERT INTO assinaturas (atleta_id, plano_id, metodo_pagamento) VALUES (%s, %s, %s) RETURNING id, atleta_id, plano_id, metodo_pagamento, situacao, data_criacao", (user["id"], plan["id"], body.metodo_pagamento))
        subscription = cur.fetchone()
        if categories:
            cur.executemany("INSERT INTO categorias_assinatura (assinatura_id, categoria_id) VALUES (%s, %s)", [(subscription["id"], c["id"]) for c in categories])
    subscription["plano"] = {key: plan[key] for key in ("codigo", "nome", "preco_mensal_centavos")}
    subscription["categorias"] = categories
    return success(subscription)


@app.get("/api/assinaturas/atual")
def current_subscription(user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT a.id, a.situacao, a.metodo_pagamento, a.data_inicio, a.data_vencimento, a.data_criacao, p.codigo AS codigo_plano, p.nome AS nome_plano FROM assinaturas a JOIN planos p ON p.id = a.plano_id WHERE a.atleta_id = %s AND a.situacao IN ('ativa', 'pendente_pagamento') ORDER BY a.data_criacao DESC LIMIT 1", (user["id"],))
        row = cur.fetchone()
    return success(row)


@app.get("/api/assinaturas", summary="Listar meu histórico de assinaturas")
def subscription_history(user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT a.id, a.situacao, a.metodo_pagamento, a.referencia_pagamento,
                   a.data_inicio, a.data_vencimento, a.data_criacao,
                   p.codigo AS codigo_plano, p.nome AS nome_plano,
                   p.preco_mensal_centavos
            FROM assinaturas a
            JOIN planos p ON p.id = a.plano_id
            WHERE a.atleta_id = %s
            ORDER BY a.data_criacao DESC
            LIMIT 100
            """,
            (user["id"],),
        )
        rows = cur.fetchall()
        for row in rows:
            cur.execute(
                """
                SELECT c.id, c.nome
                FROM categorias c
                JOIN categorias_assinatura ca ON ca.categoria_id = c.id
                WHERE ca.assinatura_id = %s
                ORDER BY c.nome
                """,
                (row["id"],),
            )
            row["categorias"] = cur.fetchall()
    return success(rows)


@app.post("/api/assinaturas/{subscription_id}/cancelamento")
def cancel_subscription(subscription_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE assinaturas SET situacao = 'cancelada', data_atualizacao = now() WHERE id = %s AND atleta_id = %s AND situacao IN ('ativa', 'pendente_pagamento') RETURNING id, situacao, data_atualizacao", (subscription_id, user["id"]))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "SUBSCRIPTION_NOT_FOUND", "message": "Assinatura ativa ou pendente não encontrada para esta conta."})
    return success(row)


@app.get("/api/trilhas/publicas/{trail_id}")
def get_public_trail(trail_id: UUID):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, nome, privacidade, data_criacao, data_atualizacao FROM trilhas WHERE id = %s AND privacidade = 'publica'", (trail_id,))
        trail = cur.fetchone()
        if trail:
            cur.execute("SELECT video_id, ordem FROM videos_trilha WHERE trilha_id = %s ORDER BY ordem", (trail_id,))
            trail["videos"] = cur.fetchall()
    if not trail:
        raise HTTPException(404, detail={"code": "TRAIL_NOT_FOUND", "message": "Trilha pública não encontrada."})
    return success(trail)


@app.get("/api/trilhas/publicas", summary="Pesquisar trilhas públicas")
def list_public_trails(
    q: str | None = None,
    limite: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    clauses = ["t.privacidade = 'publica'"]
    params: list = []
    if q and q.strip():
        clauses.append("(t.nome ILIKE %s OR u.nome_completo ILIKE %s)")
        params.extend([f"%{q.strip()}%", f"%{q.strip()}%"])
    params.extend([limite, offset])
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT t.id, t.nome, t.data_criacao, t.data_atualizacao,
                   u.nome_completo AS criador,
                   count(vt.video_id)::int AS quantidade_videos
            FROM trilhas t
            JOIN usuarios u ON u.id = t.atleta_id
            LEFT JOIN videos_trilha vt ON vt.trilha_id = t.id
            WHERE {' AND '.join(clauses)}
            GROUP BY t.id, u.nome_completo
            ORDER BY t.data_atualizacao DESC
            LIMIT %s OFFSET %s
            """,
            params,
        )
        rows = cur.fetchall()
    return success(rows)


@app.get("/api/trilhas")
def list_trails(user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT t.id, t.nome, t.privacidade, t.data_criacao, t.data_atualizacao, count(vt.video_id)::int AS quantidade_videos FROM trilhas t LEFT JOIN videos_trilha vt ON vt.trilha_id = t.id WHERE t.atleta_id = %s GROUP BY t.id ORDER BY t.data_atualizacao DESC", (user["id"],))
        rows = cur.fetchall()
    return success(rows)


@app.post("/api/trilhas", status_code=status.HTTP_201_CREATED)
def create_trail(body: TrailRequest, user: Athlete):
    if body.privacidade not in {"privada", "publica"}:
        raise HTTPException(422, detail={"code": "INVALID_PRIVACY", "message": "Privacidade deve ser privada ou publica."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO trilhas (atleta_id, nome, privacidade) VALUES (%s, %s, %s) RETURNING id, nome, privacidade, data_criacao, data_atualizacao", (user["id"], body.nome.strip(), body.privacidade))
        row = cur.fetchone()
    return success(row)


@app.get("/api/trilhas/{trail_id}")
def get_trail(trail_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, nome, privacidade, data_criacao, data_atualizacao FROM trilhas WHERE id = %s AND atleta_id = %s", (trail_id, user["id"]))
        trail = cur.fetchone()
        if trail:
            cur.execute("SELECT vt.video_id, vt.ordem, COALESCE(pt.segundos_assistidos, 0) AS segundos_assistidos, COALESCE(pt.concluido, FALSE) AS concluido FROM videos_trilha vt LEFT JOIN progresso_trilha pt ON pt.trilha_id = vt.trilha_id AND pt.video_id = vt.video_id WHERE vt.trilha_id = %s ORDER BY vt.ordem", (trail_id,))
            trail["videos"] = cur.fetchall()
    if not trail:
        raise HTTPException(404, detail={"code": "TRAIL_NOT_FOUND", "message": "Trilha não encontrada."})
    return success(trail)


@app.put("/api/trilhas/{trail_id}", summary="Atualizar uma trilha")
@app.patch("/api/trilhas/{trail_id}", include_in_schema=False)
def update_trail(trail_id: UUID, body: TrailUpdate, user: Athlete):
    if body.privacidade is not None and body.privacidade not in {"privada", "publica"}:
        raise HTTPException(422, detail={"code": "INVALID_PRIVACY", "message": "Privacidade deve ser privada ou publica."})
    if body.nome is None and body.privacidade is None:
        raise HTTPException(422, detail={"code": "EMPTY_UPDATE", "message": "Informe nome ou privacidade para atualizar."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE trilhas SET nome = COALESCE(%s, nome), privacidade = COALESCE(%s, privacidade), data_atualizacao = now() WHERE id = %s AND atleta_id = %s RETURNING id, nome, privacidade, data_atualizacao", (body.nome.strip() if body.nome else None, body.privacidade, trail_id, user["id"]))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "TRAIL_NOT_FOUND", "message": "Trilha não encontrada."})
    return success(row)


@app.delete("/api/trilhas/{trail_id}", summary="Excluir uma trilha própria")
def delete_trail(trail_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM trilhas WHERE id = %s AND atleta_id = %s RETURNING id",
            (trail_id, user["id"]),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "TRAIL_NOT_FOUND", "message": "Trilha não encontrada."})
    return success({"id": row["id"], "excluida": True})


@app.post("/api/trilhas/{trail_id}/videos", status_code=status.HTTP_201_CREATED)
def add_trail_video(trail_id: UUID, body: dict, user: Athlete):
    try:
        video_id = UUID(str(body.get("video_id")))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(422, detail={"code": "INVALID_VIDEO_ID", "message": "video_id deve ser um UUID."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM trilhas WHERE id = %s AND atleta_id = %s FOR UPDATE", (trail_id, user["id"]))
        if not cur.fetchone():
            raise HTTPException(404, detail={"code": "TRAIL_NOT_FOUND", "message": "Trilha não encontrada."})
        cur.execute("SELECT COALESCE(max(ordem), 0) + 1 AS next_order FROM videos_trilha WHERE trilha_id = %s", (trail_id,))
        order = cur.fetchone()["next_order"]
        try:
            cur.execute("INSERT INTO videos_trilha (trilha_id, video_id, ordem) VALUES (%s, %s, %s) RETURNING trilha_id, video_id, ordem", (trail_id, video_id, order))
            row = cur.fetchone()
        except (ForeignKeyViolation, UniqueViolation):
            raise HTTPException(409, detail={"code": "VIDEO_NOT_AVAILABLE", "message": "Vídeo inexistente ou já presente na trilha."})
    return success(row)


@app.delete("/api/trilhas/{trail_id}/videos/{video_id}")
def remove_trail_video(trail_id: UUID, video_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM videos_trilha vt USING trilhas t WHERE vt.trilha_id = t.id AND t.atleta_id = %s AND vt.trilha_id = %s AND vt.video_id = %s RETURNING vt.video_id", (user["id"], trail_id, video_id))
        row = cur.fetchone()
        if row:
            cur.execute("UPDATE trilhas SET data_atualizacao = now() WHERE id = %s", (trail_id,))
    if not row:
        raise HTTPException(404, detail={"code": "TRAIL_VIDEO_NOT_FOUND", "message": "Vídeo não encontrado na trilha."})
    return success({"removed": str(row["video_id"])})


@app.put("/api/trilhas/{trail_id}/videos/{video_id}/progresso")
def update_progress(trail_id: UUID, video_id: UUID, body: ProgressRequest, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO progresso_trilha (trilha_id, video_id, segundos_assistidos, concluido) SELECT vt.trilha_id, vt.video_id, %s, %s FROM videos_trilha vt JOIN trilhas t ON t.id = vt.trilha_id WHERE t.atleta_id = %s AND vt.trilha_id = %s AND vt.video_id = %s ON CONFLICT (trilha_id, video_id) DO UPDATE SET segundos_assistidos = EXCLUDED.segundos_assistidos, concluido = EXCLUDED.concluido, data_atualizacao = now() RETURNING trilha_id, video_id, segundos_assistidos, concluido, data_atualizacao", (body.segundos_assistidos, body.concluido, user["id"], trail_id, video_id))
        row = cur.fetchone()
        if row:
            cur.execute("UPDATE trilhas SET data_atualizacao = now() WHERE id = %s", (trail_id,))
    if not row:
        raise HTTPException(404, detail={"code": "TRAIL_VIDEO_NOT_FOUND", "message": "Vídeo não encontrado na trilha."})
    return success(row)
