# Serviços FastAPI do WellFlix

Há quatro aplicações FastAPI independentes. **Cada uma é dona do próprio banco** (um schema PostgreSQL só dela, com migrations e seeds na própria pasta) e nenhuma lê tabelas de outra. A integração acontece por três meios:

1. **Token JWT** emitido pela identidade: os outros serviços sabem quem é o usuário sem consultar o banco dela.
2. **Eventos no Kafka** (tempo real): quando um usuário, categoria, vídeo ou perfil profissional muda, um trigger grava o evento no outbox do serviço dono e o relay publica no Kafka; os serviços interessados mantêm réplicas locais (`*_replica`).
3. **Chamadas REST** para comandos que precisam de resposta imediata (moderar vídeo, checar uso de categoria) e consultas agregadas (estatísticas e vídeos de um profissional). As rotas `/internal/...` só aceitam token de serviço.

Detalhes e diagramas: [`docs/backend/Integração entre microsserviços.md`](../../docs/backend/Integra%C3%A7%C3%A3o%20entre%20microsservi%C3%A7os.md). Cada aplicação expõe `/health` e a documentação automática em `/docs`.

## Executar localmente

Na raiz do repositório, instale as dependências do serviço desejado e execute Uvicorn:

```bash
pip install -r backend/services/identidade/requirements.txt
uvicorn backend.services.identidade.main:app --reload --port 8001
```

Troque `identidade` por `conta`, `profissionais` ou `catalogo`; use as portas 8002, 8003 e 8004, respectivamente. Copie `backend/.env.example` para `backend/.env` e configure `DATABASE_URL`, `AUTH_TOKEN_SECRET` (mínimo de 32 bytes), `FRONTEND_ORIGIN` e `KAFKA_BOOTSTRAP_SERVERS`. Não use credenciais reais no Git.

Para um Kafka local de desenvolvimento (Docker):

```bash
docker run -d --name wellflix-kafka -p 9092:9092 apache/kafka:3.8.0
```

Sem `KAFKA_BOOTSTRAP_SERVERS` os serviços sobem normalmente, mas os eventos ficam acumulados no outbox e as réplicas não são atualizadas (nomes de autores, categorias e vídeos novos não aparecem nos outros serviços) até o Kafka ser configurado; quando ele volta, o relay publica tudo o que ficou pendente.

## Responsabilidades e rotas

| Serviço | Rotas principais |
| --- | --- |
| `identidade` (Sophia) | `POST /api/atletas`, `POST /api/auth/sessao`, `GET /api/atletas/me`, `GET /api/usuarios/me`, `GET /api/usuarios` (contas fictícias públicas), `PUT /api/atletas/me/perfil` |
| `conta` (Maria Eduarda) | `GET /api/planos`, `GET/POST /api/assinaturas`, rotas `/api/trilhas` com `POST/GET/PUT/DELETE`, `GET /api/trilhas/publicas` |
| `profissionais` (Gabriel) | Rotas `/api/profissionais` (inclui criação/edição de perfil, seguir/deixar de seguir) e `/api/moderacao` |
| `catalogo` (Luís) | Rotas `/api/categorias` e `/api/videos` com consultas, cadastro, edição e remoção autorizada; comentários e avaliações também podem ser editados/removidos pelo autor |

### Rotas adicionais para consultar e gravar dados

Todas as rotas abaixo usam o PostgreSQL configurado em `DATABASE_URL`. As rotas privadas precisam do token obtido pelo login no serviço `identidade`. No Swagger de cada serviço (`/docs`), clique em **Try it out**; no campo `authorization`, envie `Bearer SEU_ACCESS_TOKEN`.

