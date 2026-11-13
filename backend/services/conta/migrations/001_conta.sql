-- Serviço de conta (schema "conta").
-- Dono dos planos, assinaturas, trilhas e progresso.
--
-- Referências lógicas para outros serviços (UUID sem FK):
--   assinaturas.atleta_id               -> identidade.atletas.usuario_id
--   categorias_assinatura.categoria_id  -> catalogo.categorias.id
--   trilhas.atleta_id                   -> identidade.atletas.usuario_id
--   videos_trilha.video_id              -> catalogo.videos.id
-- categorias_assinatura.categoria_nome é uma cópia do nome no momento da
-- contratação, para o histórico não depender do serviço de catálogo.

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

CREATE TABLE assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atleta_id UUID NOT NULL,
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
    categoria_id UUID NOT NULL,
    categoria_nome VARCHAR(100) NOT NULL,
    PRIMARY KEY (assinatura_id, categoria_id)
);

CREATE INDEX categorias_assinatura_categoria_idx
    ON categorias_assinatura (categoria_id);

CREATE TABLE trilhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atleta_id UUID NOT NULL,
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
    video_id UUID NOT NULL,
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
