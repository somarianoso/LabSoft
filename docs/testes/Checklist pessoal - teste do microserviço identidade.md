# Checklist pessoal — teste do microserviço de identidade

## Objetivo

Demonstrar que o frontend React envia cadastro e login para o microserviço de identidade em FastAPI, que valida os dados e persiste as contas no PostgreSQL compartilhado.

## Arquitetura do fluxo

1. A pessoa preenche o formulário no frontend React.
2. O frontend envia `POST /api/atletas` para o serviço de identidade.
3. O serviço valida os campos, armazena senha com hash e grava a conta, o papel `atleta` e o registro de atleta no PostgreSQL.
4. No login, o frontend envia `POST /api/auth/sessao`.
5. A API valida a senha e devolve um token Bearer. O frontend guarda a sessão no armazenamento local do navegador e direciona a pessoa para a página inicial.

O frontend não se conecta diretamente ao PostgreSQL. A senha e a URL de conexão do banco não são enviadas ao navegador.

## Endereços

- Frontend WellFlix: <https://wellflix-frontend.onrender.com>
- Serviço de identidade da Sophia: <https://wellflix-identidade-sophia.onrender.com>
- Documentação Swagger: <https://wellflix-identidade-sophia.onrender.com/docs>
- Verificação de saúde da API: <https://wellflix-identidade-sophia.onrender.com/health>

Se o grupo tiver recriado algum recurso Render com outro nome, use os endereços exibidos no painel. No Static Site, `VITE_AUTH_API_URL` precisa apontar para a raiz HTTPS do serviço de identidade, sem `/docs`, `/health` ou barra final. No Web Service, `FRONTEND_ORIGIN` precisa ser exatamente a origem do frontend. Após alterar variáveis `VITE_*`, faça novo deploy do Static Site.

## Contas fictícias para login

As contas abaixo são inseridas pelo seed de demonstração. O seed é repetível: pode ser executado novamente sem duplicar essas contas.

| Perfil | Nome | E-mail | CPF fictício |
|---|---|---|---|
| Atleta | Ana Atleta Demo | `atleta.demo@wellflix.test` | `00000000001` |
| Atleta | Beatriz Teste Demo | `beatriz.demo@wellflix.test` | `00000000006` |
| Atleta | Rafael Teste Demo | `rafael.demo@wellflix.test` | `00000000007` |
| Atleta | Camila Teste Demo | `camila.demo@wellflix.test` | `00000000008` |
| Profissional | Lara Nunes Demo | `lara.demo@wellflix.test` | `00000000002` |
| Profissional | Caio Mendes Demo | `caio.demo@wellflix.test` | `00000000003` |
| Profissional | Marina Lopes Demo | `marina.demo@wellflix.test` | `00000000004` |
| Moderador | Moderador Demo | `moderador.demo@wellflix.test` | `00000000005` |

**Senha de todas as contas fictícias:** `WellflixDemo123!`

CPFs da tabela são valores sintéticos de demonstração, não pertencem a pessoas reais e não devem ser usados para cadastros reais. Os perfis profissional e moderador estão provisionados somente para demonstrar login por papel; o cadastro público do frontend cria atletas. A opção de criar conta profissional na interface informa que esse cadastro ainda não está disponível.

## Preparar as contas no banco

As contas da tabela são definidas em `database/seeds/demo.sql`. Para carregá-las no banco de desenvolvimento/demonstração:

1. Confirme com o grupo que o banco compartilhado pode receber os dados fictícios e que migrations já foram aplicadas.
2. Em uma máquina autorizada a acessar esse PostgreSQL, configure `DATABASE_URL` no arquivo local `backend/.env`. Não copie essa variável para o frontend, para este documento ou para o GitHub.
3. Execute:

   ```bash
   cd backend
   npm install
   npm run seed:demo -- --confirm-demo-database
   ```

4. Aguarde a mensagem de sucesso. O comando insere/atualiza as contas e os demais dados de demonstração no banco indicado pela `DATABASE_URL`.

As três contas adicionais foram inseridas no PostgreSQL compartilhado do Labsoft e validadas pelo serviço Render: login e consulta autenticada de perfil retornaram `200`. Se o banco de demonstração for recriado ou trocado, execute o seed novamente para carregar essas identidades e o restante dos dados de demonstração.

## Teste de cadastro pelo frontend

Use este fluxo para mostrar a criação de uma identidade nova, independente das contas de seed:

