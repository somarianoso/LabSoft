DO $migration$
BEGIN
    IF to_regclass('public.atletas') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration compartilhada deve criar public.atletas(usuario_id UUID PRIMARY KEY).';
    END IF;
    IF to_regclass('public.categorias') IS NULL THEN
        RAISE EXCEPTION
            'Pré-requisito ausente: a migration compartilhada deve criar public.categorias(id UUID PRIMARY KEY, nome).';
    END IF;
END;
$migration$;

CREATE TABLE assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atleta_id UUID NOT NULL
        REFERENCES atletas(usuario_id) ON DELETE CASCADE,
    plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
    metodo_pagamento VARCHAR(20) NOT NULL
        CHECK (metodo_pagamento IN ('cartao', 'pix', 'boleto')),
    situacao VARCHAR(24) NOT NULL DEFAULT 'pendente_pagamento'
        CHECK (situacao IN (
            'pendente_pagamento', 'ativa', 'cancelada',
            'expirada', 'pagamento_recusado'
        )),
    referencia_pagamento VARCHAR(200),
    data_inicio TIMESTAMPTZ,
    data_vencimento TIMESTAMPTZ,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (data_vencimento IS NULL OR data_inicio IS NULL OR data_vencimento >= data_inicio)
);

CREATE INDEX assinaturas_atleta_situacao_idx
    ON assinaturas (atleta_id, situacao, data_criacao DESC);
CREATE UNIQUE INDEX assinaturas_uma_ativa_por_atleta_idx
    ON assinaturas (atleta_id)
    WHERE situacao = 'ativa';

CREATE TABLE categorias_assinatura (
    assinatura_id UUID NOT NULL
        REFERENCES assinaturas(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL
        REFERENCES categorias(id) ON DELETE RESTRICT,
    PRIMARY KEY (assinatura_id, categoria_id)
);

CREATE INDEX categorias_assinatura_categoria_idx
    ON categorias_assinatura (categoria_id);
