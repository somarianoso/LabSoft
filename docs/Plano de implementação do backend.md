# Plano de implementação do backend do WellFlix

## Objetivo

Entregar **quatro serviços de backend independentes em FastAPI/Python**, conectados ao PostgreSQL existente, integrados ao frontend React e publicados no Render. Cada aluno ficará responsável por um serviço e entregará a URL pública própria, com `/docs` e `/health` acessíveis. O frontend e o banco podem ser compartilhados pelo grupo.

## O que já existe no repositório

O critério da atividade pede **backend FastAPI/Python**. Foram criados quatro serviços Python independentes em `services/`, reutilizando o schema PostgreSQL e usando o código Express como referência legada. Os serviços têm rotas iniciais por domínio, autenticação Bearer compartilhada, respostas JSON envelopadas e endpoints `/health` e `/docs`.

O código Express segue disponível em `backend/`, mas não é o backend a publicar para a atividade. As APIs FastAPI foram separadas por domínio; cadastro e login do atleta já consomem a API de identidade pelo frontend. Checkout, trilhas, conteúdo, publicação e moderação ainda precisam de integração completa com as telas. Pagamento real, armazenamento de mídia e aprovação de papéis dependem de integrações/configuração adicionais.

## Serviços/funcionalidades previstos

| Serviço/domínio | Funcionalidades previstas nos documentos | Situação observada |
| --- | --- | --- |
| Conta e autenticação | Cadastro, login e validação de sessão | API FastAPI criada em `services/identidade`; perfil e login de atleta estão disponíveis. |
| Catálogo e descoberta | Banner, destaques, profissionais, vídeos e filtros por categoria/avaliação | API FastAPI criada em `services/catalogo`; partes de banner/destaques e telas ainda usam demonstrações. |
| Player e interação | Obter vídeo, próximos vídeos, comentários e avaliações gostei/não gostei | Rotas FastAPI e migration de comentários/avaliações criadas; falta conectar telas. |
| Planos, assinatura e pagamento | Listar planos, registrar assinatura/compra e atualizar acesso do atleta | API FastAPI criada em `services/conta`; confirmação de pagamento depende de integração segura com provedor. |
| Trilhas | Listar/criar/editar trilhas, adicionar/remover vídeos e salvar progresso | Rotas FastAPI criadas; falta integrar telas e substituir IDs demonstrativos por IDs do catálogo. |
| Perfil do profissional | Mostrar dados e vídeos, seguir profissional | Rotas FastAPI criadas em `services/profissionais`; perfis e papéis precisam ser provisionados no banco. |
| Estúdio do criador | Ver envios recentes e publicar/upload de vídeo | Rotas FastAPI de submissão e listagem criadas; arquivo precisa estar em armazenamento externo. |
| Moderação | Listar pendentes/publicados/rejeitados, aprovar/rejeitar e remover conteúdo | Rotas FastAPI de decisão e arquivamento lógico criadas; moderador precisa ter papel provisionado e falta integrar painel. |
| Alertas | Notificar por WhatsApp sobre novo conteúdo relevante ao plano/interesses | Funcionalidade prevista no documento de usuários; deixar como etapa posterior, sujeita a provedor externo. |

## Plano de execução

### 1. Fechar arquitetura e contrato dos serviços

- Manter quatro diretórios implantáveis independentemente, um por serviço/aluno, cada qual com `main.py` e `requirements.txt`; compartilhar configuração local em `services/.env.example`. Cada serviço expõe `/health` e `/docs`.
- Manter o prefixo `/api` em todos os serviços. Cada serviço usa a mesma `DATABASE_URL` e o mesmo segredo de autenticação, mas credenciais são configuradas separadamente nos serviços Render.
- Compartilhar o contrato HTTP: sucesso `{ "data": ... }`, erro `{ "error": { "code": "...", "message": "..." } }`; autenticação Bearer e papéis `atleta`, `profissional`, `moderador`.
- Usar PostgreSQL e migrations existentes como referência; não criar schema concorrente. Garantir que os quatro serviços apontam para o mesmo banco e para a mesma sequência de migrations.
- Restringir CORS às origens do frontend. Documentar cada endpoint com OpenAPI/Swagger do FastAPI e manter variáveis/secrets fora do Git.

### 2. Dividir os serviços e implementar os fluxos

Os quatro serviços FastAPI e as rotas iniciais já estão no repositório (veja a tabela abaixo). Próximos passos: revisar contratos em conjunto, aplicar `006_interacoes.sql`, configurar as contas/papéis necessários, conectar as telas frontend, configurar variáveis Render e publicar cada serviço. Não duplicar tabelas nem editar migrations já aplicadas; crie uma migration corretiva quando necessário.

### 3. Integrações e automações posteriores

- Webhook assinado do provedor de pagamento para confirmar/cancelar assinatura.
- Alertas WhatsApp após publicação, respeitando consentimento e preferências do atleta.
- Métricas e melhorias de catálogo depois dos fluxos principais estarem estáveis.

## Divisão dos quatro serviços e entregas individuais

Os nomes seguem os quatro integrantes registrados no README. Cada linha representa um **serviço FastAPI independente**, com raiz/deploy próprio no Render e URL individual. Os serviços compartilham PostgreSQL, autenticação e convenções de resposta. Dentro de cada serviço, manter módulos por domínio quando ajudar a organização.

