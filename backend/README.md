# PostgreSQL e migrations do WellFlix

O backend Express existente foi mantido como referência e não é a API usada na entrega FastAPI. As quatro APIs Python estão em `../services/`; consulte [services/README.md](../services/README.md) para executar localmente e [render.yaml](../render.yaml) para a configuração de deploy.

## Banco de dados

As quatro APIs usam a mesma base PostgreSQL e o mesmo histórico SQL. Configure `DATABASE_URL` no ambiente antes de executar migrations. Nunca versione credenciais reais.

```bash
npm install
npm run migrate
```

O comando aplica em ordem as migrations de `src/db/migrations/`, incluindo `006_interacoes.sql`, que cria as tabelas de comentários e avaliações. Execute uma vez por banco, antes de iniciar os serviços. Migrations já aplicadas não devem ser editadas; faça uma migration nova para correções.

## API de referência em Node

O código Express deste diretório pode ser executado com `npm start`, mas não atende ao critério de entrega que exige FastAPI/Python. Use os quatro serviços em `services/` para integração e publicação.
