# Serviços FastAPI do WellFlix

Há quatro aplicações FastAPI independentes. Todas usam o PostgreSQL existente, as migrations em `../src/db/migrations/` e o token HS256 compartilhado. Cada aplicação expõe `/health` e a documentação automática em `/docs`.

## Executar localmente

Na raiz do repositório, instale as dependências do serviço desejado e execute Uvicorn:

```bash
pip install -r backend/services/identidade/requirements.txt
uvicorn backend.services.identidade.main:app --reload --port 8001
```

Troque `identidade` por `conta`, `profissionais` ou `catalogo`; use as portas 8002, 8003 e 8004, respectivamente. Copie `backend/.env.example` para `backend/.env` e configure `DATABASE_URL`, `AUTH_TOKEN_SECRET` (mínimo de 32 bytes) e `FRONTEND_ORIGIN`. Não use credenciais reais no Git.

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
INSERT INTO papeis_usuario (usuario_id, papel)
SELECT id, 'profissional' FROM usuarios WHERE lower(email) = lower('profissional@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO papeis_usuario (usuario_id, papel)
SELECT id, 'moderador' FROM usuarios WHERE lower(email) = lower('moderador@example.com')
ON CONFLICT DO NOTHING;
INSERT INTO moderadores (usuario_id)
SELECT id FROM usuarios WHERE lower(email) = lower('moderador@example.com')
ON CONFLICT DO NOTHING;
```

O token de demonstração deve ser obtido no Swagger de identidade com `papel: "profissional"` ou `papel: "moderador"`, conforme o perfil provisionado.

## Banco e Render

Antes do primeiro deploy, aplique uma vez todas as migrations existentes e as novas `006_interacoes.sql` e `007_categorias_iniciais.sql` no mesmo PostgreSQL:

```bash
cd backend
cp .env.example .env
# Edite .env e configure DATABASE_URL antes de continuar.
npm install
npm run migrate
```

O comando aplica em ordem as migrations de `src/db/migrations/`; `006_interacoes.sql` cria as tabelas de comentários e avaliações e `007_categorias_iniciais.sql` adiciona as categorias usadas pela interface sem duplicá-las. Execute uma vez por banco, antes de iniciar os serviços. Migrations já aplicadas não devem ser editadas; faça uma migration nova para correções.

O Blueprint `../../render.yaml` define quatro Web Services Python e um Static Site React. Revise as variáveis secretas durante a criação dos recursos no Render: todos os backends precisam do mesmo `DATABASE_URL` e `AUTH_TOKEN_SECRET`; `FRONTEND_ORIGIN` deve ser a origem real do Static Site. As variáveis `VITE_*_API_URL` do frontend devem receber as quatro URLs públicas Render. A configuração de um Blueprint cria recursos, mas não aplica migrations automaticamente.

Os serviços de API estão marcados com o plano gratuito no Blueprint para evitar escolher recursos pagos por padrão. Serviços gratuitos entram em suspensão após inatividade e podem demorar para responder na primeira requisição; isso deve ser considerado na demonstração. Configure os serviços na mesma região do banco sempre que o provedor permitir.

O banco guarda somente a URL de mídia; o arquivo de vídeo deve ser enviado para armazenamento externo. A confirmação de pagamento também não é simulada: novas assinaturas ficam `pendente_pagamento` até uma integração autenticada com provedor.

## Dados fictícios para demonstração

Para povoar um banco de desenvolvimento/demonstração com um atleta, três profissionais, um moderador, vídeos publicados e pendentes, comentários, avaliações, uma assinatura e uma trilha, aplique primeiro todas as migrations e depois execute:

```bash
cd backend
npm run seed:demo -- --confirm-demo-database
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
