# WellFlix

## Visão geral

O WellFlix é uma plataforma voltada a conectar profissionais qualificados a pessoas que desejam melhorar a própria saúde. A proposta é oferecer acesso a conteúdos e orientações de profissionais em áreas como atividade física, nutrição e bem-estar.

O repositório está organizado em dois diretórios principais: `frontend/` contém a aplicação existente, construída com React e Vite; `backend/` está reservado para a implementação futura da API. As telas atuais apresentam as experiências de atletas, profissionais e moderadores com dados de demonstração. Ainda não há uma API nem conexão com banco de dados.

## Estrutura

```text
backend/                            # reservado para a API futura
frontend/
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
selenium/                           # testes automatizados do frontend
tests/                              # outros testes do projeto
docs/                               # especificações e materiais de referência
```

- **React** compõe a interface em páginas e componentes.
- **Vite** fornece o servidor de desenvolvimento e gera a versão de produção; sua configuração e dependências ficam em `frontend/`.
- **CSS** da aplicação está concentrado em `frontend/src/styles/global.css`.
- **Lucide React** fornece ícones.
- **Navegação:** `frontend/src/App.jsx` traduz caminhos em páginas e usa o histórico do navegador; `frontend/src/routes/AppRoutes.jsx` seleciona e renderiza cada tela.
- **Dados:** `frontend/src/data/content.js` e `frontend/src/data/plans.js` contêm dados estáticos. Trilhas personalizadas e avaliações de vídeo ficam no `localStorage`.
- **Comportamentos de demonstração:** cadastro/login, pagamento, publicação e moderação não persistem em um serviço de backend.

### Principais áreas do frontend

| Caminho | Conteúdo |
| --- | --- |
| `frontend/src/pages/` | Telas de início, exploração, detalhes de vídeo, profissionais, estúdio, moderação, trilhas, planos, checkout e cadastro/login. |
| `frontend/src/components/` | Cabeçalho, rodapé, cartões, filtros, métricas e elementos reaproveitados pelas páginas. |
| `frontend/src/routes/AppRoutes.jsx` | Seleção da página e passagem de propriedades de navegação. |
| `frontend/src/data/` | Catálogo demonstrativo de vídeos/profissionais/categorias e planos. |
| `frontend/src/styles/global.css` | Estilos globais e estilos das telas. |
| `backend/` | Espaço reservado para a futura API; ainda sem implementação. |

## Como executar

Requer Node.js e npm instalados.

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

## Divisão das responsabilidades entre os quatro integrantes

| Integrante | Contribuição no frontend |
| --- | --- |
| **Sophia** | Estrutura principal da aplicação e navegação entre páginas; página inicial e exploração de vídeos e profissionais; componentes de descoberta, filtros e dados de conteúdo. |
| **Maria Eduarda** | Experiência de conteúdo e evolução do atleta: detalhes dos vídeos, perfil profissional e trilhas, incluindo comentários, avaliações e organização de vídeos nas trilhas. |
| **Gabriel** | Experiência de publicação e moderação: estúdio do profissional, envio demonstrativo de conteúdo e painel para analisar, aprovar ou rejeitar vídeos. |
| **Luís** | Experiência de conta e assinatura: cadastro, login, apresentação de planos e checkout, além da cobertura dos principais fluxos de uso com testes. |
