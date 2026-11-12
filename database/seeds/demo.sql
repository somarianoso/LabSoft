-- Dados fictícios e repetíveis para demonstração/desenvolvimento.
-- Execute somente em um banco de desenvolvimento ou de demonstração.
BEGIN;

INSERT INTO usuarios (id, nome_completo, email, cpf, hash_senha)
VALUES
    ('10000000-0000-4000-8000-000000000001', 'Ana Atleta Demo', 'atleta.demo@wellflix.test', '00000000001', 'scrypt$32768$8$1$W20T-ULWd-iEZoQ7U_zGew==$U5DYsiuSY9KufDE9LgoGq1Hq_okgRoHTH-I6edCJJ6dNH-otUXzKhFqw3CmL4G6-qQTj9ki8Ddz47N5BSpRbsg=='),
    ('10000000-0000-4000-8000-000000000002', 'Lara Nunes Demo', 'lara.demo@wellflix.test', '00000000002', 'scrypt$32768$8$1$Nn9paHIh_OF-SMNMBsLq-w==$P6M6fkgo-NdghNncpKZZlWh4iHEcVVOgmrl83IldDtNR8spTBHx7ZelNM6NoFPAbjNf5A-REWu1qsYTKs4TdlQ=='),
    ('10000000-0000-4000-8000-000000000003', 'Caio Mendes Demo', 'caio.demo@wellflix.test', '00000000003', 'scrypt$32768$8$1$mYlhaWUG-cGvEx7LqTXEbg==$IsLlsJhcbGJC9-SRDNqtG-vzDjsKUZN-mDD0_GnBokNZLRPx3qlrGAhqZ7zVi9fJq7nCqjqP5yogRg2U5kyoBQ=='),
    ('10000000-0000-4000-8000-000000000004', 'Marina Lopes Demo', 'marina.demo@wellflix.test', '00000000004', 'scrypt$32768$8$1$w8KyXjgfr2-DKV_GOBlO5Q==$0_nOUt6GR9j0mYatGpov3j2hSrDEWSTsqZvp5VHqXKNxB5d1L6YuOIeFIrp1rdbsg9J9InJAk5hNGqpM-YJNEg=='),
    ('10000000-0000-4000-8000-000000000005', 'Moderador Demo', 'moderador.demo@wellflix.test', '00000000005', 'scrypt$32768$8$1$W20T-ULWd-iEZoQ7U_zGew==$U5DYsiuSY9KufDE9LgoGq1Hq_okgRoHTH-I6edCJJ6dNH-otUXzKhFqw3CmL4G6-qQTj9ki8Ddz47N5BSpRbsg=='),
    ('10000000-0000-4000-8000-000000000006', 'Beatriz Teste Demo', 'beatriz.demo@wellflix.test', '00000000006', 'scrypt$32768$8$1$W20T-ULWd-iEZoQ7U_zGew==$U5DYsiuSY9KufDE9LgoGq1Hq_okgRoHTH-I6edCJJ6dNH-otUXzKhFqw3CmL4G6-qQTj9ki8Ddz47N5BSpRbsg=='),
    ('10000000-0000-4000-8000-000000000007', 'Rafael Teste Demo', 'rafael.demo@wellflix.test', '00000000007', 'scrypt$32768$8$1$W20T-ULWd-iEZoQ7U_zGew==$U5DYsiuSY9KufDE9LgoGq1Hq_okgRoHTH-I6edCJJ6dNH-otUXzKhFqw3CmL4G6-qQTj9ki8Ddz47N5BSpRbsg=='),
    ('10000000-0000-4000-8000-000000000008', 'Camila Teste Demo', 'camila.demo@wellflix.test', '00000000008', 'scrypt$32768$8$1$W20T-ULWd-iEZoQ7U_zGew==$U5DYsiuSY9KufDE9LgoGq1Hq_okgRoHTH-I6edCJJ6dNH-otUXzKhFqw3CmL4G6-qQTj9ki8Ddz47N5BSpRbsg==')
ON CONFLICT (id) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    email = EXCLUDED.email,
    cpf = EXCLUDED.cpf,
    hash_senha = EXCLUDED.hash_senha,
    data_atualizacao = now();

INSERT INTO papeis_usuario (usuario_id, papel)
VALUES
    ('10000000-0000-4000-8000-000000000001', 'atleta'),
    ('10000000-0000-4000-8000-000000000002', 'profissional'),
    ('10000000-0000-4000-8000-000000000003', 'profissional'),
    ('10000000-0000-4000-8000-000000000004', 'profissional'),
    ('10000000-0000-4000-8000-000000000005', 'moderador'),
    ('10000000-0000-4000-8000-000000000006', 'atleta'),
    ('10000000-0000-4000-8000-000000000007', 'atleta'),
    ('10000000-0000-4000-8000-000000000008', 'atleta')
ON CONFLICT DO NOTHING;

INSERT INTO atletas (usuario_id)
VALUES
    ('10000000-0000-4000-8000-000000000001'),
    ('10000000-0000-4000-8000-000000000006'),
    ('10000000-0000-4000-8000-000000000007'),
    ('10000000-0000-4000-8000-000000000008')
ON CONFLICT DO NOTHING;

INSERT INTO profissionais (usuario_id, especialidade, biografia)
VALUES
    ('10000000-0000-4000-8000-000000000002', 'Fisioterapia esportiva', 'Conteúdo demonstrativo sobre prevenção de lesões e basquete.'),
    ('10000000-0000-4000-8000-000000000003', 'Força e condicionamento', 'Conteúdo demonstrativo sobre musculação e mobilidade.'),
    ('10000000-0000-4000-8000-000000000004', 'Nutrição esportiva', 'Conteúdo demonstrativo sobre alimentação e recuperação.')
ON CONFLICT (usuario_id) DO UPDATE SET
    especialidade = EXCLUDED.especialidade,
    biografia = EXCLUDED.biografia,
    data_atualizacao = now();

INSERT INTO moderadores (usuario_id)
VALUES ('10000000-0000-4000-8000-000000000005')
ON CONFLICT DO NOTHING;

INSERT INTO categorias_profissional (profissional_id, categoria_id)
SELECT '10000000-0000-4000-8000-000000000002', id FROM categorias WHERE nome IN ('Basquete', 'Lesões')
ON CONFLICT DO NOTHING;
INSERT INTO categorias_profissional (profissional_id, categoria_id)
SELECT '10000000-0000-4000-8000-000000000003', id FROM categorias WHERE nome IN ('Musculação', 'Yoga')
ON CONFLICT DO NOTHING;
INSERT INTO categorias_profissional (profissional_id, categoria_id)
SELECT '10000000-0000-4000-8000-000000000004', id FROM categorias WHERE nome IN ('Nutrição', 'Recuperação')
ON CONFLICT DO NOTHING;

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

INSERT INTO seguimentos_profissional (profissional_id, seguidor_id)
VALUES
    ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001'),
    ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001')
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

INSERT INTO categorias_assinatura (assinatura_id, categoria_id)
SELECT '40000000-0000-4000-8000-000000000001', id
FROM categorias
WHERE nome IN ('Musculação', 'Yoga', 'Basquete', 'Nutrição', 'Recuperação', 'Lesões')
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

COMMIT;
