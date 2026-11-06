# Diagrama entidade-relacionamento

Este diagrama representa as tabelas e chaves estrangeiras criadas pelas migrations em `backend/src/db/migrations`. Os atributos marcados como `PK` são chaves primárias; `FK` identifica chaves estrangeiras. Nas tabelas associativas, a chave primária é composta pelas colunas marcadas.

## Como ler as ligações

Cada extremidade de uma ligação mostra quantas ocorrências daquela entidade podem estar relacionadas a uma ocorrência da entidade oposta:

| Símbolo | Significado |
| --- | --- |
| `o` | Participação opcional: zero ocorrências. |
| `|` | Uma ocorrência. |
| `{` | Muitas ocorrências. |
| `--` | Linha que conecta as entidades; o texto após ela nomeia a relação. |

Os símbolos nas extremidades são combinados:

| Combinação | Significado |
| --- | --- |
| `o|` | Zero ou uma (opcional, no máximo uma). |
| `||` | Exatamente uma (obrigatória). |
| `o{` | Zero ou muitas (opcional, pode haver várias). |
| `|{` | Uma ou muitas (obrigatória, pode haver várias). |

Por exemplo, `USUARIOS ||--o{ COMENTARIOS` indica que cada comentário pertence a exatamente um usuário, enquanto um usuário pode ter zero ou muitos comentários. Em `USUARIOS o|--o{ REVISOES_VIDEO`, uma revisão pode ter zero ou um usuário associado como moderador, e um usuário pode estar associado a zero ou muitas revisões.

