-- Dados fictícios de demonstração do serviço de catalogo.
-- Execute somente em banco de desenvolvimento/demonstração:
--   python -m backend.services.shared.migrate catalogo --seed-demo --confirm-demo-database
-- Ids de outros serviços (usuários, categorias, vídeos) são fixos e iguais aos dos seeds desses serviços.

INSERT INTO videos (id, profissional_id, titulo, descricao, duracao_segundos, url_conteudo, situacao, data_publicacao)
VALUES
    ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'Hipertrofia inteligente: peito e tríceps', 'Treino demonstrativo para testar catálogo, busca e avaliações.', 1920, 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'publicado', now() - interval '6 days'),
    ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'Yoga para mobilidade do quadril', 'Sequência demonstrativa de mobilidade.', 1440, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'publicado', now() - interval '5 days'),
    ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Controle de bola para armadores', 'Fundamentos demonstrativos de basquete.', 1080, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'publicado', now() - interval '4 days'),
    ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'Sono: o treino invisível', 'Conteúdo demonstrativo sobre descanso e recuperação.', 840, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'publicado', now() - interval '3 days'),
    ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', 'Proteína sem complicação', 'Introdução demonstrativa à nutrição esportiva.', 1200, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'publicado', now() - interval '2 days'),
    ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'Prevenção de lesões no joelho', 'Envio demonstrativo que aguarda revisão do moderador.', 1620, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'Aquecimento para corrida sem impacto', 'Vídeo fictício para testar a fila de aprovação.', 720, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', 'Mobilidade de tornozelo para atletas', 'Vídeo fictício para testar a fila de aprovação.', 900, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'Fortalecimento do joelho em casa', 'Vídeo fictício para testar a fila de aprovação.', 1080, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000002', 'Alongamento depois do treino', 'Vídeo fictício para testar a fila de aprovação.', 840, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', 'Como aterrissar com segurança no basquete', 'Vídeo fictício para testar a fila de aprovação.', 1260, 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000003', 'Agachamento: técnica e controle', 'Vídeo fictício para testar a fila de aprovação.', 960, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000003', 'Treino de força para iniciantes', 'Vídeo fictício para testar a fila de aprovação.', 1500, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000003', 'Mobilidade de ombros antes da musculação', 'Vídeo fictício para testar a fila de aprovação.', 780, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000003', 'Yoga para recuperação muscular', 'Vídeo fictício para testar a fila de aprovação.', 1320, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000003', 'Prancha e estabilidade do tronco', 'Vídeo fictício para testar a fila de aprovação.', 660, 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000004', 'Lanche pré-treino rápido', 'Vídeo fictício para testar a fila de aprovação.', 600, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000004', 'Hidratação durante exercícios', 'Vídeo fictício para testar a fila de aprovação.', 720, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000004', 'Jantar simples para recuperação', 'Vídeo fictício para testar a fila de aprovação.', 1140, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000004', 'Sono e recuperação depois do treino', 'Vídeo fictício para testar a fila de aprovação.', 1020, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'aguardando_revisao', NULL),
    ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000004', 'Montando um prato equilibrado', 'Vídeo fictício para testar a fila de aprovação.', 900, 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'aguardando_revisao', NULL)
ON CONFLICT (id) DO UPDATE SET
    profissional_id = EXCLUDED.profissional_id,
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    duracao_segundos = EXCLUDED.duracao_segundos,
    url_conteudo = EXCLUDED.url_conteudo,
    situacao = EXCLUDED.situacao,
    data_publicacao = EXCLUDED.data_publicacao,
    data_atualizacao = now();

INSERT INTO categorias_video (video_id, categoria_id)
SELECT seed.video_id, c.id
FROM (VALUES
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Musculação'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Yoga'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Basquete'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'Recuperação'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Nutrição'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Lesões'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'Basquete'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'Lesões'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Lesões'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Basquete'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Basquete'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'Musculação'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'Musculação'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'Musculação'),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'Yoga'),
    ('20000000-0000-4000-8000-000000000016'::uuid, 'Yoga'),
    ('20000000-0000-4000-8000-000000000017'::uuid, 'Nutrição'),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'Nutrição'),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'Nutrição'),
    ('20000000-0000-4000-8000-000000000020'::uuid, 'Recuperação'),
    ('20000000-0000-4000-8000-000000000021'::uuid, 'Recuperação')
) AS seed(video_id, categoria_nome)
JOIN categorias c ON c.nome = seed.categoria_nome
ON CONFLICT DO NOTHING;

INSERT INTO comentarios (id, video_id, usuario_id, conteudo)
VALUES
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Conteúdo demonstrativo: consegui acompanhar o treino!'),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Bom exemplo para testar comentários no vídeo.')
ON CONFLICT (id) DO UPDATE SET conteudo = EXCLUDED.conteudo;

INSERT INTO avaliacoes (video_id, usuario_id, gostou)
VALUES
    ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', TRUE),
    ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', TRUE),
    ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', FALSE),
    ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', TRUE)
ON CONFLICT (video_id, usuario_id) DO UPDATE SET
    gostou = EXCLUDED.gostou,
    data_atualizacao = now();
