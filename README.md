# WellFlix — Frontend

## Visão geral

O WellFlix é uma plataforma voltada a conectar profissionais qualificados a pessoas que desejam melhorar a própria saúde. A proposta é oferecer acesso a conteúdos e orientações de profissionais em áreas como atividade física, nutrição e bem-estar.

Atualmente, este repositório contém **somente o frontend**, construído com React e Vite. As telas apresentam as experiências de atletas, profissionais e moderadores com dados de demonstração. Ainda não há uma API nem conexão com banco de dados neste projeto.

## Arquitetura atual

```text
index.html
  └── src/main.jsx                 # monta a aplicação React e importa o CSS global
        └── src/App.jsx            # estado geral, navegação e dados locais
              ├── src/routes/AppRoutes.jsx
              │     └── src/pages/ # telas por funcionalidade
              ├── src/components/  # componentes reutilizáveis
              └── src/data/        # conteúdo e planos estáticos
```

- **React** compõe a interface em páginas e componentes.
- **Vite** fornece o servidor de desenvolvimento e gera a versão de produção.
- **CSS** da aplicação está concentrado em `src/styles/global.css`.
- **Lucide React** fornece ícones.
- **Navegação:** `App.jsx` traduz caminhos em páginas e usa o histórico do navegador; `AppRoutes.jsx` seleciona e renderiza cada tela.
- **Dados:** `src/data/content.js` e `src/data/plans.js` contêm dados estáticos. Trilhas personalizadas e avaliações de vídeo ficam no `localStorage`.
- **Comportamentos de demonstração:** cadastro/login, pagamento, publicação e moderação não persistem em um serviço de backend.

### Principais áreas do frontend

| Caminho | Conteúdo |
| --- | --- |
| `src/pages/` | Telas de início, exploração, detalhes de vídeo, profissionais, estúdio, moderação, trilhas, planos, checkout e cadastro/login. |
| `src/components/` | Cabeçalho, rodapé, cartões, filtros, métricas e elementos reaproveitados pelas páginas. |
| `src/routes/AppRoutes.jsx` | Seleção da página e passagem de propriedades de navegação. |
| `src/data/` | Catálogo demonstrativo de vídeos/profissionais/categorias e planos. |
| `src/styles/global.css` | Estilos globais e estilos das telas. |

## Como executar

Requer Node.js e npm instalados.

```bash
npm install
npm run dev
```

Para verificar a compilação de produção:

```bash
npm run build
```

O projeto também oferece `npm run preview` para servir localmente a compilação gerada.

## Divisão das responsabilidades entre os quatro integrantes

| Integrante | Contribuição no frontend |
| --- | --- |
| **Sophia** | Estrutura principal da aplicação e navegação entre páginas; página inicial e exploração de vídeos e profissionais; componentes de descoberta, filtros e dados de conteúdo. |
| **Maria Eduarda** | Experiência de conteúdo e evolução do atleta: detalhes dos vídeos, perfil profissional e trilhas, incluindo comentários, avaliações e organização de vídeos nas trilhas. |
| **Gabriel** | Experiência de publicação e moderação: estúdio do profissional, envio demonstrativo de conteúdo e painel para analisar, aprovar ou rejeitar vídeos. |
| **Luís** | Experiência de conta e assinatura: cadastro, login, apresentação de planos e checkout, além da cobertura dos principais fluxos de uso com testes. |
