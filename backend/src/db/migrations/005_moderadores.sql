DO $migration$
BEGIN
    IF to_regclass('public.usuarios') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration compartilhada deve criar public.usuarios(id UUID PRIMARY KEY).';
    END IF;
END;
$migration$;

CREATE TABLE moderadores (
    usuario_id UUID PRIMARY KEY
        REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
