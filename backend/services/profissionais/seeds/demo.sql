-- Dados fictícios de demonstração do serviço de profissionais.
-- Execute somente em banco de desenvolvimento/demonstração:
--   python -m backend.services.shared.migrate profissionais --seed-demo --confirm-demo-database
-- Ids de outros serviços (usuários, categorias, vídeos) são fixos e iguais aos dos seeds desses serviços.

INSERT INTO profissionais (usuario_id, especialidade, biografia)
VALUES
    ('10000000-0000-4000-8000-000000000002', 'Fisioterapia esportiva', 'Conteúdo demonstrativo sobre prevenção de lesões e basquete.'),
    ('10000000-0000-4000-8000-000000000003', 'Força e condicionamento', 'Conteúdo demonstrativo sobre musculação e mobilidade.'),
    ('10000000-0000-4000-8000-000000000004', 'Nutrição esportiva', 'Conteúdo demonstrativo sobre alimentação e recuperação.')
ON CONFLICT (usuario_id) DO UPDATE SET
    especialidade = EXCLUDED.especialidade,
    biografia = EXCLUDED.biografia,
    data_atualizacao = now();

INSERT INTO categorias_profissional (profissional_id, categoria_id)
VALUES
    ('10000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000003'),
    ('10000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000006')
ON CONFLICT DO NOTHING;

INSERT INTO categorias_profissional (profissional_id, categoria_id)
VALUES
    ('10000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001'),
    ('10000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO categorias_profissional (profissional_id, categoria_id)
VALUES
    ('10000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000004'),
    ('10000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000005')
ON CONFLICT DO NOTHING;

INSERT INTO seguimentos_profissional (profissional_id, seguidor_id)
VALUES
    ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001'),
    ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001')
ON CONFLICT DO NOTHING;
