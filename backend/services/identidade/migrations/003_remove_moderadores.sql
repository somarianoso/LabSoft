-- A tabela "moderadores" passou para o serviço de profissionais e moderação
-- (schema "profissionais"), dono das revisões de vídeo feitas por moderadores.
-- O papel "moderador" continua aqui, em papeis_usuario, e segue no token JWT
-- e no evento wellflix.identidade.usuarios.
--
-- A cópia dos moderadores existentes é feita pela migration
-- profissionais/003_moderadores.sql a partir de usuarios_replica.

DROP TABLE IF EXISTS moderadores;
