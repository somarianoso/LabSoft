-- Serviço de catálogo (schema "catalogo").
-- Dono das categorias, dos vídeos e das interações (comentários e avaliações).
--
-- Referências lógicas para outros serviços (UUID sem FK):
--   videos.profissional_id      -> identidade.usuarios.id / profissionais.profissionais.usuario_id
--   comentarios.usuario_id      -> identidade.usuarios.id
--   avaliacoes.usuario_id       -> identidade.usuarios.id
-- A validade desses ids é garantida pela aplicação (token JWT e API de profissionais).

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE
        CHECK (length(btrim(nome)) > 0),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID NOT NULL,
    titulo VARCHAR(200) NOT NULL
        CHECK (length(btrim(titulo)) > 0),
    descricao TEXT,
    duracao_segundos INTEGER NOT NULL CHECK (duracao_segundos > 0),
    url_conteudo TEXT NOT NULL
        CHECK (length(btrim(url_conteudo)) > 0),
    situacao VARCHAR(24) NOT NULL DEFAULT 'rascunho'
        CHECK (situacao IN ('rascunho', 'aguardando_revisao', 'publicado', 'rejeitado', 'arquivado')),
    data_publicacao TIMESTAMPTZ,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX videos_profissional_data_idx
    ON videos (profissional_id, data_criacao DESC);
CREATE INDEX videos_situacao_data_idx
    ON videos (situacao, data_publicacao DESC NULLS LAST);

CREATE TABLE categorias_video (
    video_id UUID NOT NULL
        REFERENCES videos(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL
        REFERENCES categorias(id) ON DELETE RESTRICT,
    PRIMARY KEY (video_id, categoria_id)
);

CREATE INDEX categorias_video_categoria_idx
    ON categorias_video (categoria_id);

CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    conteudo TEXT NOT NULL CHECK (length(btrim(conteudo)) > 0),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX comentarios_video_data_idx
    ON comentarios (video_id, data_criacao DESC);
CREATE INDEX comentarios_usuario_idx ON comentarios (usuario_id);

CREATE TABLE avaliacoes (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    gostou BOOLEAN NOT NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (video_id, usuario_id)
);

CREATE INDEX avaliacoes_video_gostou_idx
    ON avaliacoes (video_id, gostou);
