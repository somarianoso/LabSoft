# Banco de dados PostgreSQL do WellFlix

Esta pasta concentra o schema compartilhado pelas quatro APIs FastAPI em `../backend/services/`.

```text
database/
  ├── migrations/   # histórico SQL único, aplicado em ordem alfabética
  └── seeds/        # dados fictícios de demonstração (demo.sql)
```

Os executores ficam em `../backend/src/db/` (`migrate.js`, `seed-demo.js`) porque usam as dependências Node do backend (`pg`, `dotenv`). Os comandos continuam sendo executados a partir de `backend/`:

```bash
cd backend
cp .env.example .env
# Edite .env e configure DATABASE_URL antes de continuar.
npm install
npm run migrate
npm run seed:demo -- --confirm-demo-database   # opcional, apenas em banco de demonstração
```

O controle de migrations já aplicadas usa o nome do arquivo (tabela `wellflix_schema_migrations`), então mover a pasta não reaplica nada. Migrations já aplicadas não devem ser editadas; crie uma migration nova para correções. O Render não aplica migrations automaticamente.

A documentação do modelo (diagrama ER, especificação e guia) está em [`../docs/banco_dados/`](../docs/banco_dados/).
