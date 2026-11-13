# Banco de dados PostgreSQL do WellFlix

Cada microsserviço é dono do próprio banco: um schema PostgreSQL exclusivo (`identidade`, `catalogo`, `profissionais`, `conta`), com migrations e seeds na pasta do serviço:

```text
backend/services/<servico>/
  ├── migrations/   # SQL do schema do serviço, aplicado em ordem alfabética
  └── seeds/demo.sql
```

Para aplicar (na raiz do repositório):

```bash
python -m backend.services.shared.migrate todos
python -m backend.services.shared.migrate todos --seed-demo --confirm-demo-database   # só em banco de demonstração
```

Nenhum serviço tem chave estrangeira para tabela de outro. Referências entre serviços são UUIDs "lógicos", validados pela aplicação; os dados de outro serviço chegam por eventos Kafka (tabelas `*_replica`) ou pela API dele. Veja [`../docs/backend/Integração entre microsserviços.md`](../docs/backend/Integra%C3%A7%C3%A3o%20entre%20microsservi%C3%A7os.md) e o diagrama ER em [`../docs/banco_dados/`](../docs/banco_dados/).

## Conteúdo desta pasta

```text
database/
  ├── migrations/   # HISTÓRICO: schema compartilhado antigo (antes da separação por serviço)
  ├── seeds/        # HISTÓRICO: seed do schema compartilhado antigo
  └── transicao/    # script único que copia os dados de public.* para os schemas novos
```

`migrations/` e `seeds/` não são mais aplicados nos bancos novos; ficam para consulta e para quem ainda tem um banco no formato antigo. Para migrar um banco antigo, siga o cabeçalho de `transicao/copiar_public_para_schemas.sql`.
