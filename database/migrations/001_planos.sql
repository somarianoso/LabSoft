CREATE TABLE planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    preco_mensal_centavos INTEGER NOT NULL CHECK (preco_mensal_centavos > 0),
    limite_categorias INTEGER CHECK (limite_categorias IS NULL OR limite_categorias > 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO planos
    (codigo, nome, descricao, preco_mensal_centavos, limite_categorias)
VALUES
    ('basico', 'Básico', 'Comece com o essencial', 2900, 2),
    ('pro', 'Pro', 'Para quem treina sério', 5900, 6),
    ('premium', 'Premium', 'Performance sem limites', 8900, NULL);
