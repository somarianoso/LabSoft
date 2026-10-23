import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


def configure_app(app: FastAPI) -> None:
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
            allow_headers=["Authorization", "Content-Type"],
        )


def success(data):
    return {"data": data}
