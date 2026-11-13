# WellFlix

## Visão geral

O WellFlix é uma plataforma voltada a conectar profissionais qualificados a pessoas que desejam melhorar a própria saúde. A proposta é oferecer acesso a conteúdos e orientações de profissionais em áreas como atividade física, nutrição e bem-estar.

O repositório é dividido em duas partes: o frontend React/Vite em `frontend/` e o backend com quatro microsserviços FastAPI em `backend/services/`. Cada microsserviço cobre um domínio, é dono do próprio banco (um schema PostgreSQL exclusivo, com migrations e seeds na pasta do serviço) e pode ser publicado individualmente no Render. Os serviços se integram por eventos Kafka e chamadas REST, sem chaves estrangeiras entre bancos. Veja [como executar e implantar os serviços](./backend/services/README.md), a [integração entre microsserviços](./docs/backend/Integra%C3%A7%C3%A3o%20entre%20microsservi%C3%A7os.md) e o [plano de implementação](./docs/backend/Plano%20de%20implementa%C3%A7%C3%A3o%20do%20backend.md).

## Estrutura

```text
frontend/                           # FRONTEND (Static Site no Render)
  ├── index.html
  ├── package.json
  ├── public/assets/
  └── src/
      ├── main.jsx                 # monta a aplicação React e importa o CSS global
      ├── App.jsx                  # estado geral, navegação e dados locais
      ├── routes/AppRoutes.jsx
      ├── pages/                   # telas por funcionalidade
      ├── components/              # componentes reutilizáveis
      ├── data/                    # conteúdo e planos estáticos
      └── styles/global.css
backend/                            # BACKEND (Web Services Python no Render)
  └── services/
      ├── identidade/               # FastAPI: Sophia        (schema identidade)
      ├── conta/                    # FastAPI: Maria Eduarda (schema conta)
      ├── profissionais/            # FastAPI: Gabriel       (schema profissionais)
      ├── catalogo/                 # FastAPI: Luís          (schema catalogo)
      │   ├── migrations/           # SQL do banco do serviço
      │   └── seeds/demo.sql        # dados fictícios de demonstração
      └── shared/                   # conexão, autenticação, eventos Kafka, migrations
render.yaml                         # blueprint dos quatro serviços e do frontend
docker-compose.yml                  # PostgreSQL + Kafka para desenvolvimento local
scripts/                            # rodar_local.sh, parar_local.sh, demo_integracao.py
selenium/                           # testes automatizados do frontend
tests/test_moderator.py             # teste Selenium avulso do moderador (fora da suíte)
docs/                               # documentação
  ├── backend/                      # plano, arquitetura e publicação no Render
  ├── banco_dados/                  # diagramas ER e de integração, apresentações do modelo
  ├── produto/                      # especificação do produto e protótipos Figma
  ├── testes/                       # roteiros e checklists de teste
  └── entregas/                     # entregas individuais, roteiros de vídeo e apresentações
```

- **React** compõe a interface em páginas e componentes.
- **Vite** fornece o servidor de desenvolvimento e gera a versão de produção; sua configuração e dependências ficam em `frontend/`.
- **CSS** da aplicação está concentrado em `frontend/src/styles/global.css`.
- **Lucide React** fornece ícones.
- **Navegação:** `frontend/src/App.jsx` traduz caminhos em páginas e usa o histórico do navegador; `frontend/src/routes/AppRoutes.jsx` seleciona e renderiza cada tela.
- **Dados:** `frontend/src/data/content.js` e `frontend/src/data/plans.js` contêm dados estáticos. Trilhas personalizadas e avaliações de vídeo ficam no `localStorage`.
- **Comportamentos de demonstração:** pagamento, publicação e moderação ainda não persistem em um serviço de backend.

### Principais áreas do frontend

| Caminho | Conteúdo |
| --- | --- |
| `frontend/src/pages/` | Telas de início, exploração, detalhes de vídeo, profissionais, estúdio, moderação, trilhas, planos, checkout e cadastro/login. |
| `frontend/src/components/` | Cabeçalho, rodapé, cartões, filtros, métricas e elementos reaproveitados pelas páginas. |
| `frontend/src/routes/AppRoutes.jsx` | Seleção da página e passagem de propriedades de navegação. |
| `frontend/src/data/` | Catálogo demonstrativo de vídeos/profissionais/categorias e planos. |
| `frontend/src/styles/global.css` | Estilos globais e estilos das telas. |
| `backend/services/` | Quatro microsserviços FastAPI separados por domínio. |
| `backend/services/<servico>/migrations/` | Migrations do banco (schema) de cada serviço. |
| `backend/services/<servico>/seeds/` | Dados fictícios de demonstração de cada serviço. |

## Como executar

O frontend requer Node.js e npm instalados.

```bash
cd frontend
npm install
npm run dev
```

Para verificar a compilação de produção:

```bash
cd frontend
npm run build
```

O projeto também oferece `npm run preview` para servir localmente a compilação gerada. Execute esses comandos dentro de `frontend/`.

Para subir o backend inteiro localmente (PostgreSQL e Kafka no Docker, migrations, os quatro serviços com logs em `logs/`) e ver a integração funcionando:

```bash
pip install -r backend/services/identidade/requirements.txt
scripts/rodar_local.sh
python scripts/demo_integracao.py
```

Detalhes em [backend/services/README.md](./backend/services/README.md) e no [modelo arquitetônico de integração](./docs/entregas/Modelo%20arquitet%C3%B4nico%20de%20integra%C3%A7%C3%A3o.md).

## Divisão das responsabilidades entre os quatro integrantes

| Integrante | Contribuição no frontend |
| --- | --- |
| **Sophia** | Estrutura principal da aplicação e navegação entre páginas; página inicial e exploração de vídeos e profissionais; componentes de descoberta, filtros e dados de conteúdo. |
| **Maria Eduarda** | Experiência de conteúdo e evolução do atleta: detalhes dos vídeos, perfil profissional e trilhas, incluindo comentários, avaliações e organização de vídeos nas trilhas. |
| **Gabriel** | Experiência de publicação e moderação: estúdio do profissional, envio demonstrativo de conteúdo e painel para analisar, aprovar ou rejeitar vídeos. |
| **Luís** | Experiência de conta e assinatura: cadastro, login, apresentação de planos e checkout, além da cobertura dos principais fluxos de uso com testes. |
