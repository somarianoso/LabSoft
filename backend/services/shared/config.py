import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


def configure_app(app: FastAPI, service: str) -> None:
    from backend.services.shared import observabilidade
    from backend.services.shared.migrate import migrate_on_startup

    observabilidade.instalar(app, service)
    # Primeiro handler de startup: o banco do serviço é migrado antes de o
    # relay/consumidor de eventos começarem.
    app.router.add_event_handler("startup", lambda: migrate_on_startup(service))

    @app.get("/", include_in_schema=False)
    def service_info():
        return success({
            "status": "ok",
            "service": app.title,
            "health": "/health",
            "docs": "/docs",
        })

    origins = [
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGIN", "").split(",")
        if origin.strip()
    ]
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=False,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
            expose_headers=["X-Request-ID"],
        )


def success(data):
    return {"data": data}
