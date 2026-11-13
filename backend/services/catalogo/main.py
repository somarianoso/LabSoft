from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from psycopg.errors import ForeignKeyViolation, UniqueViolation

from backend.services.shared import clients, eventos
from backend.services.shared.auth import require_role, require_service
from backend.services.shared.config import configure_app, success
from backend.services.shared.database import connection_factory
from backend.services.shared.errors import install_error_handlers

app = FastAPI(title="WellFlix — Catálogo e conteúdo", version="1.0.0")
configure_app(app)
install_error_handlers(app)
SERVICE = "catalogo"
connection = connection_factory(SERVICE)
Athlete = Annotated[dict, Depends(require_role("atleta"))]
Professional = Annotated[dict, Depends(require_role("profissional"))]
Moderator = Annotated[dict, Depends(require_role("moderador"))]
Service = Annotated[str, Depends(require_service)]
INTERNAL = ["interno (serviço a serviço)"]


class VideoSubmission(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    descricao: str | None = Field(default=None, max_length=2000)
    duracao_segundos: int = Field(gt=0)
    url_conteudo: str = Field(min_length=1, max_length=2000)
    categorias: list[UUID] = Field(default_factory=list)

    @field_validator("titulo")
    @classmethod
    def validate_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe o título do vídeo.")
        return normalized

    @field_validator("url_conteudo")
    @classmethod
    def validate_media_url(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe a URL do conteúdo.")
        return normalized


class CommentRequest(BaseModel):
    conteudo: str = Field(min_length=1, max_length=2000)

    @field_validator("conteudo")
    @classmethod
    def validate_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("O comentário não pode ficar vazio.")
        return normalized


class RatingRequest(BaseModel):
    gostou: bool


class CategoryRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=100)

    @field_validator("nome")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("O nome da categoria deve ter pelo menos dois caracteres.")
        return normalized


class CategoryUpdate(BaseModel):
    nome: str = Field(min_length=2, max_length=100)

    @field_validator("nome")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("O nome da categoria deve ter pelo menos dois caracteres.")
        return normalized


class ModerationDecision(BaseModel):
    situacao: str


def user_names(ids) -> dict[str, str]:
    """Nomes dos usuários pela réplica local (alimentada pelo tópico wellflix.identidade.usuarios)."""
    unique = list({str(item) for item in ids if item})
    if not unique:
        return {}
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, nome_completo FROM usuarios_replica WHERE id = ANY(%s::uuid[])", (unique,))
        return {str(row["id"]): row["nome_completo"] for row in cur.fetchall()}


def with_user_names(rows: list[dict], id_key: str, name_key: str) -> list[dict]:
    names = user_names(row[id_key] for row in rows)
    for row in rows:
        row[name_key] = names.get(str(row[id_key]))
    return rows


def authorized_categories(user_id: str) -> set[UUID] | None:
    """Categorias autorizadas do profissional pela réplica local (tópico wellflix.profissionais.perfis).

    Devolve None quando o usuário ainda não tem perfil profissional.
    """
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT categorias FROM profissionais_replica WHERE usuario_id = %s", (user_id,))
        row = cur.fetchone()
    return None if row is None else set(row["categorias"])


def upsert_profissional(cur, dados: dict) -> None:
    cur.execute(
        "INSERT INTO profissionais_replica (usuario_id, categorias, atualizado_em) VALUES (%s, %s::uuid[], now())"
        " ON CONFLICT (usuario_id) DO UPDATE SET categorias = EXCLUDED.categorias, atualizado_em = now()",
        (dados["usuario_id"], dados["categorias"]),
    )


def delete_profissional(cur, dados: dict) -> None:
    cur.execute("DELETE FROM profissionais_replica WHERE usuario_id = %s", (dados["usuario_id"],))


eventos.start_event_workers(
    app, SERVICE, produces=True,
    handlers={
        **eventos.USUARIO_HANDLERS,
        "perfil.atualizado": upsert_profissional,
        "perfil.removido": delete_profissional,
    },
)


@app.get("/health")
def health():
    return success({"status": "ok", "service": "catalogo"})


@app.get("/api/categorias")
def list_categories():
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, nome FROM categorias ORDER BY nome")
        rows = cur.fetchall()
    return success(rows)


@app.get("/api/categorias/{category_id}", summary="Consultar categoria e quantidade de vídeos")
def get_category(category_id: UUID):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.nome, count(DISTINCT v.id)::int AS quantidade_videos
            FROM categorias c
            LEFT JOIN categorias_video cv ON cv.categoria_id = c.id
            LEFT JOIN videos v ON v.id = cv.video_id AND v.situacao = 'publicado'
            WHERE c.id = %s
            GROUP BY c.id
            """,
            (category_id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "CATEGORY_NOT_FOUND", "message": "Categoria não encontrada."})
    return success(row)


@app.post("/api/categorias", status_code=status.HTTP_201_CREATED, summary="Cadastrar categoria (moderador)")
def create_category(body: CategoryRequest, _user: Moderator):
    try:
        with connection() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO categorias (nome) VALUES (%s) RETURNING id, nome, data_criacao",
                (body.nome,),
            )
            row = cur.fetchone()
    except UniqueViolation:
        raise HTTPException(409, detail={"code": "CATEGORY_ALREADY_EXISTS", "message": "Já existe uma categoria com esse nome."})
    return success(row)


@app.put("/api/categorias/{category_id}", summary="Atualizar categoria (moderador)")
def update_category(category_id: UUID, body: CategoryUpdate, _user: Moderator):
    try:
        with connection() as conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE categorias SET nome = %s WHERE id = %s RETURNING id, nome, data_criacao",
                (body.nome, category_id),
            )
            row = cur.fetchone()
    except UniqueViolation:
        raise HTTPException(409, detail={"code": "CATEGORY_ALREADY_EXISTS", "message": "Já existe uma categoria com esse nome."})
    if not row:
        raise HTTPException(404, detail={"code": "CATEGORY_NOT_FOUND", "message": "Categoria não encontrada."})
    return success(row)


@app.delete("/api/categorias/{category_id}", summary="Excluir categoria sem uso (moderador)")
def delete_category(category_id: UUID, _user: Moderator):
    # Assinaturas (conta) e perfis profissionais também usam categorias; sem FK
    # entre bancos, a checagem de uso é feita perguntando a cada serviço.
    for service in ("profissionais", "conta"):
        usage = clients.call(service, "GET", f"/internal/categorias/{category_id}/uso", caller=SERVICE)
        if usage["em_uso"]:
            raise HTTPException(409, detail={"code": "CATEGORY_IN_USE", "message": "A categoria está vinculada a vídeos, assinaturas ou profissionais."})
    try:
        with connection() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM categorias WHERE id = %s RETURNING id", (category_id,))
            row = cur.fetchone()
    except ForeignKeyViolation:
        raise HTTPException(409, detail={"code": "CATEGORY_IN_USE", "message": "A categoria está vinculada a vídeos, assinaturas ou profissionais."})
    if not row:
        raise HTTPException(404, detail={"code": "CATEGORY_NOT_FOUND", "message": "Categoria não encontrada."})
    return success({"id": row["id"], "excluida": True})


@app.get("/api/videos/me")
def my_submissions(user: Professional):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, titulo, descricao, duracao_segundos, url_conteudo, situacao, data_criacao, data_atualizacao FROM videos WHERE profissional_id = %s ORDER BY data_criacao DESC", (user["id"],))
        rows = cur.fetchall()
    return success(rows)


@app.get("/api/videos")
def list_videos(q: str | None = None, categoria: str | None = None, avaliacao_minima: float | None = Query(default=None, ge=0, le=1), limite: int = Query(default=30, ge=1, le=100), offset: int = Query(default=0, ge=0)):
    clauses = ["v.situacao = 'publicado'"]
    params: list = []
    if q and q.strip():
        clauses.append("(v.titulo ILIKE %s OR COALESCE(v.descricao, '') ILIKE %s)")
        params.extend([f"%{q.strip()}%", f"%{q.strip()}%"])
    if categoria and categoria.strip():
        clauses.append("EXISTS (SELECT 1 FROM categorias_video cv JOIN categorias c ON c.id = cv.categoria_id WHERE cv.video_id = v.id AND c.nome = %s)")
        params.append(categoria.strip())
    where = " AND ".join(clauses)
    sql = f"SELECT v.id, v.titulo, v.descricao, v.profissional_id, v.duracao_segundos, v.url_conteudo, v.data_publicacao, COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float AS avaliacao_media, count(DISTINCT a.usuario_id)::int AS total_avaliacoes FROM videos v LEFT JOIN avaliacoes a ON a.video_id = v.id WHERE {where} GROUP BY v.id"
    if avaliacao_minima is not None:
        sql += " HAVING COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0) >= %s"
        params.append(avaliacao_minima)
    sql += " ORDER BY v.data_publicacao DESC NULLS LAST LIMIT %s OFFSET %s"
    params.extend([limite, offset])
    with connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()
        for row in rows:
            cur.execute("SELECT c.id, c.nome FROM categorias c JOIN categorias_video cv ON cv.categoria_id = c.id WHERE cv.video_id = %s ORDER BY c.nome", (row["id"],))
            row["categorias"] = cur.fetchall()
    return success(with_user_names(rows, "profissional_id", "profissional"))


@app.get("/api/videos/{video_id}")
def get_video(video_id: UUID):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT v.id, v.titulo, v.descricao, v.profissional_id, v.duracao_segundos, v.url_conteudo, v.data_publicacao, COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float AS avaliacao_media, count(DISTINCT a.usuario_id)::int AS total_avaliacoes FROM videos v LEFT JOIN avaliacoes a ON a.video_id = v.id WHERE v.id = %s AND v.situacao = 'publicado' GROUP BY v.id", (video_id,))
        row = cur.fetchone()
        if row:
            cur.execute("SELECT c.id, c.nome FROM categorias c JOIN categorias_video cv ON cv.categoria_id = c.id WHERE cv.video_id = %s ORDER BY c.nome", (video_id,))
            row["categorias"] = cur.fetchall()
            cur.execute("SELECT id, conteudo, data_criacao, usuario_id FROM comentarios WHERE video_id = %s ORDER BY data_criacao DESC LIMIT 100", (video_id,))
            row["comentarios"] = cur.fetchall()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado ou ainda não publicado."})
    names = user_names([row["profissional_id"]] + [c["usuario_id"] for c in row["comentarios"]])
    row["profissional"] = names.get(str(row["profissional_id"]))
    for comment in row["comentarios"]:
        comment["usuario"] = names.get(str(comment["usuario_id"]))
    return success(row)


@app.get("/api/videos/{video_id}/comentarios", summary="Listar comentários de um vídeo")
def list_video_comments(
    video_id: UUID,
    limite: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM videos WHERE id = %s AND situacao = 'publicado'",
            (video_id,),
        )
        if not cur.fetchone():
            raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado ou ainda não publicado."})
        cur.execute(
            """
            SELECT id, conteudo, data_criacao, usuario_id
            FROM comentarios
            WHERE video_id = %s
            ORDER BY data_criacao DESC
            LIMIT %s OFFSET %s
            """,
            (video_id, limite, offset),
        )
        rows = cur.fetchall()
    return success(with_user_names(rows, "usuario_id", "usuario"))


@app.get("/api/videos/{video_id}/avaliacoes/resumo", summary="Consultar resumo das avaliações")
def video_rating_summary(video_id: UUID):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float AS avaliacao_media,
                   count(a.usuario_id)::int AS total_avaliacoes,
                   count(*) FILTER (WHERE a.gostou)::int AS total_gostaram,
                   count(*) FILTER (WHERE NOT a.gostou)::int AS total_nao_gostaram
            FROM videos v
            LEFT JOIN avaliacoes a ON a.video_id = v.id
            WHERE v.id = %s AND v.situacao = 'publicado'
            GROUP BY v.id
            """,
            (video_id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado ou ainda não publicado."})
    return success(row)


@app.get("/api/videos/{video_id}/proximos")
def next_videos(video_id: UUID, limite: int = Query(default=6, ge=1, le=20)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM videos WHERE id = %s AND situacao = 'publicado'", (video_id,))
        if not cur.fetchone():
            raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado."})
        cur.execute("SELECT DISTINCT v.id, v.titulo, v.descricao, v.profissional_id, v.duracao_segundos, v.url_conteudo, v.data_publicacao FROM videos v JOIN categorias_video cv ON cv.video_id = v.id WHERE v.situacao = 'publicado' AND v.id <> %s AND cv.categoria_id IN (SELECT categoria_id FROM categorias_video WHERE video_id = %s) ORDER BY v.data_publicacao DESC NULLS LAST LIMIT %s", (video_id, video_id, limite))
        rows = cur.fetchall()
    return success(with_user_names(rows, "profissional_id", "profissional"))


@app.post("/api/videos/{video_id}/comentarios", status_code=status.HTTP_201_CREATED)
def add_comment(video_id: UUID, body: CommentRequest, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO comentarios (video_id, usuario_id, conteudo) SELECT %s, %s, %s WHERE EXISTS (SELECT 1 FROM videos WHERE id = %s AND situacao = 'publicado') RETURNING id, video_id, usuario_id, conteudo, data_criacao", (video_id, user["id"], body.conteudo.strip(), video_id))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo publicado não encontrado."})
    return success(row)


@app.put("/api/videos/{video_id}/comentarios/{comment_id}", summary="Editar meu comentário")
def update_comment(video_id: UUID, comment_id: UUID, body: CommentRequest, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE comentarios SET conteudo = %s WHERE id = %s AND video_id = %s AND usuario_id = %s RETURNING id, video_id, usuario_id, conteudo, data_criacao",
            (body.conteudo, comment_id, video_id, user["id"]),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "COMMENT_NOT_FOUND", "message": "Comentário não encontrado nesta conta/vídeo."})
    return success(row)


@app.delete("/api/videos/{video_id}/comentarios/{comment_id}", summary="Excluir meu comentário")
def delete_comment(video_id: UUID, comment_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM comentarios WHERE id = %s AND video_id = %s AND usuario_id = %s RETURNING id",
            (comment_id, video_id, user["id"]),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "COMMENT_NOT_FOUND", "message": "Comentário não encontrado nesta conta/vídeo."})
    return success({"id": row["id"], "excluido": True})


