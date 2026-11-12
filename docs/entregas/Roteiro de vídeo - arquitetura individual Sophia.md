# Roteiro de vídeo — Arquitetura individual de identidade

**Duração prevista:** aproximadamente 6 minutos  
**Aluna:** Sophia — serviço de identidade  
**Objetivo:** apresentar a arquitetura individual, explicar um cenário de negócio, demonstrar como o serviço atende esse cenário e comentar pontos para análise futura.

## Links para mostrar no vídeo

- **Frontend React:** <https://wellflix-frontend.onrender.com>
- **Backend individual — FastAPI:** <https://wellflix-identidade-sophia.onrender.com>
- **Saúde do serviço:** <https://wellflix-identidade-sophia.onrender.com/health>
- **Documentação Swagger do serviço de identidade:** <https://wellflix-identidade-sophia.onrender.com/docs>

> Para a documentação da Sophia, use o endereço do serviço de identidade acima. O link do serviço de conta da Maria é outro microserviço.

## Roteiro falado e demonstração

### 0:00–0:35 — Apresentação

**Na tela:** título do trabalho e links publicados.

**Fala:**

“Olá, meu nome é Sophia e vou apresentar minha entrega individual do WellFlix: o microserviço de identidade. Vou explicar onde ele se encaixa na arquitetura, apresentar um cenário de negócio e demonstrar o cadastro e o acesso de uma pessoa atleta.”

### 0:35–1:35 — Arquitetura individual

**Na tela:** mostre o frontend publicado e, em seguida, o endereço do backend e o `/health`.

**Fala:**

“A interface do WellFlix foi desenvolvida em React e publicada como Static Site no Render. Minha entrega individual é o serviço de identidade, implementado em Python com FastAPI e publicado como Web Service no Render. O frontend chama esse backend por HTTPS. O serviço de identidade é responsável pelo cadastro e login de atletas e por fornecer dados do perfil autenticado. As informações são persistidas no PostgreSQL compartilhado pelo projeto. O banco é compartilhado entre os microserviços, mas os dados ficam organizados em tabelas relacionadas, como usuários, papéis e atletas. A rota `/health` confirma que o serviço está ativo; a documentação Swagger permite explorar suas operações.”

### 1:35–2:25 — Cenário de negócio, sem usar o sistema

**Na tela:** apresente o cenário em um slide ou apenas narre, sem navegar no site.

**Fala:**

“O cenário que vou usar é o de uma pessoa que quer acompanhar conteúdos de bem-estar e treinamento no WellFlix. Antes de acessar os recursos da plataforma, ela precisa criar uma conta. Depois, deve conseguir entrar novamente com as mesmas credenciais. O sistema precisa reconhecer a identidade, proteger as informações pessoais e permitir que cada pessoa acesse o próprio perfil. Também deve impedir o cadastro duplicado com o mesmo e-mail ou CPF e recusar o login quando a senha estiver incorreta.”

### 2:25–4:35 — Como o sistema atende ao cenário

**Na tela:** abra o frontend e mostre o cadastro e o login. Use dados fictícios e uma conta de teste com e-mail não utilizado.

**Fala:**

“Agora vou demonstrar o cenário no sistema. Na tela de cadastro, vou criar uma conta de teste de atleta usando dados fictícios. O frontend envia os campos para o serviço de identidade. A API valida os dados, armazena a senha como hash e grava a conta com o papel de atleta e seu perfil no banco. A mensagem de sucesso confirma que o cadastro foi aceito.”

**Ação:** preencha e envie o cadastro. Não use dados pessoais reais.

**Fala:**

“Em seguida, vou entrar com o mesmo e-mail e senha. O frontend envia as credenciais ao serviço de identidade. A API confere a senha e, se estiver correta, devolve um token de acesso. O frontend usa esse token para manter a sessão e retorna à página inicial. O botão ‘Sair’ indica que há uma sessão ativa.”

**Ação:** faça login, mostre a página inicial e o botão **Sair**. Opcionalmente atualize a página para mostrar a sessão restaurada e depois encerre-a.

### 4:35–5:20 — Verificação complementar da API

**Na tela:** abra o Swagger da Sophia em `/docs`; mostre `GET /api/atletas/me`. Não exponha o token na gravação.

**Fala:**

“Como verificação complementar, a rota `GET /api/atletas/me` retorna o perfil associado ao token autenticado. Com um token válido, a API responde com os dados do atleta e mascara o CPF. Sem autenticação, a rota deve recusar a requisição. Assim, o login não apenas muda a tela: ele permite acessar uma operação protegida da identidade.”

### 5:20–6:10 — Dificuldades e próximos pontos de análise

**Na tela:** mostre o serviço no Render ou volte aos links e conclua.

**Fala:**

“Um ponto que pode ser analisado posteriormente é o gerenciamento administrativo de papéis. O cadastro público cria atletas; papéis de profissional e moderador precisam ser concedidos por um processo autorizado, para evitar que qualquer usuário eleve o próprio acesso. Também existe uma dependência entre serviços publicados separadamente: as URLs do frontend, a configuração de CORS e a disponibilidade do banco precisam permanecer coerentes. Em uma evolução do projeto, podemos estudar uma administração segura de papéis e estratégias para monitorar e testar essa integração entre serviços.”

“Com isso, demonstrei minha arquitetura individual, o cenário de negócio e o fluxo de cadastro, autenticação e acesso ao perfil. Obrigada.”

## Checklist antes de gravar

- Confirme que o frontend e o serviço da Sophia abrem nos links acima.
- Tenha pronto um e-mail de teste ainda não cadastrado; use somente dados fictícios.
- Faça login uma vez antes de gravar para conferir a senha e a disponibilidade.
- O link `/health` deve responder com o serviço ativo; o teste de login demonstra também o acesso ao banco.
- Não mostre senha, token Bearer, variáveis de ambiente ou credenciais do banco na gravação.
- Se o cadastro ou login falhar por CORS ou indisponibilidade, registre a mensagem e relate isso como dificuldade observada, sem afirmar que o fluxo foi concluído.
