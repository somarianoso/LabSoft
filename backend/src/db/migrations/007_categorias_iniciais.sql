INSERT INTO categorias (nome)
VALUES
    ('Musculação'),
    ('Yoga'),
    ('Basquete'),
    ('Nutrição'),
    ('Recuperação'),
    ('Lesões')
ON CONFLICT (nome) DO NOTHING;
