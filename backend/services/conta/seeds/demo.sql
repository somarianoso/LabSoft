-- Dados fictícios de demonstração do serviço de conta.
-- Execute somente em banco de desenvolvimento/demonstração:
--   python -m backend.services.shared.migrate conta --seed-demo --confirm-demo-database
-- Ids de outros serviços (usuários, categorias, vídeos) são fixos e iguais aos dos seeds desses serviços.

INSERT INTO assinaturas (id, atleta_id, plano_id, metodo_pagamento, situacao)
SELECT
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    id,
    'pix',
    'pendente_pagamento'
FROM planos WHERE codigo = 'pro'
ON CONFLICT (id) DO UPDATE SET
    atleta_id = EXCLUDED.atleta_id,
    plano_id = EXCLUDED.plano_id,
    metodo_pagamento = EXCLUDED.metodo_pagamento,
    situacao = EXCLUDED.situacao,
    data_atualizacao = now();

INSERT INTO categorias_assinatura (assinatura_id, categoria_id, categoria_nome)
VALUES
    ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'Musculação'),
    ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', 'Yoga'),
    ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000003', 'Basquete'),
    ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000004', 'Nutrição'),
    ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000005', 'Recuperação'),
    ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000006', 'Lesões')
ON CONFLICT DO NOTHING;

INSERT INTO trilhas (id, atleta_id, nome, privacidade)
VALUES ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Minha trilha de demonstração', 'privada')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, privacidade = EXCLUDED.privacidade, data_atualizacao = now();

INSERT INTO videos_trilha (trilha_id, video_id, ordem)
VALUES
    ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1),
    ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 2)
ON CONFLICT DO NOTHING;

INSERT INTO progresso_trilha (trilha_id, video_id, segundos_assistidos, concluido)
VALUES ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 650, FALSE)
ON CONFLICT (trilha_id, video_id) DO UPDATE SET
    segundos_assistidos = EXCLUDED.segundos_assistidos,
    concluido = EXCLUDED.concluido,
    data_atualizacao = now();
