-- Outbox de eventos do serviço de identidade.
-- Triggers gravam um evento a cada mudança em usuarios/papeis_usuario, na
-- mesma transação da alteração. O relay (backend/services/shared/eventos.py)
-- publica no tópico Kafka "wellflix.identidade.usuarios".
-- Só nome e papéis saem do serviço: e-mail, CPF e senha nunca são publicados.

CREATE TABLE outbox_eventos (
    id BIGSERIAL PRIMARY KEY,
    topico VARCHAR(120) NOT NULL,
    chave TEXT NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    payload JSONB NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    publicado_em TIMESTAMPTZ
);

CREATE INDEX outbox_eventos_pendentes_idx
    ON outbox_eventos (id) WHERE publicado_em IS NULL;

CREATE FUNCTION publicar_usuario(p_usuario_id UUID) RETURNS VOID
LANGUAGE sql SET search_path FROM CURRENT AS $$
    INSERT INTO outbox_eventos (topico, chave, tipo, payload)
    SELECT 'wellflix.identidade.usuarios', u.id::text, 'usuario.atualizado',
           jsonb_build_object(
               'id', u.id,
               'nome_completo', u.nome_completo,
               'papeis', COALESCE(
                   (SELECT jsonb_agg(p.papel ORDER BY p.papel)
                    FROM papeis_usuario p WHERE p.usuario_id = u.id),
                   '[]'::jsonb)
           )
    FROM usuarios u
    WHERE u.id = p_usuario_id;
    SELECT pg_notify('outbox', '');
$$;

CREATE FUNCTION trg_usuarios_evento() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO outbox_eventos (topico, chave, tipo, payload)
        VALUES ('wellflix.identidade.usuarios', OLD.id::text, 'usuario.removido',
                jsonb_build_object('id', OLD.id));
        PERFORM pg_notify('outbox', '');
    ELSE
        PERFORM publicar_usuario(NEW.id);
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER usuarios_evento
    AFTER INSERT OR DELETE OR UPDATE OF nome_completo ON usuarios
    FOR EACH ROW EXECUTE FUNCTION trg_usuarios_evento();

CREATE FUNCTION trg_papeis_evento() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
    PERFORM publicar_usuario(COALESCE(NEW.usuario_id, OLD.usuario_id));
    RETURN NULL;
END;
$$;

CREATE TRIGGER papeis_usuario_evento
    AFTER INSERT OR DELETE ON papeis_usuario
    FOR EACH ROW EXECUTE FUNCTION trg_papeis_evento();

-- Republica o estado atual de todos os usuários (carga inicial das réplicas).
CREATE FUNCTION republicar_tudo() RETURNS VOID
LANGUAGE sql SET search_path FROM CURRENT AS $$
    SELECT publicar_usuario(id) FROM usuarios;
$$;

SELECT republicar_tudo();
