import re
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from psycopg.errors import UniqueViolation

from services.shared.auth import issue_token, require_role
from services.shared.config import configure_app, success
from services.shared.database import connection
from services.shared.errors import install_error_handlers
from services.shared.passwords import hash_password, verify_password

app = FastAPI(title="WellFlix — Identidade e atleta", version="1.0.0")
configure_app(app)
install_error_handlers(app)


class AthleteRegistration(BaseModel):
    nome_completo: str = Field(min_length=2, max_length=120)
    cpf: str
    email: str = Field(min_length=5, max_length=254)
    senha: str = Field(min_length=8, max_length=128)

    @field_validator("cpf")
    @classmethod
    def normalize_cpf(cls, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if len(digits) != 11:
            raise ValueError("CPF deve conter 11 dígitos.")
        return digits

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("E-mail inválido.")
        return normalized

    @field_validator("nome_completo")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("Informe o nome completo.")
        return normalized


class LoginRequest(BaseModel):
    email: str
    senha: str
    papel: str = "atleta"


@app.get("/health")
def health():
    return success({"status": "ok", "service": "identidade"})


@app.post("/api/atletas", status_code=status.HTTP_201_CREATED)
def register_athlete(body: AthleteRegistration):
    try:
        with connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO usuarios (nome_completo, email, cpf, hash_senha) VALUES (%s, %s, %s, %s) RETURNING id, nome_completo, email, data_criacao",
                    (body.nome_completo, body.email, body.cpf, hash_password(body.senha)),
                )
                athlete = cur.fetchone()
                cur.execute("INSERT INTO papeis_usuario (usuario_id, papel) VALUES (%s, 'atleta')", (athlete["id"],))
                cur.execute("INSERT INTO atletas (usuario_id) VALUES (%s)", (athlete["id"],))
        return success(athlete)
    except UniqueViolation:
        raise HTTPException(409, detail={"code": "CONFLICT", "message": "E-mail ou CPF já cadastrado."})


@app.post("/api/auth/sessao")
def create_session(body: LoginRequest):
    email = body.email.strip().lower()
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT u.id, u.nome_completo, u.email, u.hash_senha, array_agg(p.papel) AS papeis FROM usuarios u JOIN papeis_usuario p ON p.usuario_id = u.id WHERE lower(u.email) = %s GROUP BY u.id",
            (email,),
        )
        user = cur.fetchone()
    if not user or not verify_password(body.senha, user["hash_senha"]):
        raise HTTPException(401, detail={"code": "INVALID_CREDENTIALS", "message": "E-mail ou senha incorretos."})
    roles = user["papeis"]
    if body.papel not in roles:
        raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Esta conta não possui o perfil solicitado."})
    token = issue_token(str(user["id"]), roles, body.papel)
    return success({
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": 900,
        "usuario": {"id": str(user["id"]), "nome_completo": user["nome_completo"], "email": user["email"], "papel": body.papel},
    })


@app.get("/api/atletas/me")
def get_my_athlete(user: Annotated[dict, Depends(require_role("atleta"))]):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT u.id, u.nome_completo, u.email, u.cpf, u.data_criacao FROM usuarios u JOIN atletas a ON a.usuario_id = u.id WHERE u.id = %s",
            (user["id"],),
        )
        athlete = cur.fetchone()
    if not athlete:
        raise HTTPException(404, detail={"code": "ATHLETE_NOT_FOUND", "message": "Perfil de atleta não encontrado."})
    athlete["cpf"] = "***.***.***-" + athlete["cpf"][-2:]
    return success(athlete)
