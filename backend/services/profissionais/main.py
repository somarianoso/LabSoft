from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from psycopg.errors import UniqueViolation

from backend.services.shared import clients, eventos
from backend.services.shared.auth import require_role, require_service
from backend.services.shared.config import configure_app, success
from backend.services.shared.database import connection_factory
from backend.services.shared.errors import install_error_handlers

app = FastAPI(title="WellFlix — Profissionais e moderação", version="1.0.0")
configure_app(app)
install_error_handlers(app)
SERVICE = "profissionais"
connection = connection_factory(SERVICE)
Professional = Annotated[dict, Depends(require_role("profissional"))]
Moderator = Annotated[dict, Depends(require_role("moderador"))]
Athlete = Annotated[dict, Depends(require_role("atleta"))]
Service = Annotated[str, Depends(require_service)]
INTERNAL = ["interno (serviço a serviço)"]

eventos.start_event_workers(
    app, SERVICE, produces=True,
    handlers={**eventos.USUARIO_HANDLERS, **eventos.CATEGORIA_HANDLERS},
)


class ProfessionalProfile(BaseModel):
    especialidade: str | None = Field(default=None, max_length=150)
    biografia: str | None = Field(default=None, max_length=2000)
    categorias: list[UUID] = Field(default_factory=list)


class ReviewDecision(BaseModel):
    situacao: str
    observacao: str | None = Field(default=None, max_length=1000)


@app.get("/health")
def health():
    return success({"status": "ok", "service": "profissionais"})


# Perfil + seguidores + nome (réplica de usuários). Vídeos e avaliações são do
# catálogo e vêm pela API dele (rota interna de estatísticas).
PROFILE_SQL = """
    SELECT p.usuario_id AS id, u.nome_completo, p.especialidade, p.biografia,
           (SELECT count(*) FROM seguimentos_profissional s WHERE s.profissional_id = p.usuario_id)::int AS seguidores
    FROM profissionais p
    LEFT JOIN usuarios_replica u ON u.id = p.usuario_id
"""


def categories_of(cur, professional_id) -> list[dict]:
    cur.execute(
        "SELECT c.id, c.nome FROM categorias_profissional cp JOIN categorias_replica c ON c.id = cp.categoria_id"
        " WHERE cp.profissional_id = %s ORDER BY c.nome",
        (professional_id,),
    )
    return cur.fetchall()


def enrich(cur, rows: list[dict], videos_key: str) -> list[dict]:
    """Completa os perfis com categorias (local) e estatísticas de vídeos (catálogo)."""
    for row in rows:
        row["categorias"] = categories_of(cur, row["id"])
    stats = {}
    if rows:
        ids = ",".join(str(row["id"]) for row in rows)
        stats = {str(item["profissional_id"]): item for item in clients.call(
            "catalogo", "GET", "/internal/profissionais/estatisticas", caller=SERVICE, params={"ids": ids},
        )}
    for row in rows:
        item = stats.get(str(row["id"]), {})
        row[videos_key] = item.get("quantidade_videos", 0)
        row["avaliacao_media"] = item.get("avaliacao_media", 0.0)
    return rows


def validate_categories(cur, category_ids: set[UUID]) -> None:
    if not category_ids:
        return
    cur.execute("SELECT count(*) AS total FROM categorias_replica WHERE id = ANY(%s)", (list(category_ids),))
    if cur.fetchone()["total"] != len(category_ids):
        raise HTTPException(422, detail={"code": "UNKNOWN_CATEGORY", "message": "Uma ou mais categorias não existem."})


@app.get("/api/profissionais")
def list_professionals():
    with connection() as conn, conn.cursor() as cur:
        cur.execute(PROFILE_SQL + " ORDER BY u.nome_completo")
        rows = enrich(cur, cur.fetchall(), "videos")
    return success(rows)


