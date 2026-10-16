CREATE TABLE atletas (
    usuario_id UUID PRIMARY KEY
        REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