1. Abra <https://wellflix-frontend.onrender.com>.
2. Clique em **Começar grátis** ou em **Criar conta** para abrir `/cadastro`.
3. Preencha nome completo, CPF de teste com 11 dígitos, e-mail ainda não usado e senha. Para uma demonstração, use dados claramente fictícios; não use CPF, senha ou e-mail pessoal de outra pessoa.
4. Não marque a opção de cadastro profissional. Esse fluxo ainda não está disponível e a interface apresentará uma mensagem explicativa.
5. Clique em **Cadastrar**. O resultado esperado é a mensagem de cadastro realizado com sucesso.
6. Se o e-mail ou CPF já existir, a API responderá conflito e a interface exibirá uma mensagem de erro. Para repetir o cadastro, use um e-mail e CPF de teste diferentes.

## Teste de login pelo frontend

1. Na tela de cadastro, clique em **Entrar** ou navegue para `/entrar`.
2. Para uma conta de seed, informe um dos e-mails da tabela e a senha `WellflixDemo123!`. Para a conta recém-cadastrada, use a senha escolhida no cadastro.
3. Deixe **Entrar como** em **Atleta** para as contas de atleta. Para testar os usuários de demonstração profissionais ou moderador, selecione o papel correspondente; esse papel precisa estar cadastrado na conta.
4. Clique em **Entrar**. O resultado esperado é o retorno à página inicial com a sessão ativa e o botão **Sair** no cabeçalho.
5. Atualize a página. A sessão permanece armazenada no navegador. Clique em **Sair** para encerrar e limpar a sessão local.
6. Para validar erro de autenticação, tente uma senha incorreta. O login deve ser recusado e a interface deve permanecer na tela de entrada.

## Comprovar a rota protegida da identidade

O login pelo frontend comprova a chamada à API e a recepção do token. Para demonstrar também a leitura autenticada do perfil:

1. Abra o Swagger em <https://wellflix-identidade-sophia.onrender.com/docs>.
2. Execute `POST /api/auth/sessao` com uma conta de atleta e `papel: "atleta"`, ou copie o `access_token` da resposta do login.
3. Clique em **Authorize** e informe `Bearer SEU_ACCESS_TOKEN`.
4. Execute `GET /api/atletas/me`.
5. A resposta esperada contém os dados do atleta autenticado e CPF parcialmente mascarado. Sem token válido, a rota deve responder `401`.

Não compartilhe nem inclua o token em capturas de tela, relatórios ou commits. Ele expira em 15 minutos.

### Conferir as contas cadastradas

Depois que a nova versão do serviço for publicada no Render, execute `GET /api/usuarios?limite=50&offset=0` no Swagger para conferir as contas fictícias com e-mail `@wellflix.test`. A rota é pública, mas não lista contas fora desse domínio e não retorna senhas, CPFs nem hashes. O sistema guarda apenas hashes de senha, que não podem ser convertidos de volta à senha original; para testar uma conta, use a senha informada no cadastro ou as credenciais fictícias deste checklist.

## O que registrar como evidência para a entrega

- A URL pública do frontend e a URL pública individual do serviço FastAPI da Sophia.
- A tela de cadastro mostrando uma conta de demonstração criada com sucesso, sem expor CPF completo ou dados pessoais reais.
- A tela após login bem-sucedido, com a sessão ativa.
- A chamada `GET /api/atletas/me` no Swagger e o retorno `200`; o token deve ficar oculto na captura.
- A resposta de erro ao testar uma senha incorreta ou cadastro duplicado.
- No painel do Render, o deploy ativo do serviço de identidade. `/health` confirma que o processo iniciou; o Swagger e as chamadas acima demonstram as rotas.

## Endpoints demonstrados

| Método | Rota | Acesso | Resultado |
|---|---|---|---|
| `POST` | `/api/atletas` | Público | Cria a conta, o papel de atleta e o perfil de atleta. |
| `POST` | `/api/auth/sessao` | Público | Valida credenciais e emite token Bearer para o papel solicitado. |
| `GET` | `/api/atletas/me` | Atleta autenticado | Retorna o perfil do titular do token. |
| `GET` | `/health` | Público | Confirma que a aplicação FastAPI está ativa. Não comprova, isoladamente, acesso ao banco. |

## Critérios de aceite

- Cadastro válido persiste e pode ser usado para entrar.
- E-mail ou CPF duplicado é recusado.
- Senha incorreta não emite token.
- Rota protegida funciona com token e recusa requisição sem token.
- A API não retorna hash de senha e mascara o CPF na consulta de perfil.
- O fluxo usa o frontend publicado, a API publicada da Sophia e o PostgreSQL configurado no backend.
