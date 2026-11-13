-- Perfil de moderador, trazido do serviço de identidade.
--
-- Referência lógica para outro serviço (UUID sem FK):
--   moderadores.usuario_id -> identidade.usuarios.id
--
-- O papel "moderador" continua concedido em identidade.papeis_usuario; este
-- serviço guarda o perfil de quem modera e liga as revisões a ele.

CREATE TABLE moderadores (
    usuario_id UUID PRIMARY KEY,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carga inicial: usuários com papel de moderador (réplica alimentada pelo
-- Kafka) e quem já registrou revisões.
INSERT INTO moderadores (usuario_id)
SELECT id FROM usuarios_replica WHERE 'moderador' = ANY(papeis)
UNION
SELECT DISTINCT moderador_id FROM revisoes_video
ON CONFLICT DO NOTHING;

ALTER TABLE revisoes_video
    ADD CONSTRAINT revisoes_video_moderador_fk
    FOREIGN KEY (moderador_id) REFERENCES moderadores(usuario_id);

CREATE INDEX revisoes_video_moderador_idx ON revisoes_video (moderador_id);
