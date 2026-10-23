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
7. O site pode ser publicado antes das APIs para obter a URL e conferir a interface. Para carregar dados e executar ações, depois que as APIs estiverem no ar, abra **Environment** no Static Site, cadastre as quatro variáveis `VITE_*_API_URL` da seção abaixo e faça um novo deploy. Sem uma URL configurada, a tela informa qual variável está faltando; o frontend publicado não chama `localhost`.

Somente uma pessoa precisa criar o Static Site compartilhado. Se cada aluno tiver que entregar uma URL própria, cada um entrega a URL da sua API, conforme a atividade; o link do frontend é complementar e compartilhado. Para entender as configurações de [Static Sites](https://render.com/docs/static-sites) e os caminhos usados com `rootDir`, consulte a [especificação do Blueprint](https://render.com/docs/blueprint-spec) e o guia de [monorepos no Render](https://render.com/docs/monorepo-support).

## Conectar ao PostgreSQL do Labsoft

O frontend nunca recebe a conexão do banco. As quatro APIs FastAPI recebem a mesma `DATABASE_URL` como variável secreta no Render e consultam o PostgreSQL. Não coloquem a URL nem a senha em `VITE_*`, no código React, em commits ou neste documento.

### Aplicar o schema e carregar dados de demonstração

Antes de apontar as APIs para o banco, confirmem com o grupo que este banco pode receber o schema do WellFlix e que ninguém está usando nele tabelas incompatíveis. A migration cria tabelas e não é um comando para executar em um banco de produção com dados não revisados.

1. Em uma máquina autorizada a acessar o PostgreSQL do Labsoft, copie `backend/.env.example` para `backend/.env`.
2. Em `backend/.env`, substitua os campos do `DATABASE_URL` pelo host, porta, usuário, senha e nome do banco fornecidos pelo Labsoft. Mantenha a URL somente nesse arquivo local, que é ignorado pelo Git.
3. No terminal, execute:

   ```bash
   cd backend
   npm install
   npm run migrate
   ```

   Aplique migrations uma única vez no banco compartilhado. Se o comando falhar por tabela já existente, parem e confiram o histórico/schema com o responsável pelo banco; não apaguem tabelas para contornar o erro.

4. Para incluir os registros fictícios de teste descritos no [guia dos serviços](../backend/services/README.md), execute também `npm run seed:demo -- --confirm-demo-database`. Esse seed é opcional e deve ser usado apenas se o grupo concordar em inserir dados demonstrativos nesse banco.

Se a máquina não conseguir conectar ao host e à porta do Labsoft, o backend no Render também pode não conseguir. O administrador da rede/banco precisará confirmar que conexões externas são permitidas e, se houver filtro por IP, liberar as faixas de saída dos Web Services Render. No Render, consulte cada Web Service em **Connect → Outbound** para obter essas faixas; serviços Render usam faixas de saída conforme a região. ([Documentação de IPs de saída do Render](https://render.com/docs/outbound-ip-addresses))

### Configurar cada Web Service FastAPI

Em **Environment** de cada um dos quatro serviços (`identidade`, `conta`, `profissionais` e `catalogo`), configure:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Uma única URL PostgreSQL com as credenciais do Labsoft. Use o formato `postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO`; não inclua espaços nem aspas. |
| `AUTH_TOKEN_SECRET` | O mesmo segredo aleatório, com pelo menos 32 bytes, nos quatro serviços. |
| `FRONTEND_ORIGIN` | A URL HTTPS do Static Site React, por exemplo `https://wellflix-frontend.onrender.com`, sem barra ou caminho no final. |

Salvem as variáveis e façam **Manual Deploy → Deploy latest commit** em cada serviço para reiniciar os processos com a configuração nova. Não adicionem `DATABASE_URL` ao Static Site.

### Configurar o frontend para chamar as APIs

No Static Site React, em **Environment**, cadastrem as quatro variáveis abaixo com as URLs reais dos serviços, sem `/docs`, `/health` ou barra final:

| Variável | Aponta para |
|---|---|
| `VITE_AUTH_API_URL` | URL do serviço de identidade |
| `VITE_ACCOUNT_API_URL` | URL do serviço de conta |
| `VITE_CREATOR_API_URL` | URL do serviço de profissionais |
| `VITE_CATALOG_API_URL` | URL do serviço de catálogo |

Salvem e façam um novo deploy do Static Site: Vite incorpora essas variáveis durante o build. Se uma variável estiver ausente, os fluxos que dependem daquele serviço mostrarão uma mensagem indicando a configuração necessária.

### Conferir a conexão ponta a ponta

1. `GET /health` confirma que a API iniciou, mas não testa o banco.
2. Testem `GET /api/planos` no serviço de conta e `GET /api/categorias` no serviço de catálogo. Essas rotas consultam PostgreSQL; devem responder com `{ "data": [...] }`.
3. No Swagger de identidade, testem `POST /api/auth/sessao` com uma conta de teste e depois as rotas privadas usando **Authorize** com o token Bearer.
4. Abram o frontend e testem login e uma tela que busca dados da API. Se o Swagger acessa o banco mas o navegador mostra erro de CORS, revisem se `FRONTEND_ORIGIN` contém exatamente a origem pública do Static Site em cada API.
5. Se a API responder erro de conexão PostgreSQL, consultem os logs do Web Service e confirmem host/porta, usuário/senha, migrations e regras de rede do Labsoft.

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
