"""Aplica as migrations (e, opcionalmente, o seed de demonstração) de um serviço.

Cada serviço guarda os próprios arquivos SQL em ``backend/services/<servico>/``:

    migrations/NNN_*.sql   aplicadas em ordem alfabética, uma única vez
    seeds/demo.sql         dados fictícios (só com --seed-demo)

Tudo é criado dentro do schema do serviço; o controle das migrations já
aplicadas fica em ``<schema>.schema_migrations``.

Uso (na raiz do repositório):

    python -m backend.services.shared.migrate identidade
    python -m backend.services.shared.migrate todos --seed-demo --confirm-demo-database
"""

import argparse
import os
import sys
from pathlib import Path

from backend.services.shared import config  # noqa: F401  (carrega backend/.env)
from backend.services.shared.database import connect, resolve_schema

SERVICES_DIR = Path(__file__).resolve().parent.parent
SERVICES = ["identidade", "catalogo", "profissionais", "conta"]


def migrate(service: str, seed_demo: bool) -> None:
    schema = resolve_schema(service)
    folder = SERVICES_DIR / service
    with connect(schema) as conn:
        conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            " nome TEXT PRIMARY KEY,"
            " aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now())"
        )
        conn.commit()
        applied = {row["nome"] for row in conn.execute("SELECT nome FROM schema_migrations")}
        for path in sorted((folder / "migrations").glob("*.sql")):
            if path.name in applied:
                continue
            print(f"[{service}] aplicando {path.name}")
            with conn.transaction():
                conn.execute(path.read_text(encoding="utf-8"))
                conn.execute("INSERT INTO schema_migrations (nome) VALUES (%s)", (path.name,))
        if seed_demo:
            seed = folder / "seeds" / "demo.sql"
            if seed.exists():
                print(f"[{service}] aplicando seed {seed.name}")
                with conn.transaction():
                    conn.execute(seed.read_text(encoding="utf-8"))
    print(f"[{service}] schema '{schema}' atualizado.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("servico", choices=SERVICES + ["todos"])
    parser.add_argument("--seed-demo", action="store_true", help="aplica seeds/demo.sql depois das migrations")
    parser.add_argument("--confirm-demo-database", action="store_true", help="confirma que o banco é de demonstração")
    args = parser.parse_args()
    if args.seed_demo and not args.confirm_demo_database:
        parser.error("--seed-demo exige --confirm-demo-database (use apenas em banco de demonstração).")
    targets = SERVICES if args.servico == "todos" else [args.servico]
    if args.servico == "todos" and os.getenv("DB_SCHEMA"):
        parser.error("Não use DB_SCHEMA com 'todos': cada serviço precisa do próprio schema.")
    for service in targets:
        migrate(service, args.seed_demo)
    return 0


if __name__ == "__main__":
    sys.exit(main())
