"""Aplica as migrations (e, opcionalmente, o seed de demonstração) de um serviço.

Cada serviço guarda os próprios arquivos SQL em ``backend/services/<servico>/``:

    migrations/NNN_*.sql   aplicadas em ordem alfabética, uma única vez
    seeds/demo.sql         dados fictícios (só com --seed-demo)

Tudo é criado dentro do schema do serviço; o controle das migrations já
aplicadas fica em ``<schema>.schema_migrations``.

Cada serviço também aplica as próprias migrations ao iniciar (ver
``config.configure_app``; desligue com ``MIGRAR_AO_INICIAR=0``). Um *advisory
lock* por schema impede que duas instâncias migrem ao mesmo tempo.

Uso (na raiz do repositório):

    python -m backend.services.shared.migrate identidade
    python -m backend.services.shared.migrate todos --seed-demo --confirm-demo-database
"""

import argparse
import logging
import os
import sys
from pathlib import Path

from backend.services.shared import config  # noqa: F401  (carrega backend/.env)
from backend.services.shared.database import connect, resolve_schema

SERVICES_DIR = Path(__file__).resolve().parent.parent
SERVICES = ["identidade", "catalogo", "profissionais", "conta"]
log = logging.getLogger("wellflix.migracao")


def migrate(service: str, seed_demo: bool, report=print) -> list[str]:
    """Aplica as migrations pendentes do serviço e devolve os nomes aplicados."""
    schema = resolve_schema(service)
    folder = SERVICES_DIR / service
    applied_now: list[str] = []
    with connect(schema) as conn:
        conn.execute("SELECT pg_advisory_lock(hashtext(%s))", (f"wellflix-migracao-{schema}",))
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
            report(f"[{service}] aplicando {path.name}")
            with conn.transaction():
                conn.execute(path.read_text(encoding="utf-8"))
                conn.execute("INSERT INTO schema_migrations (nome) VALUES (%s)", (path.name,))
            applied_now.append(path.name)
        if seed_demo:
            seed = folder / "seeds" / "demo.sql"
            if seed.exists():
                report(f"[{service}] aplicando seed {seed.name}")
                with conn.transaction():
                    conn.execute(seed.read_text(encoding="utf-8"))
        conn.execute("SELECT pg_advisory_unlock(hashtext(%s))", (f"wellflix-migracao-{schema}",))
        conn.commit()
    report(f"[{service}] schema '{schema}' atualizado.")
    return applied_now


def migrate_on_startup(service: str) -> None:
    """Chamado na subida do serviço: o banco acompanha a versão do código."""
    if os.getenv("MIGRAR_AO_INICIAR", "1") == "0":
        return
    try:
        migrate(service, seed_demo=False, report=log.info)
    except Exception:
        log.exception("Não foi possível aplicar as migrations de %s; o serviço sobe sem elas", service)


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