@app.put("/api/videos/{video_id}/avaliacao")
def rate_video(video_id: UUID, body: RatingRequest, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO avaliacoes (video_id, usuario_id, gostou) SELECT %s, %s, %s WHERE EXISTS (SELECT 1 FROM videos WHERE id = %s AND situacao = 'publicado') ON CONFLICT (video_id, usuario_id) DO UPDATE SET gostou = EXCLUDED.gostou, data_atualizacao = now() RETURNING video_id, usuario_id, gostou, data_atualizacao", (video_id, user["id"], body.gostou, video_id))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo publicado não encontrado."})
    return success(row)


@app.delete("/api/videos/{video_id}/avaliacao", summary="Remover minha avaliação")
def delete_rating(video_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM avaliacoes WHERE video_id = %s AND usuario_id = %s RETURNING video_id",
            (video_id, user["id"]),
        )
        row = cur.fetchone()
    return success({"video_id": str(video_id), "excluida": row is not None})


@app.get("/api/videos/{video_id}/avaliacao/me")
def my_video_rating(video_id: UUID, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT gostou FROM avaliacoes WHERE video_id = %s AND usuario_id = %s",
            (video_id, user["id"]),
        )
        row = cur.fetchone()
    return success(row)


@app.post("/api/videos", status_code=status.HTTP_201_CREATED)
def submit_video(body: VideoSubmission, user: Professional):
    if not body.url_conteudo.startswith(("https://", "http://")):
        raise HTTPException(422, detail={"code": "INVALID_MEDIA_URL", "message": "Use uma URL HTTPS/HTTP de mídia armazenada fora do PostgreSQL."})
    categories = list(dict.fromkeys(body.categorias))
    authorized = authorized_categories(user["id"])
    if authorized is None:
        raise HTTPException(403, detail={"code": "PROFESSIONAL_PROFILE_REQUIRED", "message": "Perfil profissional não encontrado."})
    if not set(categories) <= authorized:
        raise HTTPException(403, detail={"code": "CATEGORY_NOT_AUTHORIZED", "message": "O profissional só pode publicar nas categorias autorizadas."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO videos (profissional_id, titulo, descricao, duracao_segundos, url_conteudo, situacao) VALUES (%s, %s, %s, %s, %s, 'aguardando_revisao') RETURNING id, profissional_id, titulo, descricao, duracao_segundos, url_conteudo, situacao, data_criacao", (user["id"], body.titulo.strip(), body.descricao, body.duracao_segundos, body.url_conteudo))
        video = cur.fetchone()
        if categories:
            cur.executemany("INSERT INTO categorias_video (video_id, categoria_id) VALUES (%s, %s)", [(video["id"], category_id) for category_id in categories])
    return success(video)


@app.put("/api/videos/{video_id}", summary="Atualizar meu vídeo ainda não publicado")
def update_video(video_id: UUID, body: VideoSubmission, user: Professional):
    if not body.url_conteudo.startswith(("https://", "http://")):
        raise HTTPException(422, detail={"code": "INVALID_MEDIA_URL", "message": "Use uma URL HTTPS/HTTP de mídia."})
    categories = list(dict.fromkeys(body.categorias))
    if categories:
        authorized = authorized_categories(user["id"]) or set()
        if not set(categories) <= authorized:
            raise HTTPException(403, detail={"code": "CATEGORY_NOT_AUTHORIZED", "message": "O profissional só pode usar categorias autorizadas."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT situacao FROM videos WHERE id = %s AND profissional_id = %s FOR UPDATE",
            (video_id, user["id"]),
        )
        current = cur.fetchone()
        if not current:
            raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado nesta conta."})
        if current["situacao"] not in {"rascunho", "aguardando_revisao", "rejeitado"}:
            raise HTTPException(409, detail={"code": "VIDEO_NOT_EDITABLE", "message": "Somente vídeos não publicados podem ser editados."})
        cur.execute(
            "UPDATE videos SET titulo = %s, descricao = %s, duracao_segundos = %s, url_conteudo = %s, situacao = 'aguardando_revisao', data_atualizacao = now() WHERE id = %s RETURNING id, profissional_id, titulo, descricao, duracao_segundos, url_conteudo, situacao, data_atualizacao",
            (body.titulo, body.descricao, body.duracao_segundos, body.url_conteudo, video_id),
        )
        video = cur.fetchone()
        cur.execute("DELETE FROM categorias_video WHERE video_id = %s", (video_id,))
        if categories:
            cur.executemany(
                "INSERT INTO categorias_video (video_id, categoria_id) VALUES (%s, %s)",
                [(video_id, category_id) for category_id in categories],
            )
    return success(video)


@app.delete("/api/videos/{video_id}", summary="Excluir meu vídeo não publicado")
def delete_video(video_id: UUID, user: Professional):
    # Trilhas (serviço de conta) só aceitam vídeos publicados, e vídeos
    # publicados não podem ser excluídos: não há trilha apontando para este vídeo.
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM videos WHERE id = %s AND profissional_id = %s AND situacao IN ('rascunho', 'aguardando_revisao', 'rejeitado') RETURNING id",
            (video_id, user["id"]),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND_OR_NOT_DELETABLE", "message": "Vídeo não encontrado nesta conta ou já publicado/arquivado."})
    return success({"id": row["id"], "excluido": True})


# --- Rotas internas (chamadas por outros serviços com token de serviço) -----


@app.get("/internal/videos/{video_id}", tags=INTERNAL, summary="Situação de um vídeo")
def internal_video(video_id: UUID, _service: Service):
    """Usada pelo serviço de conta para validar vídeos adicionados a trilhas."""
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, profissional_id, titulo, situacao FROM videos WHERE id = %s", (video_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado."})
    return success(row)


@app.get("/internal/videos", tags=INTERNAL, summary="Vídeos por situação (fila de moderação)")
def internal_videos_by_status(_service: Service, situacao: str = "aguardando_revisao"):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT v.id, v.titulo, v.descricao, v.duracao_segundos, v.url_conteudo, v.situacao, v.data_criacao, v.profissional_id, COALESCE(array_agg(DISTINCT c.nome) FILTER (WHERE c.nome IS NOT NULL), '{}') AS categorias FROM videos v LEFT JOIN categorias_video cv ON cv.video_id = v.id LEFT JOIN categorias c ON c.id = cv.categoria_id WHERE v.situacao = %s GROUP BY v.id ORDER BY v.data_criacao", (situacao,))
        rows = cur.fetchall()
    return success(with_user_names(rows, "profissional_id", "profissional"))


@app.post("/internal/videos/{video_id}/moderacao", tags=INTERNAL, summary="Publicar ou rejeitar vídeo pendente")
def internal_moderate_video(video_id: UUID, body: ModerationDecision, _service: Service):
    if body.situacao not in {"publicado", "rejeitado"}:
        raise HTTPException(422, detail={"code": "INVALID_STATUS", "message": "A situação deve ser publicado ou rejeitado."})
    with connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE videos SET situacao = %s, data_publicacao = CASE WHEN %s = 'publicado' THEN now() ELSE NULL END, data_atualizacao = now() WHERE id = %s AND situacao = 'aguardando_revisao' RETURNING id, titulo, situacao", (body.situacao, body.situacao, video_id))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "PENDING_VIDEO_NOT_FOUND", "message": "Vídeo pendente não encontrado."})
    return success(row)


@app.post("/internal/videos/{video_id}/arquivamento", tags=INTERNAL, summary="Arquivar vídeo")
def internal_archive_video(video_id: UUID, _service: Service):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE videos SET situacao = 'arquivado', data_atualizacao = now() WHERE id = %s AND situacao <> 'arquivado' RETURNING id, titulo, situacao, data_atualizacao", (video_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado ou já arquivado."})
    return success(row)