@app.get("/api/profissionais/me")
def my_profile(user: Professional):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT usuario_id AS id, especialidade, biografia, data_atualizacao FROM profissionais WHERE usuario_id = %s", (user["id"],))
        row = cur.fetchone()
        if row:
            row["categorias"] = categories_of(cur, user["id"])
    if not row:
        raise HTTPException(404, detail={"code": "PROFILE_NOT_FOUND", "message": "Perfil profissional não encontrado."})
    # E-mail não sai do serviço de identidade em eventos: consulta a API dele
    # repassando o token do próprio usuário.
    account = clients.call("identidade", "GET", "/api/usuarios/me", caller=SERVICE, user_token=user["token"], forward_errors=True)
    return success({"id": row["id"], "nome_completo": account["nome_completo"], "email": account["email"], **{k: row[k] for k in ("especialidade", "biografia", "data_atualizacao", "categorias")}})


def save_categories(cur, user_id: str, categories: set[UUID]) -> None:
    cur.execute("DELETE FROM categorias_profissional WHERE profissional_id = %s", (user_id,))
    if categories:
        cur.executemany("INSERT INTO categorias_profissional (profissional_id, categoria_id) VALUES (%s, %s)", [(user_id, category_id) for category_id in categories])


@app.put("/api/profissionais/me")
def upsert_profile(body: ProfessionalProfile, user: Professional):
    categories = set(body.categorias)
    with connection() as conn, conn.cursor() as cur:
        validate_categories(cur, categories)
        cur.execute("INSERT INTO profissionais (usuario_id, especialidade, biografia) VALUES (%s, %s, %s) ON CONFLICT (usuario_id) DO UPDATE SET especialidade = EXCLUDED.especialidade, biografia = EXCLUDED.biografia, data_atualizacao = now() RETURNING usuario_id, especialidade, biografia, data_atualizacao", (user["id"], body.especialidade, body.biografia))
        profile = cur.fetchone()
        save_categories(cur, user["id"], categories)
    return success(profile)


@app.post("/api/profissionais/me", status_code=status.HTTP_201_CREATED, summary="Criar meu perfil profissional")
def create_profile(body: ProfessionalProfile, user: Professional):
    categories = set(body.categorias)
    try:
        with connection() as conn, conn.cursor() as cur:
            validate_categories(cur, categories)
            cur.execute(
                "INSERT INTO profissionais (usuario_id, especialidade, biografia) VALUES (%s, %s, %s) RETURNING usuario_id, especialidade, biografia, data_criacao, data_atualizacao",
                (user["id"], body.especialidade, body.biografia),
            )
            profile = cur.fetchone()
            save_categories(cur, user["id"], categories)
    except UniqueViolation:
        raise HTTPException(409, detail={"code": "PROFILE_ALREADY_EXISTS", "message": "Este usuário já possui um perfil profissional. Use PUT para atualizá-lo."})
    return success(profile)


@app.get("/api/profissionais/me/seguindo", summary="Listar profissionais que sigo")
def followed_professionals(user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            PROFILE_SQL + " JOIN seguimentos_profissional meu ON meu.profissional_id = p.usuario_id WHERE meu.seguidor_id = %s ORDER BY u.nome_completo",
            (user["id"],),
        )
        rows = enrich(cur, cur.fetchall(), "quantidade_videos")
    return success(rows)


@app.get("/api/profissionais/{professional_id}")
def professional_detail(professional_id: UUID):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(PROFILE_SQL + " WHERE p.usuario_id = %s", (professional_id,))
        row = cur.fetchone()
        if row:
            enrich(cur, [row], "quantidade_videos")
    if not row:
        raise HTTPException(404, detail={"code": "PROFILE_NOT_FOUND", "message": "Profissional não encontrado."})
    videos = clients.call("catalogo", "GET", f"/internal/profissionais/{professional_id}/videos", caller=SERVICE)
    for video in videos:
        video["profissional"] = row["nome_completo"]
    row["videos"] = videos
    return success(row)


