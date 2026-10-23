from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from services.shared.auth import require_role
from services.shared.config import configure_app, success
from services.shared.database import connection
from services.shared.errors import install_error_handlers

app = FastAPI(title="WellFlix — Catálogo e conteúdo", version="1.0.0")
configure_app(app)
install_error_handlers(app)
Athlete = Annotated[dict, Depends(require_role("atleta"))]
Professional = Annotated[dict, Depends(require_role("profissional"))]


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


@app.get("/health")
def health():
    return success({"status": "ok", "service": "catalogo"})


@app.get("/api/categorias")
def list_categories():
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, nome FROM categorias ORDER BY nome")
        rows = cur.fetchall()
    return success(rows)


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
    sql = f"SELECT v.id, v.titulo, v.descricao, v.profissional_id, u.nome_completo AS profissional, v.duracao_segundos, v.url_conteudo, v.data_publicacao, COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float AS avaliacao_media, count(DISTINCT a.usuario_id)::int AS total_avaliacoes FROM videos v JOIN usuarios u ON u.id = v.profissional_id LEFT JOIN avaliacoes a ON a.video_id = v.id WHERE {where} GROUP BY v.id, u.nome_completo"
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
    return success(rows)


@app.get("/api/videos/{video_id}")
def get_video(video_id: UUID):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT v.id, v.titulo, v.descricao, v.profissional_id, u.nome_completo AS profissional, v.duracao_segundos, v.url_conteudo, v.data_publicacao, COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float AS avaliacao_media, count(DISTINCT a.usuario_id)::int AS total_avaliacoes FROM videos v JOIN usuarios u ON u.id = v.profissional_id LEFT JOIN avaliacoes a ON a.video_id = v.id WHERE v.id = %s AND v.situacao = 'publicado' GROUP BY v.id, u.nome_completo", (video_id,))
        row = cur.fetchone()
        if row:
            cur.execute("SELECT c.id, c.nome FROM categorias c JOIN categorias_video cv ON cv.categoria_id = c.id WHERE cv.video_id = %s ORDER BY c.nome", (video_id,))
            row["categorias"] = cur.fetchall()
            cur.execute("SELECT cm.id, cm.conteudo, cm.data_criacao, u.id AS usuario_id, u.nome_completo AS usuario FROM comentarios cm JOIN usuarios u ON u.id = cm.usuario_id WHERE cm.video_id = %s ORDER BY cm.data_criacao DESC LIMIT 100", (video_id,))
            row["comentarios"] = cur.fetchall()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado ou ainda não publicado."})
    return success(row)


@app.get("/api/videos/{video_id}/proximos")
def next_videos(video_id: UUID, limite: int = Query(default=6, ge=1, le=20)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM videos WHERE id = %s AND situacao = 'publicado'", (video_id,))
        if not cur.fetchone():
            raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado."})
        cur.execute("SELECT DISTINCT v.id, v.titulo, v.descricao, v.profissional_id, u.nome_completo AS profissional, v.duracao_segundos, v.url_conteudo, v.data_publicacao FROM videos v JOIN usuarios u ON u.id = v.profissional_id JOIN categorias_video cv ON cv.video_id = v.id WHERE v.situacao = 'publicado' AND v.id <> %s AND cv.categoria_id IN (SELECT categoria_id FROM categorias_video WHERE video_id = %s) ORDER BY v.data_publicacao DESC NULLS LAST LIMIT %s", (video_id, video_id, limite))
        rows = cur.fetchall()
    return success(rows)


@app.post("/api/videos/{video_id}/comentarios", status_code=status.HTTP_201_CREATED)
def add_comment(video_id: UUID, body: CommentRequest, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO comentarios (video_id, usuario_id, conteudo) SELECT %s, %s, %s WHERE EXISTS (SELECT 1 FROM videos WHERE id = %s AND situacao = 'publicado') RETURNING id, video_id, usuario_id, conteudo, data_criacao", (video_id, user["id"], body.conteudo.strip(), video_id))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo publicado não encontrado."})
    return success(row)


@app.put("/api/videos/{video_id}/avaliacao")
def rate_video(video_id: UUID, body: RatingRequest, user: Athlete):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO avaliacoes (video_id, usuario_id, gostou) SELECT %s, %s, %s WHERE EXISTS (SELECT 1 FROM videos WHERE id = %s AND situacao = 'publicado') ON CONFLICT (video_id, usuario_id) DO UPDATE SET gostou = EXCLUDED.gostou, data_atualizacao = now() RETURNING video_id, usuario_id, gostou, data_atualizacao", (video_id, user["id"], body.gostou, video_id))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo publicado não encontrado."})
    return success(row)


@app.post("/api/videos", status_code=status.HTTP_201_CREATED)
def submit_video(body: VideoSubmission, user: Professional):
    if not body.url_conteudo.startswith(("https://", "http://")):
        raise HTTPException(422, detail={"code": "INVALID_MEDIA_URL", "message": "Use uma URL HTTPS/HTTP de mídia armazenada fora do PostgreSQL."})
    categories = list(dict.fromkeys(body.categorias))
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT 1 FROM profissionais WHERE usuario_id = %s", (user["id"],))
        if not cur.fetchone():
            raise HTTPException(403, detail={"code": "PROFESSIONAL_PROFILE_REQUIRED", "message": "Perfil profissional não encontrado."})
        if categories:
            cur.execute("SELECT categoria_id FROM categorias_profissional WHERE profissional_id = %s AND categoria_id = ANY(%s)", (user["id"], categories))
            authorized = {row["categoria_id"] for row in cur.fetchall()}
            if authorized != set(categories):
                raise HTTPException(403, detail={"code": "CATEGORY_NOT_AUTHORIZED", "message": "O profissional só pode publicar nas categorias autorizadas."})
        cur.execute("INSERT INTO videos (profissional_id, titulo, descricao, duracao_segundos, url_conteudo, situacao) VALUES (%s, %s, %s, %s, %s, 'aguardando_revisao') RETURNING id, profissional_id, titulo, descricao, duracao_segundos, url_conteudo, situacao, data_criacao", (user["id"], body.titulo.strip(), body.descricao, body.duracao_segundos, body.url_conteudo))
        video = cur.fetchone()
        if categories:
            cur.executemany("INSERT INTO categorias_video (video_id, categoria_id) VALUES (%s, %s)", [(video["id"], category_id) for category_id in categories])
    return success(video)
