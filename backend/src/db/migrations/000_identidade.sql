CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(120) NOT NULL
        CHECK (length(btrim(nome_completo)) > 0),
    email VARCHAR(254) NOT NULL,
    cpf CHAR(11) NOT NULL
        CHECK (cpf ~ '^[0-9]{11}$'),
    hash_senha TEXT NOT NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX usuarios_email_normalizado_idx
    ON usuarios (lower(email));
CREATE UNIQUE INDEX usuarios_cpf_idx ON usuarios (cpf);

CREATE TABLE papeis_usuario (
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    papel VARCHAR(20) NOT NULL
        CHECK (papel IN ('atleta', 'profissional', 'moderador')),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, papel)
);

CREATE INDEX papeis_usuario_papel_idx ON papeis_usuario (papel);

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE
        CHECK (length(btrim(nome)) > 0),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