@app.get("/api/profissionais/{professional_id}/seguir")
def follow_status(professional_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT EXISTS (SELECT 1 FROM profissionais WHERE usuario_id = %s) AS profissional_existe, "
            "EXISTS (SELECT 1 FROM seguimentos_profissional WHERE profissional_id = %s AND seguidor_id = %s) AS seguindo",
            (professional_id, professional_id, user["id"]),
        )
        row = cur.fetchone()
    if not row["profissional_existe"]:
        raise HTTPException(404, detail={"code": "PROFILE_NOT_FOUND", "message": "Profissional não encontrado."})
    return success({"profissional_id": str(professional_id), "seguindo": row["seguindo"]})


@app.post("/api/profissionais/{professional_id}/seguir", status_code=status.HTTP_201_CREATED)
def follow_professional(professional_id: UUID, user: Athlete):
    if str(professional_id) == user["id"]:
        raise HTTPException(409, detail={"code": "SELF_FOLLOW_NOT_ALLOWED", "message": "Não é possível seguir a própria conta."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO seguimentos_profissional (profissional_id, seguidor_id) SELECT %s, %s WHERE EXISTS (SELECT 1 FROM profissionais WHERE usuario_id = %s) ON CONFLICT DO NOTHING RETURNING profissional_id, seguidor_id, data_criacao", (professional_id, user["id"], professional_id))
        row = cur.fetchone()
        if not row:
            cur.execute("SELECT 1 FROM profissionais WHERE usuario_id = %s", (professional_id,))
            if not cur.fetchone():
                raise HTTPException(404, detail={"code": "PROFILE_NOT_FOUND", "message": "Profissional não encontrado."})
    return success(row or {"profissional_id": str(professional_id), "seguindo": True})


@app.delete("/api/profissionais/{professional_id}/seguir")
def unfollow_professional(professional_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM seguimentos_profissional WHERE profissional_id = %s AND seguidor_id = %s RETURNING profissional_id", (professional_id, user["id"]))
        row = cur.fetchone()
    return success({"profissional_id": str(professional_id), "seguindo": False, "removido": row is not None})


@app.get("/api/moderacao/videos")
def moderation_queue(user: Moderator, situacao: str = "aguardando_revisao"):
    allowed = {"aguardando_revisao", "publicado", "rejeitado"}
    if situacao not in allowed:
        raise HTTPException(422, detail={"code": "INVALID_STATUS", "message": "Estado de moderação inválido."})
    rows = clients.call("catalogo", "GET", "/internal/videos", caller=SERVICE, params={"situacao": situacao})
    return success(rows)


@app.post("/api/moderacao/videos/{video_id}/decisao")
def review_video(video_id: UUID, body: ReviewDecision, user: Moderator):
    if body.situacao not in {"aprovado", "rejeitado"}:
        raise HTTPException(422, detail={"code": "INVALID_DECISION", "message": "A decisão deve ser aprovado ou rejeitado."})
    next_status = "publicado" if body.situacao == "aprovado" else "rejeitado"
    # A revisão é gravada aqui; o vídeo é do catálogo e muda de situação pela
    # API dele. Se o catálogo recusar, a transação local é desfeita.
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO revisoes_video (video_id, moderador_id, situacao, observacao) VALUES (%s, %s, %s, %s) RETURNING id, video_id, moderador_id, situacao, observacao, data_criacao", (video_id, user["id"], body.situacao, body.observacao))
        review = cur.fetchone()
        video = clients.call("catalogo", "POST", f"/internal/videos/{video_id}/moderacao", caller=SERVICE, json={"situacao": next_status}, forward_errors=True)
    return success({"video": video, "revisao": review})


@app.delete("/api/moderacao/videos/{video_id}")
def archive_video(video_id: UUID, user: Moderator):
    row = clients.call("catalogo", "POST", f"/internal/videos/{video_id}/arquivamento", caller=SERVICE, forward_errors=True)
    return success(row)


# --- Rotas internas (chamadas por outros serviços com token de serviço) -----


@app.get("/internal/categorias/{category_id}/uso", tags=INTERNAL, summary="A categoria está em uso por algum profissional?")
def internal_category_usage(category_id: UUID, _service: Service):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT EXISTS (SELECT 1 FROM categorias_profissional WHERE categoria_id = %s) AS em_uso", (category_id,))
        row = cur.fetchone()
    return success(row)
