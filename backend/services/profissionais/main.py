from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from psycopg.errors import ForeignKeyViolation

from backend.services.shared.auth import require_role
from backend.services.shared.config import configure_app, success
from backend.services.shared.database import connection
from backend.services.shared.errors import install_error_handlers

app = FastAPI(title="WellFlix — Profissionais e moderação", version="1.0.0")
configure_app(app)
install_error_handlers(app)
Professional = Annotated[dict, Depends(require_role("profissional"))]
Moderator = Annotated[dict, Depends(require_role("moderador"))]
Athlete = Annotated[dict, Depends(require_role("atleta"))]


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


@app.get("/api/profissionais")
def list_professionals():
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT u.id, u.nome_completo, p.especialidade, p.biografia, count(DISTINCT s.seguidor_id)::int AS seguidores, count(DISTINCT v.id)::int AS videos, (SELECT COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float FROM videos v2 JOIN avaliacoes a ON a.video_id = v2.id WHERE v2.profissional_id = p.usuario_id AND v2.situacao = 'publicado') AS avaliacao_media FROM profissionais p JOIN usuarios u ON u.id = p.usuario_id LEFT JOIN seguimentos_profissional s ON s.profissional_id = p.usuario_id LEFT JOIN videos v ON v.profissional_id = p.usuario_id AND v.situacao = 'publicado' GROUP BY u.id, p.usuario_id ORDER BY u.nome_completo")
        rows = cur.fetchall()
        for row in rows:
            cur.execute("SELECT c.id, c.nome FROM categorias c JOIN categorias_profissional cp ON cp.categoria_id = c.id WHERE cp.profissional_id = %s ORDER BY c.nome", (row["id"],))
            row["categorias"] = cur.fetchall()
    return success(rows)


@app.get("/api/profissionais/me")
def my_profile(user: Professional):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT u.id, u.nome_completo, u.email, p.especialidade, p.biografia, p.data_atualizacao FROM profissionais p JOIN usuarios u ON u.id = p.usuario_id WHERE p.usuario_id = %s", (user["id"],))
        row = cur.fetchone()
        if row:
            cur.execute("SELECT c.id, c.nome FROM categorias c JOIN categorias_profissional cp ON cp.categoria_id = c.id WHERE cp.profissional_id = %s ORDER BY c.nome", (user["id"],))
            row["categorias"] = cur.fetchall()
    if not row:
        raise HTTPException(404, detail={"code": "PROFILE_NOT_FOUND", "message": "Perfil profissional não encontrado."})
    return success(row)


@app.put("/api/profissionais/me")
def upsert_profile(body: ProfessionalProfile, user: Professional):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO profissionais (usuario_id, especialidade, biografia) VALUES (%s, %s, %s) ON CONFLICT (usuario_id) DO UPDATE SET especialidade = EXCLUDED.especialidade, biografia = EXCLUDED.biografia, data_atualizacao = now() RETURNING usuario_id, especialidade, biografia, data_atualizacao", (user["id"], body.especialidade, body.biografia))
        profile = cur.fetchone()
        cur.execute("DELETE FROM categorias_profissional WHERE profissional_id = %s", (user["id"],))
        try:
            if body.categorias:
                cur.executemany("INSERT INTO categorias_profissional (profissional_id, categoria_id) VALUES (%s, %s)", [(user["id"], category_id) for category_id in set(body.categorias)])
        except ForeignKeyViolation:
            raise HTTPException(422, detail={"code": "UNKNOWN_CATEGORY", "message": "Uma ou mais categorias não existem."})
    return success(profile)


@app.get("/api/profissionais/{professional_id}")
def professional_detail(professional_id: UUID):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT u.id, u.nome_completo, p.especialidade, p.biografia, count(DISTINCT s.seguidor_id)::int AS seguidores, count(DISTINCT v.id)::int AS quantidade_videos, (SELECT COALESCE(AVG(CASE WHEN a.gostou THEN 1.0 ELSE 0.0 END), 0)::float FROM videos v2 JOIN avaliacoes a ON a.video_id = v2.id WHERE v2.profissional_id = p.usuario_id AND v2.situacao = 'publicado') AS avaliacao_media FROM profissionais p JOIN usuarios u ON u.id = p.usuario_id LEFT JOIN seguimentos_profissional s ON s.profissional_id = p.usuario_id LEFT JOIN videos v ON v.profissional_id = p.usuario_id AND v.situacao = 'publicado' WHERE p.usuario_id = %s GROUP BY u.id, p.usuario_id", (professional_id,))
        row = cur.fetchone()
        if row:
            cur.execute("SELECT c.id, c.nome FROM categorias c JOIN categorias_profissional cp ON cp.categoria_id = c.id WHERE cp.profissional_id = %s ORDER BY c.nome", (professional_id,))
            row["categorias"] = cur.fetchall()
            cur.execute("SELECT id, titulo, descricao, duracao_segundos, data_publicacao FROM videos WHERE profissional_id = %s AND situacao = 'publicado' ORDER BY data_publicacao DESC", (professional_id,))
            row["videos"] = cur.fetchall()
    if not row:
        raise HTTPException(404, detail={"code": "PROFILE_NOT_FOUND", "message": "Profissional não encontrado."})
    return success(row)


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
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT v.id, v.titulo, v.descricao, v.duracao_segundos, v.url_conteudo, v.situacao, v.data_criacao, u.id AS profissional_id, u.nome_completo AS profissional FROM videos v JOIN usuarios u ON u.id = v.profissional_id WHERE v.situacao = %s ORDER BY v.data_criacao", (situacao,))
        rows = cur.fetchall()
    return success(rows)


@app.post("/api/moderacao/videos/{video_id}/decisao")
def review_video(video_id: UUID, body: ReviewDecision, user: Moderator):
    if body.situacao not in {"aprovado", "rejeitado"}:
        raise HTTPException(422, detail={"code": "INVALID_DECISION", "message": "A decisão deve ser aprovado ou rejeitado."})
    next_status = "publicado" if body.situacao == "aprovado" else "rejeitado"
    with connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE videos SET situacao = %s, data_publicacao = CASE WHEN %s = 'publicado' THEN now() ELSE NULL END, data_atualizacao = now() WHERE id = %s AND situacao = 'aguardando_revisao' RETURNING id, titulo, situacao", (next_status, next_status, video_id))
        video = cur.fetchone()
        if not video:
            raise HTTPException(404, detail={"code": "PENDING_VIDEO_NOT_FOUND", "message": "Vídeo pendente não encontrado."})
        cur.execute("INSERT INTO revisoes_video (video_id, moderador_id, situacao, observacao) VALUES (%s, %s, %s, %s) RETURNING id, video_id, moderador_id, situacao, observacao, data_criacao", (video_id, user["id"], body.situacao, body.observacao))
        review = cur.fetchone()
    return success({"video": video, "revisao": review})


@app.delete("/api/moderacao/videos/{video_id}")
def archive_video(video_id: UUID, user: Moderator):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE videos SET situacao = 'arquivado', data_atualizacao = now() WHERE id = %s AND situacao <> 'arquivado' RETURNING id, titulo, situacao, data_atualizacao", (video_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, detail={"code": "VIDEO_NOT_FOUND", "message": "Vídeo não encontrado ou já arquivado."})
    return success(row)
