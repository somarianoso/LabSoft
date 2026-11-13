# Roteiro de vídeo — Profissionais e moderadores do WellFlix

**Duração estimada:** 6 minutos e 20 segundos  
**Formato:** narração com gravação de tela  
**Objetivo:** explicar a arquitetura do serviço, apresentar um cenário de negócio sem usar o sistema e, em seguida, demonstrar como o WellFlix atende a esse cenário.

## Antes de gravar

- Deixe o frontend aberto: <https://wellflix-frontend.onrender.com>
- Deixe a saúde da API disponível: <https://wellflix-profissionais-moderadores.onrender.com/health>
- Deixe a documentação interativa da API disponível: <https://wellflix-profissionais-moderadores.onrender.com/docs>
- Prepare contas de demonstração com os papéis de profissional e moderador, e um conteúdo de teste aguardando revisão. Não exiba senhas nem dados pessoais reais.
- Confirme que o serviço acordou antes de começar: no plano gratuito, o primeiro acesso pode demorar após um período de inatividade.

> **Atenção ao link informado:** `https://wellflix-profissionais-moderadores.com/docs` não resolveu durante a verificação. O endereço de documentação que respondeu foi `https://wellflix-profissionais-moderadores.onrender.com/docs`.

## Roteiro

### 0:00–0:35 — Abertura

**Na tela:** exiba o WellFlix e o nome do serviço que será apresentado.

**Fala:**

“Olá! Neste vídeo vou apresentar a arquitetura e o funcionamento do serviço de profissionais e moderadores do WellFlix. Primeiro, vou explicar como as partes se organizam. Depois, vou descrever um cenário de negócio sem usar o sistema e, por fim, vou mostrar como esse mesmo fluxo acontece na aplicação.”

### 0:35–1:35 — Arquitetura individual

**Na tela:** mostre uma visão geral simples: navegador → frontend → API de profissionais e moderação → PostgreSQL.

**Fala:**

“O frontend do WellFlix é uma aplicação web publicada separadamente. Ele apresenta as telas e envia requisições HTTP para as APIs de backend. O endereço mostrado aqui é o serviço publicado para profissionais e moderadores.

“Nesse serviço, as operações de profissionais e de moderação estão agrupadas na mesma aplicação FastAPI. Para profissionais, há operações como consultar perfis, criar ou atualizar o próprio perfil e seguir outros profissionais. Para moderadores, há operações para consultar vídeos pendentes, aprovar ou rejeitar conteúdos e arquivar vídeos.

“As rotas protegidas verificam o token de autenticação e o papel associado à conta. Assim, as operações de profissional exigem o papel profissional, enquanto as ações de moderação exigem o papel de moderador. A API também disponibiliza uma rota de saúde e documentação interativa.

“Quanto aos dados, cada microsserviço tem o próprio banco. O banco deste serviço guarda os perfis profissionais, os moderadores, as categorias de cada profissional, os seguidores e as revisões de vídeo. Usuários e vídeos pertencem a outros serviços: aqui guardamos só o id deles, e os dados chegam por eventos Kafka ou pela API do serviço dono.”

### 1:35–2:25 — Cenário de negócio sem usar o sistema

**Na tela:** use um slide ou um quadro com três etapas: envio, análise e publicação. Não interaja com o WellFlix nesta parte.

**Fala:**

“Imagine uma plataforma de bem-estar que recebe vídeos de profissionais. Antes de o conteúdo ficar visível para o público, é necessário verificar se ele está adequado.

“Sem usar um sistema, o profissional poderia enviar um vídeo por mensagem para a equipe. Alguém registraria manualmente quem enviou e quando. Um moderador assistiria ao material, comunicaria a decisão e outra pessoa atualizaria uma lista para indicar se o vídeo foi aprovado ou rejeitado. Esse processo pode gerar demora, perda de informações e falta de clareza sobre o estado de cada conteúdo.

