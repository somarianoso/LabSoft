"""Conexão com o banco de dados de cada microsserviço.

Cada serviço é dono de um schema próprio (``identidade``, ``conta``,
``profissionais``, ``catalogo``). A conexão fixa o ``search_path`` nesse
schema, então as consultas de um serviço não enxergam as tabelas dos outros:
dados de outro serviço só podem ser obtidos pela API dele.
"""

import os
import re
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

_SCHEMA_NAME = re.compile(r"^[a-z_][a-z0-9_]{0,62}$")


def resolve_schema(default_schema: str) -> str:
    schema = os.getenv("DB_SCHEMA", default_schema).strip()
    if not _SCHEMA_NAME.fullmatch(schema):
        raise RuntimeError("DB_SCHEMA inválido.")
    return schema


def connect(schema: str, **kwargs) -> psycopg.Connection:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL não configurada.")
    return psycopg.connect(
        database_url,
        row_factory=dict_row,
        options=f"-c search_path={schema}",
        **kwargs,
    )


def connection_factory(default_schema: str):
    """Cria o gerenciador ``connection()`` de um serviço, preso ao schema dele."""
    schema = resolve_schema(default_schema)

    @contextmanager
    def connection():
        with connect(schema) as conn:
            yield conn

    return connection
