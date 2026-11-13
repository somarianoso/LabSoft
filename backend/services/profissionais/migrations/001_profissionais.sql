-- Serviço de profissionais e moderação (schema "profissionais").
-- Dono dos perfis profissionais, das categorias autorizadas, dos seguidores
-- e do histórico de revisões feitas pelos moderadores.
--
-- Referências lógicas para outros serviços (UUID sem FK):
--   profissionais.usuario_id            -> identidade.usuarios.id
--   categorias_profissional.categoria_id -> catalogo.categorias.id
--   seguimentos_profissional.seguidor_id -> identidade.usuarios.id
--   revisoes_video.video_id              -> catalogo.videos.id
--   revisoes_video.moderador_id          -> identidade.moderadores.usuario_id

CREATE TABLE profissionais (
    usuario_id UUID PRIMARY KEY,
    especialidade VARCHAR(150),
    biografia TEXT,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categorias_profissional (
    profissional_id UUID NOT NULL
        REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL,
    PRIMARY KEY (profissional_id, categoria_id)
);

CREATE INDEX categorias_profissional_categoria_idx
    ON categorias_profissional (categoria_id);

CREATE TABLE seguimentos_profissional (
    profissional_id UUID NOT NULL
        REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    seguidor_id UUID NOT NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (profissional_id, seguidor_id),
    CHECK (profissional_id <> seguidor_id)
);

CREATE INDEX seguimentos_profissional_seguidor_idx
    ON seguimentos_profissional (seguidor_id);

CREATE TABLE revisoes_video (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL,
    moderador_id UUID NOT NULL,
    situacao VARCHAR(24) NOT NULL
        CHECK (situacao IN ('aprovado', 'rejeitado')),
    observacao TEXT,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX revisoes_video_video_idx
    ON revisoes_video (video_id, data_criacao DESC);