| Serviço | Método e rota | Acesso | O que faz |
|---|---|---|---|
| Identidade | `GET /api/usuarios/me` | Token de qualquer papel | Lê nome, e-mail e papéis da conta autenticada. |
| Identidade | `GET /api/usuarios?limite=50&offset=0` | Público | Lista somente contas fictícias com e-mail `@wellflix.test`, para conferência. Nunca retorna CPF, senha, hash ou contas fora desse domínio. |
| Identidade | `PUT /api/atletas/me/perfil` | Token de atleta | Atualiza nome e/ou e-mail. Corpo: `{"nome_completo":"Ana Silva","email":"ana@example.com"}`; envie ao menos um campo. |
| Conta | `GET /api/assinaturas` | Token de atleta | Lista o histórico de assinaturas e as categorias associadas à conta. |
| Conta | `GET /api/trilhas/publicas?q=treino&limite=20&offset=0` | Público | Pesquisa trilhas públicas e retorna quantidade de vídeos e autor. `q` é opcional. |
| Conta | `PUT /api/trilhas/{trail_id}` | Token de atleta dono | Atualiza nome e/ou privacidade da trilha. |
| Conta | `DELETE /api/trilhas/{trail_id}` | Token de atleta dono | Exclui a trilha e seu progresso associado. |
| Profissionais | `POST /api/profissionais/me` | Token de profissional | Cria o perfil profissional se ainda não existir. Corpo: `{"especialidade":"Fisioterapia","biografia":"Atendimento esportivo","categorias":["UUID_DA_CATEGORIA"]}`. |
| Profissionais | `PUT /api/profissionais/me` | Token de profissional | Cria ou substitui os dados e categorias do próprio perfil. |
| Profissionais | `GET /api/profissionais/me/seguindo` | Token de atleta | Lista os profissionais seguidos pela conta autenticada. |
| Profissionais | `DELETE /api/profissionais/{professional_id}/seguir` | Token de atleta | Deixa de seguir o profissional informado. |
| Catálogo | `GET /api/categorias/{category_id}` | Público | Lê uma categoria e o total de vídeos publicados associados. |
| Catálogo | `POST /api/categorias` | Token de moderador | Cadastra uma categoria. Corpo: `{"nome":"Corrida"}`. |
| Catálogo | `PUT/DELETE /api/categorias/{category_id}` | Token de moderador | Renomeia ou exclui categoria. Exclusão retorna `409` se ela estiver vinculada a vídeos, assinaturas ou profissionais. |
| Catálogo | `GET /api/videos/{video_id}/comentarios?limite=50&offset=0` | Público | Lista comentários paginados de um vídeo publicado. |
| Catálogo | `PUT/DELETE /api/videos/{video_id}/comentarios/{comment_id}` | Token do autor | Edita ou exclui o próprio comentário. No `PUT`, corpo: `{"conteudo":"Comentário atualizado"}`. |
| Catálogo | `GET /api/videos/{video_id}/avaliacoes/resumo` | Público | Retorna a média de aprovação e totais de gostei/não gostei. |
| Catálogo | `DELETE /api/videos/{video_id}/avaliacao` | Token de atleta | Remove a própria avaliação do vídeo. |
| Catálogo | `PUT/DELETE /api/videos/{video_id}` | Token do profissional dono | Atualiza ou exclui vídeo não publicado. A edição reenvia o vídeo para moderação; publicados e arquivados não podem ser excluídos por esta rota. |

As rotas de criação respondem `201`; atualizações, consultas e exclusões respondem `200`. `POST /api/profissionais/me` retorna `409` se o perfil já existir; nesse caso, atualize com `PUT /api/profissionais/me`. IDs de categorias e vídeos são UUIDs retornados pelas próprias rotas GET. Para visualizar esses endpoints no Render, envie as alterações ao GitHub e espere o redeploy do serviço correspondente.

Rotas privadas esperam `Authorization: Bearer <access_token>`. Login emite token válido por 15 minutos com os papéis já registrados em `papeis_usuario`. Não existe endpoint público para se promover a profissional ou moderador; esses papéis devem ser concedidos por processo administrativo confiável.

Para ambiente de demonstração, primeiro crie a conta pela rota pública de cadastro de atleta. Um administrador concede os papéis pelo console SQL do banco, substituindo os e-mails pelos da equipe. Depois de receber o papel profissional, a pessoa cria o próprio perfil com `POST /api/profissionais/me`; o papel de moderador continua sendo concedido somente por processo administrativo confiável:

