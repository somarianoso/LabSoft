DO $migration$
BEGIN
    IF to_regclass('public.atletas') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration compartilhada deve criar public.atletas(usuario_id UUID PRIMARY KEY).';
    END IF;
    IF to_regclass('public.videos') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration de vídeos deve criar public.videos(id UUID PRIMARY KEY).';
    END IF;
END;
$migration$;

CREATE TABLE trilhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atleta_id UUID NOT NULL
        REFERENCES atletas(usuario_id) ON DELETE CASCADE,
    nome VARCHAR(120) NOT NULL CHECK (length(btrim(nome)) > 0),
    privacidade VARCHAR(10) NOT NULL DEFAULT 'privada'
        CHECK (privacidade IN ('privada', 'publica')),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trilhas_atleta_atualizacao_idx
    ON trilhas (atleta_id, data_atualizacao DESC);
CREATE INDEX trilhas_publicas_idx
    ON trilhas (data_criacao DESC)
    WHERE privacidade = 'publica';

CREATE TABLE videos_trilha (
    trilha_id UUID NOT NULL
        REFERENCES trilhas(id) ON DELETE CASCADE,
    video_id UUID NOT NULL
        REFERENCES videos(id) ON DELETE RESTRICT,
    ordem INTEGER NOT NULL CHECK (ordem > 0),
    PRIMARY KEY (trilha_id, video_id),
    UNIQUE (trilha_id, ordem)
);

CREATE INDEX videos_trilha_video_idx ON videos_trilha (video_id);

CREATE TABLE progresso_trilha (
    trilha_id UUID NOT NULL,
    video_id UUID NOT NULL,
    segundos_assistidos INTEGER NOT NULL DEFAULT 0
        CHECK (segundos_assistidos >= 0),
    concluido BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (trilha_id, video_id),
    FOREIGN KEY (trilha_id, video_id)
        REFERENCES videos_trilha(trilha_id, video_id) ON DELETE CASCADE
);
