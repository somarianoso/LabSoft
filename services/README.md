# Serviços FastAPI do WellFlix

Há quatro aplicações FastAPI independentes. Todas usam o PostgreSQL existente, as migrations em `backend/src/db/migrations/` e o token HS256 compartilhado. Cada aplicação expõe `/health` e a documentação automática em `/docs`.

## Executar localmente

Na raiz do repositório, instale as dependências do serviço desejado e execute Uvicorn:

```bash
pip install -r services/identidade/requirements.txt
uvicorn services.identidade.main:app --reload --port 8001
```

Troque `identidade` por `conta`, `profissionais` ou `catalogo`; use as portas 8002, 8003 e 8004, respectivamente. Copie `.env.example` para `.env` na raiz e configure `DATABASE_URL`, `AUTH_TOKEN_SECRET` (mínimo de 32 bytes) e `FRONTEND_ORIGIN`. Não use credenciais reais no Git.

## Responsabilidades e rotas

| Serviço | Rotas principais |
| --- | --- |
| `identidade` (Sophia) | `POST /api/atletas`, `POST /api/auth/sessao`, `GET /api/atletas/me` |
| `conta` (Maria Eduarda) | `GET /api/planos`, rotas `/api/assinaturas` e `/api/trilhas` |
| `profissionais` (Gabriel) | Rotas `/api/profissionais` e `/api/moderacao` (fila, aprovação/rejeição e arquivamento lógico) |
| `catalogo` (Luís) | Rotas `/api/categorias`, `/api/videos`, comentários, avaliações e submissões |

Rotas privadas esperam `Authorization: Bearer <access_token>`. Login emite token válido por 15 minutos com os papéis já registrados em `papeis_usuario`. Não existe endpoint público para se promover a profissional ou moderador; esses papéis devem ser concedidos por processo administrativo confiável.

Para ambiente de demonstração, primeiro crie a conta pela rota pública de cadastro de atleta. Depois, um administrador pode conceder os papéis e criar os perfis pelo console SQL do banco, substituindo os e-mails pelos da equipe:

```sql
INSERT INTO papeis_usuario (usuario_id, papel)
SELECT id, 'profissional' FROM usuarios WHERE lower(email) = lower('profissional@example.com')
ON CONFLICT DO NOTHING;
INSERT INTO profissionais (usuario_id)
SELECT id FROM usuarios WHERE lower(email) = lower('profissional@example.com')
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
# Edite backend/.env e configure DATABASE_URL antes de continuar.
npm install
npm run migrate
```

O comando aplica em ordem as migrations de `src/db/migrations/`; `006_interacoes.sql` cria as tabelas de comentários e avaliações e `007_categorias_iniciais.sql` adiciona as categorias usadas pela interface sem duplicá-las. Execute uma vez por banco, antes de iniciar os serviços. Migrations já aplicadas não devem ser editadas; faça uma migration nova para correções.

O `render.yaml` define quatro Web Services Python e um Static Site React. Revise as variáveis secretas durante a criação dos recursos no Render: todos os backends precisam do mesmo `DATABASE_URL` e `AUTH_TOKEN_SECRET`; `FRONTEND_ORIGIN` deve ser a origem real do Static Site. As variáveis `VITE_*_API_URL` do frontend devem receber as quatro URLs públicas Render. A configuração de um Blueprint cria recursos, mas não aplica migrations automaticamente.

Os serviços de API estão marcados com o plano gratuito no Blueprint para evitar escolher recursos pagos por padrão. Serviços gratuitos entram em suspensão após inatividade e podem demorar para responder na primeira requisição; isso deve ser considerado na demonstração. Configure os serviços na mesma região do banco sempre que o provedor permitir.

O banco guarda somente a URL de mídia; o arquivo de vídeo deve ser enviado para armazenamento externo. A confirmação de pagamento também não é simulada: novas assinaturas ficam `pendente_pagamento` até uma integração autenticada com provedor.
