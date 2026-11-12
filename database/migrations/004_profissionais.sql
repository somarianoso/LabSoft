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
    IF to_regclass('public.videos') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration de vídeos deve criar public.videos(id UUID PRIMARY KEY).';
    END IF;
END;
$migration$;

CREATE TABLE profissionais (
    usuario_id UUID PRIMARY KEY
        REFERENCES usuarios(id) ON DELETE CASCADE,
    especialidade VARCHAR(150),
    biografia TEXT,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categorias_profissional (
    profissional_id UUID NOT NULL
        REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL
        REFERENCES categorias(id) ON DELETE RESTRICT,
    PRIMARY KEY (profissional_id, categoria_id)
);

CREATE INDEX categorias_profissional_categoria_idx
    ON categorias_profissional (categoria_id);

CREATE TABLE profissional_videos (
    profissional_id UUID NOT NULL
        REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    video_id UUID NOT NULL
        REFERENCES videos(id) ON DELETE CASCADE,
    PRIMARY KEY (profissional_id, video_id)
);

CREATE INDEX profissional_videos_video_idx
    ON profissional_videos (video_id);

CREATE TABLE seguimentos_profissional (
    profissional_id UUID NOT NULL
        REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    seguidor_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (profissional_id, seguidor_id),
    CHECK (profissional_id <> seguidor_id)
);

CREATE INDEX seguimentos_profissional_seguidor_idx
    ON seguimentos_profissional (seguidor_id);
