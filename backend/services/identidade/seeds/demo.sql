-- Dados fictícios de demonstração do serviço de identidade.
-- Execute somente em banco de desenvolvimento/demonstração:
--   python -m backend.services.shared.migrate identidade --seed-demo --confirm-demo-database
-- Ids de outros serviços (usuários, categorias, vídeos) são fixos e iguais aos dos seeds desses serviços.

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
