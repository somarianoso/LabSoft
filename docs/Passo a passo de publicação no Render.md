# Passo a passo de publicação no Render

## Publicação individual

É possível usar o mesmo repositório GitHub em quatro contas diferentes do Render. Cada aluno cria e publica o Web Service pelo qual é responsável e recebe sua própria URL pública.

O repositório já contém quatro serviços FastAPI e um `render.yaml` com a configuração inicial. Para a entrega individual, cada aluno pode criar seu serviço pelo painel do Render usando os comandos deste documento.

## Publicar o frontend primeiro

O frontend React é publicado uma única vez pelo grupo como **Static Site**. Ele não é um Web Service FastAPI: o Render compila o React/Vite e publica os arquivos estáticos. Uma pessoa pode ficar responsável por criar e manter esse recurso; os quatro alunos continuam publicando individualmente suas APIs.

1. Envie a versão atual do repositório para o GitHub e confirme que a branch escolhida contém a pasta `frontend/` e o `render.yaml`.
2. No Render, escolha **New → Static Site**, conecte o repositório WellFlix e selecione a branch correta.
3. Configure:

   - **Name:** por exemplo, `wellflix-frontend` (se estiver disponível).
   - **Root Directory:** `frontend`.
   - **Build Command:** `npm install && npm run build`.
   - **Publish Directory:** `dist`.

   O `render.yaml` já contém esses parâmetros para o Static Site `wellflix-frontend`. Para a publicação inicial somente do frontend, crie um Static Site pelo painel; criar uma Blueprint Instance pode propor os quatro Web Services também, que são as entregas individuais dos integrantes.

4. Nesta tela de criação, você ainda não precisa preencher as variáveis `VITE_*_API_URL`. Se aparecer uma linha de variável vazia, remova-a pelo ícone de lixeira. Role até o final e clique em **Create Static Site**.
5. Aguarde o deploy inicial. Quando ele terminar, copie a URL `https://...onrender.com` exibida na página do serviço. Essa é a origem do frontend e o valor de `FRONTEND_ORIGIN` nas quatro APIs, sem caminho no final.
6. Depois de criado, abra a aba **Redirects/Rewrites** do Static Site e adicione uma regra: **Source Path** `/*`, **Destination Path** `/index.html`, **Action** `Rewrite`. Salve a regra. Ela permite abrir ou recarregar diretamente rotas do React.
7. O site pode ser publicado antes das APIs para obter a URL e conferir o carregamento da interface. Para os recursos dinâmicos funcionarem, depois que as APIs estiverem no ar, abra **Environment** no Static Site, cadastre as quatro variáveis `VITE_*_API_URL` da seção abaixo e faça um novo deploy. Até então, as chamadas ainda podem apontar para os endereços locais definidos como fallback no código.

Somente uma pessoa precisa criar o Static Site compartilhado. Se cada aluno tiver que entregar uma URL própria, cada um entrega a URL da sua API, conforme a atividade; o link do frontend é complementar e compartilhado. Para entender as configurações de [Static Sites](https://render.com/docs/static-sites) e os caminhos usados com `rootDir`, consulte a [especificação do Blueprint](https://render.com/docs/blueprint-spec) e o guia de [monorepos no Render](https://render.com/docs/monorepo-support).

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