@app.get("/internal/profissionais/estatisticas", tags=INTERNAL, summary="Vídeos publicados e avaliação média por profissional")
def internal_professional_stats(ids: str, _service: Service):
    try:
        parsed = [str(UUID(item.strip())) for item in ids.split(",") if item.strip()]
    except ValueError:
        raise HTTPException(422, detail={"code": "INVALID_ID", "message": "ids deve ser uma lista de UUIDs separados por vírgula."})
    if not parsed:
        return success([])
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT v.profissional_id,
                   count(DISTINCT v.id)::int AS quantidade_videos,
                   COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float AS avaliacao_media
            FROM videos v
            LEFT JOIN avaliacoes a ON a.video_id = v.id
            WHERE v.situacao = 'publicado' AND v.profissional_id = ANY(%s::uuid[])
            GROUP BY v.profissional_id
            """,
            (parsed,),
        )
        rows = cur.fetchall()
    return success(rows)


@app.get("/internal/profissionais/{professional_id}/videos", tags=INTERNAL, summary="Vídeos publicados de um profissional")
def internal_professional_videos(professional_id: UUID, _service: Service):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, profissional_id, titulo, descricao, duracao_segundos, url_conteudo, data_publicacao FROM videos WHERE profissional_id = %s AND situacao = 'publicado' ORDER BY data_publicacao DESC", (professional_id,))
        rows = cur.fetchall()
    return success(rows)