“O fluxo de negócio que vamos testar é: um profissional envia um vídeo; o vídeo aguarda análise; um moderador toma uma decisão; e, se aprovado, o conteúdo pode ser exibido aos usuários.”

### 2:25–4:50 — Mesmo cenário no WellFlix

**Na tela:** abra o frontend e percorra as telas de profissional e moderador preparadas para a demonstração.

**Fala e ações:**

“Agora vou executar esse mesmo fluxo no WellFlix. Primeiro, entro com uma conta de profissional. Na área correspondente, posso preencher ou consultar os dados do perfil, como especialidade, biografia e categorias.”

**Ação:** mostre o perfil profissional; se houver um vídeo de teste pronto, mostre também a opção de envio. Evite preencher informações pessoais reais.

“Depois do envio, o conteúdo fica associado ao profissional e passa pelo estado de revisão. Isso permite que a equipe analise o material antes de torná-lo público.”

**Ação:** mostre o vídeo de demonstração aguardando revisão ou, se não for possível fazer um envio ao vivo, explique que este item foi preparado antes da gravação.

“Agora vou trocar para uma conta de moderador. A conta de moderador tem acesso à fila de análise, onde é possível consultar os conteúdos pendentes e identificar quem os enviou.”

**Ação:** abra a fila do moderador, localize o vídeo preparado e mostre os detalhes disponíveis para avaliação.

“Após analisar o conteúdo, o moderador registra uma decisão: aprovar ou rejeitar. Neste exemplo, vou aprovar o vídeo. A decisão atualiza o estado do conteúdo e fica registrada com a revisão correspondente.”

**Ação:** aprove o vídeo de teste e mostre a atualização na interface. Se houver tempo, explique brevemente que a rejeição também pode ser registrada com uma observação.

“Com a aprovação, o vídeo passa a poder aparecer como conteúdo publicado. Assim, o mesmo fluxo que antes dependeria de mensagens e controles manuais fica organizado em etapas dentro da aplicação: envio, fila de revisão, decisão e publicação.”

### 4:50–5:35 — Saúde e documentação da API

**Na tela:** visite `/health` e depois `/docs`.

**Fala:**

“Além da interface, podemos verificar diretamente a API. A rota de saúde responde se o serviço está ativo. Já a documentação interativa permite visualizar os endpoints e seus métodos, como as rotas de profissionais e as rotas de moderação.

“As rotas que exigem autenticação precisam receber um token válido e o papel adequado. A documentação ajuda a entender a integração e a testar as chamadas, enquanto o frontend oferece a experiência de uso para as pessoas da plataforma.”

### 5:35–6:20 — Dificuldades e próximos passos

**Na tela:** volte à visão geral da arquitetura ou exiba uma lista curta de melhorias.

**Fala:**

“Uma dificuldade que merece análise posterior é a consistência entre bancos: como não há chave estrangeira entre serviços, o vínculo entre revisões, vídeos e usuários depende dos eventos e das chamadas entre APIs. Isso evita que uma alteração no banco de um serviço quebre os outros, mas exige cuidado com eventos atrasados ou serviços fora do ar.

“Também é importante evoluir testes automatizados para os diferentes papéis e para os estados do vídeo, além de planejar armazenamento externo adequado para os arquivos de mídia. Para esta demonstração, usei contas e conteúdo preparados previamente.

“Esse foi o fluxo do serviço de profissionais e moderadores do WellFlix: a arquitetura, o cenário de negócio e sua execução no sistema. Obrigado por assistir!”

## Checklist rápido da gravação

- O vídeo cobre os quatro tópicos pedidos: arquitetura individual, cenário sem sistema, funcionamento do sistema nesse cenário e uma dificuldade para análise posterior.
- A duração prevista, incluindo pausas curtas nas trocas de tela, é de aproximadamente **6 minutos e 20 segundos**, dentro do intervalo de 5 a 7 minutos.
- O cenário de demonstração deve usar conteúdo fictício e contas provisionadas previamente.
- Use o link `onrender.com/docs` validado acima; não use o domínio `.com` até confirmar sua configuração.
