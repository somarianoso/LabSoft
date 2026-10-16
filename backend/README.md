# Backend WellFlix

API Express/PostgreSQL separada do frontend. Os módulos `atletas`, `auth`,
`planos`, `assinaturas` e `trilhas` seguem o fluxo rota → service → repository
e não criam tabelas durante a inicialização.

## Executar

1. Copie `.env.example` para `.env`, configure `DATABASE_URL` e defina
   `AUTH_TOKEN_SECRET` como um segredo aleatório com pelo menos 32 bytes. Não
   versione o arquivo `.env`.
2. Instale as dependências com `npm install`.
3. Execute `npm run migrate`. As migrations deste backend criam identidade,
   categorias e perfil de atleta. A migration de trilhas exige que a migration
   de vídeos tenha sido integrada ao mesmo diretório antes dela.
4. Inicie com `npm start` (ou `npm run dev` durante o desenvolvimento).
5. Rode os testes unitários com `npm test`.

Sem `AUTH_TOKEN_SECRET` válido, a API inicia, mas login e endpoints privados
respondem `503 AUTHENTICATION_NOT_CONFIGURED`. O middleware compartilhado
valida tokens Bearer assinados (HS256, expiração de 15 minutos) e define
`request.auth.usuarioId` e `request.auth.papel` a partir das claims verificadas.
Módulos podem injetar outro `authenticateUser` em
`createApp({ pool, authenticateUser })`. Nunca derive o atleta de um ID enviado
pelo frontend; use a identidade verificada na sessão/token.

## Dependências de schema compartilhado

As migrations iniciais criam `usuarios`, `papeis_usuario`, `categorias` e
`atletas`:

- `usuarios` armazena nome, e-mail, CPF e hash da senha;
- `papeis_usuario` mantém papéis extensíveis sem misturá-los aos dados pessoais;
- `atletas(usuario_id UUID PRIMARY KEY REFERENCES usuarios(id))` representa o
  perfil e é a referência usada por assinaturas e trilhas;
- `categorias` é compartilhada pelos módulos que dependem dela.

`003_trilhas.sql` também depende de `videos(id UUID PRIMARY KEY)` e falha
explicitamente se a migration de vídeos estiver ausente. Integre todas as
migrations na sequência única da equipe, usando `wellflix_schema_migrations`;
módulos futuros devem adicionar seus arquivos ao mesmo diretório e usar o mesmo
comando, sem criar outro histórico de schema. Não edite migrations já
aplicadas; crie uma migration corretiva.

O campo `referencia_pagamento` guarda apenas um identificador do provedor. O
endpoint de criação registra a assinatura como `pendente_pagamento`; ativação
após confirmação do provedor deve ser integrada por um adaptador/webhook
autenticado. Número do cartão, validade e CVV não são recebidos nem persistidos.

## API

Todas as respostas bem-sucedidas usam `{ "data": ... }`; erros usam
`{ "error": { "code": "...", "message": "..." } }`.

| Método | Endpoint | Acesso | Uso |
| --- | --- | --- | --- |
| `GET` | `/api/health` | público | Verifica disponibilidade HTTP |
| `POST` | `/api/atletas` | público | Cadastra conta e perfil de atleta em uma transação |
| `GET` | `/api/atletas/me` | atleta | Consulta o próprio perfil |
| `POST` | `/api/auth/sessao` | público | Valida credenciais e emite token Bearer |
| `GET` | `/api/planos` | público | Lista planos ativos |
| `GET` | `/api/assinaturas/atual` | atleta | Consulta assinatura ativa ou pendente |
| `POST` | `/api/assinaturas` | atleta | Registra solicitação pendente |
| `POST` | `/api/assinaturas/:assinaturaId/cancelamento` | atleta | Cancela assinatura própria |
| `GET` | `/api/trilhas` | atleta | Lista trilhas próprias e progresso |
| `POST` | `/api/trilhas` | atleta | Cria trilha |
| `GET` | `/api/trilhas/:trilhaId` | atleta | Consulta trilha própria ou pública |
| `GET` | `/api/trilhas/publicas/:trilhaId` | público | Consulta somente trilha pública |
| `PATCH` | `/api/trilhas/:trilhaId` | atleta | Altera nome/privacidade da própria trilha |
| `POST` | `/api/trilhas/:trilhaId/videos` | atleta | Acrescenta vídeo no fim da trilha |
| `DELETE` | `/api/trilhas/:trilhaId/videos/:videoId` | atleta | Remove vídeo da própria trilha |
| `PUT` | `/api/trilhas/:trilhaId/videos/:videoId/progresso` | atleta | Registra progresso do vídeo na trilha |

Cadastro (`POST /api/atletas`):

```json
{
  "nome_completo": "Ana Silva",
  "cpf": "123.456.789-09",
  "email": "ana@example.com",
  "senha": "senha-com-pelo-menos-8-caracteres"
}
```

O backend normaliza e valida CPF/e-mail, armazena a senha usando scrypt e
retorna `409 CONFLICT` para e-mail ou CPF duplicados. O login (`POST
/api/auth/sessao`) recebe `email` e `senha` e retorna `access_token`,
`token_type`, `expires_in` e dados públicos da conta. Envie o token em
`Authorization: Bearer <access_token>`. O frontend atual o mantém somente em
memória.

Assinatura:

```json
{
  "codigo_plano": "basico",
  "metodo_pagamento": "cartao",
  "categorias": ["Yoga", "Musculação"]
}
```

Resposta `201 Created`:

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "plano_id": "00000000-0000-4000-8000-000000000002",
    "metodo_pagamento": "cartao",
    "situacao": "pendente_pagamento",
    "data_inicio": null,
    "data_vencimento": null,
    "data_criacao": "2026-10-16T12:00:00.000Z",
    "plano": {
      "codigo": "basico",
      "nome": "Básico",
      "preco_mensal_centavos": 2900
    },
    "categorias": [
      { "id": "00000000-0000-4000-8000-000000000003", "nome": "Yoga" },
      {
        "id": "00000000-0000-4000-8000-000000000004",
        "nome": "Musculação"
      }
    ]
  }
}
```

```json
{
  "nome": "Mobilidade matinal",
  "privacidade": "privada"
}
```

Resposta `201 Created`:

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000005",
    "nome": "Mobilidade matinal",
    "privacidade": "privada",
    "data_criacao": "2026-10-16T12:00:00.000Z",
    "data_atualizacao": "2026-10-16T12:00:00.000Z"
  }
}
```

```json
{
  "segundos_assistidos": 420,
  "concluido": false
}
```

Os nomes das categorias devem corresponder a `categorias.nome`; categorias são
persistidas como uma relação, não como uma lista na assinatura. Vídeos são
referenciados por UUID de `videos.id`; `videos_trilha.ordem` preserva a
sequência e `progresso_trilha` é limitado aos vídeos presentes na trilha.
Para planos com `limite_categorias = NULL`, uma lista vazia em
`categorias_assinatura` representa acesso a todas as categorias.

## Frontend atual

Cadastro/login de atletas em `frontend/src` consomem a API. O checkout e as
trilhas ainda usam dados de demonstração, e os vídeos de demonstração não têm
UUIDs do catálogo. A integração desses fluxos depende dos módulos de categorias
e vídeos e do adaptador autenticado do provedor de pagamento.
