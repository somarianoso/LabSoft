CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL CHECK (length(btrim(conteudo)) > 0),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX comentarios_video_data_idx
    ON comentarios (video_id, data_criacao DESC);

CREATE TABLE avaliacoes (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    gostou BOOLEAN NOT NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (video_id, usuario_id)
);

CREATE INDEX avaliacoes_video_gostou_idx
    ON avaliacoes (video_id, gostou);
