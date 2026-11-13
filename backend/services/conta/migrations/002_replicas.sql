-- Réplicas locais do serviço de conta (atualizadas pelo consumidor Kafka).
-- O serviço de conta não publica eventos: só consome.
--
--   usuarios_replica    <- wellflix.identidade.usuarios   (nome do criador de trilhas públicas)
--   categorias_replica  <- wellflix.catalogo.categorias   (validar categorias da assinatura)
--   videos_replica      <- wellflix.catalogo.videos       (só vídeos publicados entram em trilhas)

CREATE TABLE usuarios_replica (
    id UUID PRIMARY KEY,
    nome_completo VARCHAR(120) NOT NULL,
    papeis TEXT[] NOT NULL DEFAULT '{}',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX usuarios_replica_nome_idx ON usuarios_replica (lower(nome_completo));

CREATE TABLE categorias_replica (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE videos_replica (
    id UUID PRIMARY KEY,
    profissional_id UUID NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    situacao VARCHAR(24) NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
