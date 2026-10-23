# Passo a passo de publicação no Render

## Publicação individual

É possível usar o mesmo repositório GitHub em quatro contas diferentes do Render. Cada aluno cria e publica o Web Service pelo qual é responsável e recebe sua própria URL pública.

O repositório já contém quatro serviços FastAPI e um `render.yaml` com a configuração inicial. Para a entrega individual, cada aluno pode criar seu serviço pelo painel do Render usando os comandos deste documento.

## Antes de publicar

1. Enviem as alterações para o GitHub e confirmem que o repositório está acessível às quatro contas.
2. Apliquem as migrations no PostgreSQL compartilhado **uma única vez**. As instruções estão em [backend/services/README.md](../backend/services/README.md). Não deixem cada aluno alterar o schema separadamente.
3. Cada aluno precisa ter acesso à `DATABASE_URL` do banco e ao mesmo `AUTH_TOKEN_SECRET`, com pelo menos 32 bytes. Compartilhem esses valores por um meio seguro; não os coloquem em commits ou mensagens públicas.
4. Definam a URL pública do frontend para configurar `FRONTEND_ORIGIN`. Se ele ainda não estiver publicado, usem temporariamente a origem local para desenvolvimento e atualizem o valor depois.

## Criar um Web Service por aluno

Cada aluno deve seguir estes passos no Render:

1. Abrir o painel do Render e selecionar **New → Web Service**.
2. Conectar a conta GitHub e selecionar o repositório WellFlix.
3. Escolher a branch que contém a implementação.
4. Manter **Root Directory vazio**, na raiz do repositório. O serviço importa módulos compartilhados de `backend.services.shared`.
5. Informar o nome e os comandos correspondentes:

| Aluno | Nome sugerido | Build Command | Start Command |
|---|---|---|---|
| Sophia | `wellflix-identidade` | `pip install -r backend/services/identidade/requirements.txt` | `uvicorn backend.services.identidade.main:app --host 0.0.0.0 --port $PORT` |
| Maria Eduarda | `wellflix-conta` | `pip install -r backend/services/conta/requirements.txt` | `uvicorn backend.services.conta.main:app --host 0.0.0.0 --port $PORT` |
| Gabriel | `wellflix-profissionais` | `pip install -r backend/services/profissionais/requirements.txt` | `uvicorn backend.services.profissionais.main:app --host 0.0.0.0 --port $PORT` |
| Luís | `wellflix-catalogo` | `pip install -r backend/services/catalogo/requirements.txt` | `uvicorn backend.services.catalogo.main:app --host 0.0.0.0 --port $PORT` |

6. Em **Advanced → Environment Variables**, cadastrar:

   - `DATABASE_URL`: conexão com o PostgreSQL compartilhado.
   - `AUTH_TOKEN_SECRET`: o mesmo segredo nos quatro serviços.
   - `FRONTEND_ORIGIN`: origem HTTPS do site React.

7. Definir **Health Check Path** como `/health` e criar o serviço.
8. Aguardar o deploy. O Render fornece uma URL pública no formato `https://...onrender.com`.
9. Abrir `https://SUA-URL/health` e `https://SUA-URL/docs` para confirmar que o serviço responde. Cada aluno entrega sua URL e, se o formulário permitir, também o link `/docs`.

## URLs para configurar no frontend

Depois que os quatro serviços estiverem publicados, configurar estas variáveis no Static Site React:

| Variável | URL do serviço |
|---|---|
| `VITE_AUTH_API_URL` | URL da Sophia (`wellflix-identidade`) |
| `VITE_ACCOUNT_API_URL` | URL da Maria Eduarda (`wellflix-conta`) |
| `VITE_CREATOR_API_URL` | URL do Gabriel (`wellflix-profissionais`) |
| `VITE_CATALOG_API_URL` | URL do Luís (`wellflix-catalogo`) |

As variáveis Vite são usadas durante o build; depois de alterá-las, faça um novo deploy do Static Site.

## Observações

- Os serviços estão configurados no plano gratuito do Render. Serviços gratuitos podem suspender após inatividade, então a primeira requisição pode demorar.
- A URL individual só estará disponível depois que o serviço concluir o primeiro deploy.
- O Render não aplica as migrations automaticamente. Aplique-as no banco antes de publicar as APIs.
- O `render.yaml` contém a configuração inicial dos quatro serviços e do frontend. Consulte a [documentação do Render para Web Services](https://render.com/docs/web-services), [FastAPI](https://render.com/docs/deploy-fastapi) e [Blueprints](https://render.com/docs/blueprint-spec).
