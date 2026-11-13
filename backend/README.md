# Backend do WellFlix

O backend é formado por quatro microsserviços FastAPI independentes em `services/` (`identidade`, `conta`, `profissionais` e `catalogo`). Cada um é dono do próprio banco: um schema PostgreSQL exclusivo, com migrations em `services/<servico>/migrations/` e seed de demonstração em `services/<servico>/seeds/demo.sql`. Os serviços não têm chaves estrangeiras entre si; trocam dados por eventos Kafka (réplicas locais `*_replica`) e chamadas REST.

Consulte [services/README.md](services/README.md) para executar localmente e aplicar as migrations, e [../render.yaml](../render.yaml) para a configuração de deploy.

## Banco de dados

Configure `DATABASE_URL` em `backend/.env` (veja `.env.example`) e, na raiz do repositório:

```bash
python -m backend.services.shared.migrate todos          # ou: identidade | conta | profissionais | catalogo
python -m backend.services.shared.migrate todos --seed-demo --confirm-demo-database   # só em banco de demonstração
```

Migrations já aplicadas não devem ser editadas; crie uma migration nova na pasta do serviço. Nunca versione credenciais reais.
