import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import InvalidTokenError

ISSUER = "wellflix-api"
USER_AUDIENCE = "wellflix-client"
SERVICE_AUDIENCE = "wellflix-internal"


def _secret() -> str:
    secret = os.getenv("AUTH_TOKEN_SECRET", "")
    if len(secret.encode("utf-8")) < 32:
        raise HTTPException(503, detail={"code": "AUTHENTICATION_NOT_CONFIGURED", "message": "O login está indisponível no momento. Tente novamente em instantes."})
    return secret


def issue_token(user_id: str, roles: list[str], selected_role: str) -> str:
    secret = _secret()
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "roles": roles,
            "papel": selected_role,
            "iss": ISSUER,
            "aud": USER_AUDIENCE,
            "iat": now,
            "exp": now + timedelta(minutes=15),
        },
        secret,
        algorithm="HS256",
    )


def issue_service_token(service_name: str) -> str:
    """Token de curta duração usado por um serviço para chamar rotas /internal de outro.

    Tem audiência própria: não serve como token de usuário, e um token de
    usuário não serve para as rotas internas.
    """
    secret = _secret()
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": f"servico:{service_name}",
            "servico": service_name,
            "iss": ISSUER,
            "aud": SERVICE_AUDIENCE,
            "iat": now,
            "exp": now + timedelta(minutes=2),
        },
        secret,
        algorithm="HS256",
    )


def current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, detail={"code": "UNAUTHENTICATED", "message": "Entre na sua conta para continuar."})
    secret = _secret()
    try:
        claims = jwt.decode(
            authorization[7:], secret, algorithms=["HS256"],
            issuer=ISSUER, audience=USER_AUDIENCE,
        )
        user_id = str(UUID(claims["sub"]))
        roles = claims.get("roles", [claims.get("papel")])
        if not isinstance(roles, list):
            raise ValueError("roles inválido")
        return {"id": user_id, "roles": roles, "papel": claims.get("papel"), "token": authorization[7:]}
    except (InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(401, detail={"code": "INVALID_TOKEN", "message": "Sua sessão expirou. Entre novamente."})


def require_role(*roles: str):
    def dependency(user: dict = Depends(current_user)) -> dict:
        if not set(roles).intersection(user["roles"]):
            raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Seu perfil não permite esta operação."})
        return user

    return dependency


def require_service(authorization: str | None = Header(default=None)) -> str:
    """Protege as rotas /internal: só aceita tokens emitidos por outro serviço."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, detail={"code": "UNAUTHENTICATED", "message": "Rota interna: token de serviço necessário."})
    secret = _secret()
    try:
        claims = jwt.decode(
            authorization[7:], secret, algorithms=["HS256"],
            issuer=ISSUER, audience=SERVICE_AUDIENCE,
        )
        return str(claims["servico"])
    except (InvalidTokenError, KeyError):
        raise HTTPException(401, detail={"code": "INVALID_SERVICE_TOKEN", "message": "Token de serviço inválido ou expirado."})
