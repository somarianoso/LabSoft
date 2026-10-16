# Backend WellFlix: assinaturas e trilhas

API Express/PostgreSQL separada do frontend. Os módulos `planos`, `assinaturas` e
`trilhas` seguem o fluxo rota → service → repository e não criam tabelas durante
a inicialização.

## Executar

1. Copie `.env.example` para `.env` e configure `DATABASE_URL`. Não versione o
   arquivo `.env`.
2. Instale as dependências com `npm install`.
3. Com o schema compartilhado e o de vídeos já aplicados, execute
   `npm run migrate`.
4. Inicie com `npm start` (ou `npm run dev` durante o desenvolvimento).
5. Rode os testes unitários com `npm test`.

O servidor inicia sem integração de autenticação, mas endpoints privados
respondem `503 AUTHENTICATION_NOT_CONFIGURED`. Ao integrar a autenticação
compartilhada, passe-a para `createApp({ pool, authenticateUser })`; ela deve
validar uma sessão/token e definir `request.auth.usuarioId` com o UUID
verificado. Nunca derive o atleta de um ID enviado pelo frontend. As chaves
estrangeiras das entidades verificam que esse usuário possui perfil de atleta.

## Dependências de schema compartilhado

Este módulo **não cria** identidade, atletas, categorias ou vídeos. Para aplicar
as migrations, os módulos compartilhados devem fornecer:

- `atletas(usuario_id UUID PRIMARY KEY REFERENCES usuarios(id))`;
- `categorias(id UUID PRIMARY KEY, nome TEXT/VARCHAR UNIQUE)`;
- `videos(id UUID PRIMARY KEY)`.

As migrations `002_assinaturas.sql` e `003_trilhas.sql` verificam esses
pré-requisitos e falham explicitamente se estiverem ausentes. Integre-as na
sequência única da equipe, após as migrations compartilhadas correspondentes.
`001_planos.sql` não depende dessas tabelas. `wellflix_schema_migrations` é o
registro central do executor para todas as migrations do backend; módulos
futuros devem adicionar seus arquivos ao mesmo diretório e usar o mesmo
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

Exemplos:

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

O checkout e as trilhas em `frontend/src` ainda usam dados de demonstração; o
login atual não emite sessão autenticada e os vídeos de demonstração não têm
UUIDs do catálogo. Para manter essas telas funcionais e evitar enviar dados de
cartão ou IDs não verificados, a API disponibiliza contratos prontos, mas a
conexão ponta a ponta deve ser ligada quando os módulos compartilhados de
autenticação, categorias e catálogo de vídeos forem integrados.