| Aluno / serviço | Responsabilidades | Rotas mínimas para demonstrar | Entrega individual |
| --- | --- | --- | --- |
| **Sophia — Identidade e atleta** | Cadastro e login; hash seguro de senha; emissão/validação de token Bearer; perfil `/me`; autorização de atleta. Não implementar identidade em duplicidade nos outros serviços. | `POST /api/atletas`, `POST /api/auth/sessao`, `GET /api/atletas/me`, `GET /health`. | URL própria no Render, `/docs` e demonstração de cadastro/login e rota privada com token. |
| **Maria Eduarda — Planos, assinaturas e trilhas** | Consulta de planos; solicitar/cancelar assinatura; selecionar categorias; trilhas privadas/públicas; ordenar vídeos e registrar progresso. Pagamento sem confirmação do provedor permanece pendente. | `GET /api/planos`, `POST /api/assinaturas`, `GET /api/assinaturas/atual`, `GET/POST /api/trilhas`, rota de progresso, `GET /health`. | URL própria no Render, `/docs` e demonstração de persistência de uma assinatura pendente e progresso de trilha. |
| **Gabriel — Profissionais e moderação** | Perfil/categorias de profissionais; seguir/deixar de seguir; dados e vídeos do perfil; listar fila de moderação; aprovar/rejeitar conteúdo; proteger rotas por papel. | `GET /api/profissionais`, `GET/PUT /api/profissionais/me`, `POST /api/profissionais/{id}/seguir`, `GET /api/moderacao/videos`, ações de aprovação/rejeição, `GET /health`. | URL própria no Render, `/docs` e demonstração das permissões de profissional e moderador. |
| **Luís — Catálogo, vídeos e interação** | Listar catálogo publicado e categorias; busca/filtros; detalhe/player e recomendações; comentários e avaliações; metadados de vídeo e submissão para revisão. O arquivo de vídeo fica em armazenamento de objetos, não no PostgreSQL. | `GET /api/categorias`, `GET /api/videos`, `GET /api/videos/{id}`, rotas de comentários/avaliações e submissão, `GET /health`. | URL própria no Render, `/docs` e demonstração de busca, detalhe e conteúdo ainda pendente fora do catálogo público. |

**Infraestrutura e integração (trabalho conjunto):** a definição inicial dos quatro Web Services Python e do Static Site React está em `render.yaml`. Ainda é necessário criar/atualizar os recursos no Render, preencher `DATABASE_URL`, gerar e compartilhar o mesmo segredo entre serviços, configurar CORS e definir as quatro variáveis Vite. Cada integrante deve publicar e comprovar seu próprio serviço e URL Render.

Configuração no Blueprint `render.yaml`: cada serviço instala seu `requirements.txt`, inicia o módulo FastAPI em `0.0.0.0:$PORT` e usa `/health` como health check. Os nomes são `wellflix-identidade`, `wellflix-conta`, `wellflix-profissionais` e `wellflix-catalogo`. Todos recebem `DATABASE_URL`, `AUTH_TOKEN_SECRET` e `FRONTEND_ORIGIN`; mantenha valores secretos só no painel do Render. O Static Site do frontend recebe as URLs individuais como variáveis `VITE_AUTH_API_URL`, `VITE_ACCOUNT_API_URL`, `VITE_CREATOR_API_URL` e `VITE_CATALOG_API_URL`.

**Dependências entre as entregas:** definir primeiro contrato comum e migrations compartilhadas. O serviço de identidade é dependência para testar rotas privadas; os serviços Maria, Gabriel e Luís validam o token compartilhado e consultam o mesmo banco. O catálogo só exibe vídeos aprovados. A integração do frontend usa URLs independentes e deve ser configurável sem editar código.

## Implantação no Render

Arquitetura para cumprir a entrega individual: **React como Static Site**, **quatro FastAPI Web Services** (um por integrante) e **um PostgreSQL compartilhado**. Cada Web Service tem URL Render individual e `/docs`; todos leem as variáveis de ambiente necessárias. Guardar `DATABASE_URL`, segredo de autenticação e credenciais de integrações como variáveis do Render. Cada backend escuta em `0.0.0.0` na porta fornecida por `$PORT`, expõe `/health` e permite CORS apenas para os domínios necessários. Usar URL interna do banco quando serviços e banco estiverem na mesma região.

Para o FastAPI, o guia do Render usa `pip install -r requirements.txt` no build e `uvicorn main:app --host 0.0.0.0 --port $PORT` para iniciar; ajustar o módulo conforme a estrutura do projeto. Deploys gratuitos podem suspender o serviço web após período sem atividade, então considerar esse comportamento na apresentação. Aplicar migrations de forma controlada antes de iniciar a nova versão e conferir os dados existentes antes de qualquer alteração destrutiva.

O frontend precisa receber URLs públicas separadas por variáveis de build (por exemplo `VITE_AUTH_API_URL`, `VITE_CATALOG_API_URL`, `VITE_CREATOR_API_URL`, `VITE_ACCOUNT_API_URL`) e enviar o token nas rotas privadas. Remover dependências de mocks gradualmente, começando pelos fluxos de cada entrega.

## Critérios de conclusão da entrega

- Os quatro serviços FastAPI estão publicados separadamente no Render; cada um abre sua própria URL, `/health` e `/docs`.
- O frontend publicado consome ao menos o fluxo de autenticação e os módulos implementados, sem URL localhost.
- As operações principais persistem no PostgreSQL e respeitam autenticação/autorização por papel.
- Cada aluno consegue entregar a URL pública do serviço sob sua responsabilidade e evidenciar suas rotas em `/docs`.
- Configuração, endpoints, limitações conhecidas e autoria estão descritos no README.

## Referências

- `docs/Serviços backend.pdf`
- `docs/Lista de Usuários e de Funcionalidades (1).pdf`
- `docs/Especificação de Bancos de dados.md`
- `docs/Guia de implementação do banco de dados.md`
- [Render: Deploy a FastAPI App](https://render.com/docs/deploy-fastapi)
- [Render: Static Sites](https://render.com/docs/static-sites)
- [Render: Web Services](https://render.com/docs/web-services)
