-- Categorias iniciais com ids fixos, para que os seeds dos outros serviços
-- possam referenciá-las sem consultar este banco.
INSERT INTO categorias (id, nome)
VALUES
    ('60000000-0000-4000-8000-000000000001', 'Musculação'),
    ('60000000-0000-4000-8000-000000000002', 'Yoga'),
    ('60000000-0000-4000-8000-000000000003', 'Basquete'),
    ('60000000-0000-4000-8000-000000000004', 'Nutrição'),
    ('60000000-0000-4000-8000-000000000005', 'Recuperação'),
    ('60000000-0000-4000-8000-000000000006', 'Lesões')
ON CONFLICT (nome) DO NOTHING;