```mermaid
erDiagram
	direction LR
	USUARIOS {
		UUID id PK ""  
		VARCHAR nome_completo  ""  
		VARCHAR email  ""  
		CHAR cpf  ""  
		TEXT hash_senha  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	PAPEIS_USUARIO {
		UUID usuario_id PK,FK ""  
		VARCHAR papel PK ""  
		TIMESTAMPTZ data_criacao  ""  
	}

	ATLETAS {
		UUID usuario_id PK,FK ""  
		TIMESTAMPTZ data_criacao  ""  
	}

	PROFISSIONAIS {
		UUID usuario_id PK,FK ""  
		VARCHAR especialidade  ""  
		TEXT biografia  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	MODERADORES {
		UUID usuario_id PK,FK ""  
		TIMESTAMPTZ data_criacao  ""  
	}

	PLANOS {
		UUID id PK ""  
		VARCHAR codigo  ""  
		VARCHAR nome  ""  
		TEXT descricao  ""  
		INTEGER preco_mensal_centavos  ""  
		INTEGER limite_categorias  ""  
		BOOLEAN ativo  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	ASSINATURAS {
		UUID id PK ""  
		UUID atleta_id FK ""  
		UUID plano_id FK ""  
		VARCHAR metodo_pagamento  ""  
		VARCHAR situacao  ""  
		VARCHAR referencia_pagamento  ""  
		TIMESTAMPTZ data_inicio  ""  
		TIMESTAMPTZ data_vencimento  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	CATEGORIAS_ASSINATURA {
		UUID assinatura_id PK,FK ""  
		UUID categoria_id PK,FK ""  
	}

	CATEGORIAS {
		UUID id PK ""  
		VARCHAR nome  ""  
		TIMESTAMPTZ data_criacao  ""  
	}

	CATEGORIAS_PROFISSIONAL {
		UUID profissional_id PK,FK ""  
		UUID categoria_id PK,FK ""  
	}

	CATEGORIAS_VIDEO {
		UUID video_id PK,FK ""  
		UUID categoria_id PK,FK ""  
	}

	VIDEOS {
		UUID id PK ""  
		UUID profissional_id FK ""  
		VARCHAR titulo  ""  
		TEXT descricao  ""  
		INTEGER duracao_segundos  ""  
		TEXT url_conteudo  ""  
		VARCHAR situacao  ""  
		TIMESTAMPTZ data_publicacao  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	REVISOES_VIDEO {
		UUID id PK ""  
		UUID video_id FK ""  
		UUID moderador_id FK ""  
		VARCHAR situacao  ""  
		TEXT observacao  ""  
		TIMESTAMPTZ data_criacao  ""  
	}

	PROFISSIONAL_VIDEOS {
		UUID profissional_id PK,FK ""  
		UUID video_id PK,FK ""  
	}

	TRILHAS {
		UUID id PK ""  
		UUID atleta_id FK ""  
		VARCHAR nome  ""  
		VARCHAR privacidade  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	VIDEOS_TRILHA {
		UUID trilha_id PK,FK ""  
		UUID video_id PK,FK ""  
		INTEGER ordem  ""  
	}

	PROGRESSO_TRILHA {
		UUID trilha_id PK,FK ""  
		UUID video_id PK,FK ""  
		INTEGER segundos_assistidos  ""  
		BOOLEAN concluido  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	SEGUIMENTOS_PROFISSIONAL {
		UUID profissional_id PK,FK ""  
		UUID seguidor_id PK,FK ""  
		TIMESTAMPTZ data_criacao  ""  
	}

	COMENTARIOS {
		UUID id PK ""  
		UUID video_id FK ""  
		UUID usuario_id FK ""  
		TEXT conteudo  ""  
		TIMESTAMPTZ data_criacao  ""  
	}

	AVALIACOES {
		UUID video_id PK,FK ""  
		UUID usuario_id PK,FK ""  
		BOOLEAN gostou  ""  
		TIMESTAMPTZ data_criacao  ""  
		TIMESTAMPTZ data_atualizacao  ""  
	}

	USUARIOS||--o{PAPEIS_USUARIO:"possui"
	USUARIOS||--o|ATLETAS:"perfil"
	USUARIOS||--o|PROFISSIONAIS:"perfil"
	USUARIOS||--o|MODERADORES:"perfil"
	ATLETAS||--o{ASSINATURAS:"realiza"
	PLANOS||--o{ASSINATURAS:"contratado_em"
	ASSINATURAS||--o{CATEGORIAS_ASSINATURA:"seleciona"
	CATEGORIAS||--o{CATEGORIAS_ASSINATURA:"incluida_em"
	PROFISSIONAIS||--o{CATEGORIAS_PROFISSIONAL:"possui"
	CATEGORIAS||--o{CATEGORIAS_PROFISSIONAL:"associada_a"
	VIDEOS||--o{CATEGORIAS_VIDEO:"classificado_em"
	CATEGORIAS||--o{CATEGORIAS_VIDEO:"classifica"
	PROFISSIONAIS||--o{VIDEOS:"publica"
	VIDEOS||--o{REVISOES_VIDEO:"recebe"
	MODERADORES|o--o{REVISOES_VIDEO:"revisa"
	PROFISSIONAIS||--o{PROFISSIONAL_VIDEOS:"associado_a"
	VIDEOS||--o{PROFISSIONAL_VIDEOS:"associado_a"
	ATLETAS||--o{TRILHAS:"cria"
	TRILHAS||--o{VIDEOS_TRILHA:"organiza"
	VIDEOS||--o{VIDEOS_TRILHA:"incluida_em"
	VIDEOS_TRILHA||--o|PROGRESSO_TRILHA:"registra"
	PROFISSIONAIS||--o{SEGUIMENTOS_PROFISSIONAL:"seguido"
	USUARIOS||--o{SEGUIMENTOS_PROFISSIONAL:"segue"
	VIDEOS||--o{COMENTARIOS:"recebe"
	USUARIOS||--o{COMENTARIOS:"escreve"
	VIDEOS||--o{AVALIACOES:"recebe"
	USUARIOS||--o{AVALIACOES:"avalia"
```

**Observações**

- `videos.profissional_id` referencia `usuarios.id` diretamente. `profissional_videos` também relaciona `profissionais` e `videos` por uma tabela associativa; o diagrama mantém ambas as relações, conforme as FKs implementadas, sem presumir que sejam uma única relação.
- `revisoes_video.moderador_id` referencia `usuarios.id` e é anulável; a FK não exige que exista um registro correspondente em `moderadores`.
- `progresso_trilha` referencia a chave composta `(trilha_id, video_id)` de `videos_trilha`.
- `wellflix_schema_migrations`, criada pelo executor de migrations, foi omitida por ser uma tabela técnica de controle, não uma entidade do domínio.