```sql
INSERT INTO identidade.papeis_usuario (usuario_id, papel)
SELECT id, 'profissional' FROM identidade.usuarios WHERE lower(email) = lower('profissional@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO identidade.papeis_usuario (usuario_id, papel)
SELECT id, 'moderador' FROM identidade.usuarios WHERE lower(email) = lower('moderador@example.com')
ON CONFLICT DO NOTHING;
INSERT INTO identidade.moderadores (usuario_id)
SELECT id FROM identidade.usuarios WHERE lower(email) = lower('moderador@example.com')
ON CONFLICT DO NOTHING;
```

O trigger da identidade publica a mudança de papel no Kafka automaticamente. O token de demonstração deve ser obtido no Swagger de identidade com `papel: "profissional"` ou `papel: "moderador"`, conforme o perfil provisionado.

## Banco e Render

Cada serviço aplica as próprias migrations (`<servico>/migrations/*.sql`) no próprio schema. Na raiz do repositório:

```bash
pip install -r backend/services/identidade/requirements.txt
python -m backend.services.shared.migrate todos          # ou: identidade | catalogo | profissionais | conta
```

O controle das migrations aplicadas fica em `<schema>.schema_migrations`. Migrations já aplicadas não devem ser editadas; crie uma nova. As migrations antigas do schema compartilhado continuam em `database/migrations/` só como histórico. **Para um banco que já tem dados no formato antigo**, rode as migrations acima e depois `database/transicao/copiar_public_para_schemas.sql` (veja o cabeçalho do arquivo).

O Blueprint `../../render.yaml` define quatro Web Services Python e um Static Site React. Cada serviço tem a própria `DATABASE_URL`: pode ser o mesmo PostgreSQL (cada um usa só o seu schema) ou bancos diferentes. Para isolamento total, crie um usuário PostgreSQL por serviço com permissão apenas no próprio schema. Todos precisam do mesmo `AUTH_TOKEN_SECRET`, das variáveis `KAFKA_*` (o Render não oferece Kafka: use um Kafka gerenciado, como Confluent Cloud ou Aiven) e das URLs dos serviços que chamam (`*_API_URL`). `FRONTEND_ORIGIN` deve ser a origem real do Static Site, e as variáveis `VITE_*_API_URL` do frontend recebem as quatro URLs públicas. O Blueprint não aplica migrations automaticamente.

Os serviços de API estão marcados com o plano gratuito no Blueprint para evitar escolher recursos pagos por padrão. Serviços gratuitos entram em suspensão após inatividade e podem demorar para responder na primeira requisição; isso deve ser considerado na demonstração. Configure os serviços na mesma região do banco sempre que o provedor permitir.

O banco guarda somente a URL de mídia; o arquivo de vídeo deve ser enviado para armazenamento externo. A confirmação de pagamento também não é simulada: novas assinaturas ficam `pendente_pagamento` até uma integração autenticada com provedor.

## Dados fictícios para demonstração

Para povoar um banco de desenvolvimento/demonstração com um atleta, três profissionais, um moderador, vídeos publicados e pendentes, comentários, avaliações, uma assinatura e uma trilha (cada serviço tem o próprio `seeds/demo.sql`), execute na raiz:

```bash
python -m backend.services.shared.migrate todos --seed-demo --confirm-demo-database
```

O comando usa o `DATABASE_URL` de `backend/.env` e requer a confirmação explícita porque grava registros no banco selecionado. Não rode contra um banco com dados reais. O seed é repetível: executar novamente atualiza os mesmos registros de demonstração, sem duplicá-los.

As cinco contas usam a senha `WellflixDemo123!`:

| Perfil | E-mail |
| --- | --- |
| Atleta | `atleta.demo@wellflix.test` |
| Profissional | `lara.demo@wellflix.test` |
| Profissional | `caio.demo@wellflix.test` |
| Profissional | `marina.demo@wellflix.test` |
| Moderador | `moderador.demo@wellflix.test` |

Para testar o login no Swagger de identidade, use `POST /api/auth/sessao` e informe o `papel` correspondente (`atleta`, `profissional` ou `moderador`). Os vídeos apontam para arquivos de amostra públicos; são dados fictícios, não conteúdo WellFlix real.
