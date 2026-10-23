import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import InvalidTokenError


def issue_token(user_id: str, roles: list[str], selected_role: str) -> str:
    secret = os.getenv("AUTH_TOKEN_SECRET", "")
    if len(secret.encode("utf-8")) < 32:
        raise HTTPException(503, detail={"code": "AUTHENTICATION_NOT_CONFIGURED", "message": "A autenticação ainda não foi configurada."})
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "roles": roles,
            "papel": selected_role,
            "iss": "wellflix-api",
            "aud": "wellflix-client",
            "iat": now,
            "exp": now + timedelta(minutes=15),
        },
        secret,
        algorithm="HS256",
    )


def current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, detail={"code": "UNAUTHENTICATED", "message": "Autenticação necessária."})
    secret = os.getenv("AUTH_TOKEN_SECRET", "")
    if len(secret.encode("utf-8")) < 32:
        raise HTTPException(503, detail={"code": "AUTHENTICATION_NOT_CONFIGURED", "message": "A autenticação ainda não foi configurada."})
    try:
        claims = jwt.decode(
            authorization[7:], secret, algorithms=["HS256"],
            issuer="wellflix-api", audience="wellflix-client",
        )
        user_id = str(UUID(claims["sub"]))
        roles = claims.get("roles", [claims.get("papel")])
        if not isinstance(roles, list):
            raise ValueError("roles inválido")
        return {"id": user_id, "roles": roles, "papel": claims.get("papel")}
    except (InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(401, detail={"code": "INVALID_TOKEN", "message": "Token inválido ou expirado."})


def require_role(*roles: str):
    def dependency(user: dict = Depends(current_user)) -> dict:
        if not set(roles).intersection(user["roles"]):
            raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Seu perfil não permite esta operação."})
        return user

    return dependency
