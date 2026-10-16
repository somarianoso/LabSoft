DO $migration$
BEGIN
    IF to_regclass('public.usuarios') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration compartilhada deve criar public.usuarios(id UUID PRIMARY KEY).';
    END IF;
    IF to_regclass('public.categorias') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration compartilhada deve criar public.categorias(id UUID PRIMARY KEY).';
    END IF;
END;
$migration$;

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE RESTRICT,
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

CREATE TABLE revisoes_video (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL
        REFERENCES videos(id) ON DELETE CASCADE,
    moderador_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    situacao VARCHAR(24) NOT NULL
        CHECK (situacao IN ('aprovado', 'rejeitado')),
    observacao TEXT,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX revisoes_video_video_idx
    ON revisoes_video (video_id, data_criacao DESC);
