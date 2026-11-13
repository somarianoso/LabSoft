-- Eventos do serviço de catálogo.
--
-- PRODUZ (outbox + triggers, publicados pelo relay):
--   wellflix.catalogo.categorias  categoria.atualizada / categoria.removida
--   wellflix.catalogo.videos      video.atualizado / video.removido
--
-- CONSOME (réplicas locais, atualizadas pelo consumidor Kafka):
--   usuarios_replica       <- wellflix.identidade.usuarios   (nome do autor/comentarista)
--   profissionais_replica  <- wellflix.profissionais.perfis  (perfil e categorias autorizadas)

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

CREATE FUNCTION trg_categorias_evento() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO outbox_eventos (topico, chave, tipo, payload)
        VALUES ('wellflix.catalogo.categorias', OLD.id::text, 'categoria.removida',
                jsonb_build_object('id', OLD.id));
    ELSE
        INSERT INTO outbox_eventos (topico, chave, tipo, payload)
        VALUES ('wellflix.catalogo.categorias', NEW.id::text, 'categoria.atualizada',
                jsonb_build_object('id', NEW.id, 'nome', NEW.nome));
    END IF;
    PERFORM pg_notify('outbox', '');
    RETURN NULL;
END;
$$;

CREATE TRIGGER categorias_evento
    AFTER INSERT OR UPDATE OR DELETE ON categorias
    FOR EACH ROW EXECUTE FUNCTION trg_categorias_evento();

CREATE FUNCTION trg_videos_evento() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO outbox_eventos (topico, chave, tipo, payload)
        VALUES ('wellflix.catalogo.videos', OLD.id::text, 'video.removido',
                jsonb_build_object('id', OLD.id));
    ELSE
        INSERT INTO outbox_eventos (topico, chave, tipo, payload)
        VALUES ('wellflix.catalogo.videos', NEW.id::text, 'video.atualizado',
                jsonb_build_object('id', NEW.id, 'profissional_id', NEW.profissional_id,
                                   'titulo', NEW.titulo, 'situacao', NEW.situacao));
    END IF;
    PERFORM pg_notify('outbox', '');
    RETURN NULL;
END;
$$;

CREATE TRIGGER videos_evento
    AFTER INSERT OR DELETE OR UPDATE OF titulo, situacao, profissional_id ON videos
    FOR EACH ROW EXECUTE FUNCTION trg_videos_evento();

CREATE FUNCTION republicar_tudo() RETURNS VOID
LANGUAGE sql SET search_path FROM CURRENT AS $$
    UPDATE categorias SET nome = nome;
    UPDATE videos SET situacao = situacao;
$$;

SELECT republicar_tudo();

CREATE TABLE usuarios_replica (
    id UUID PRIMARY KEY,
    nome_completo VARCHAR(120) NOT NULL,
    papeis TEXT[] NOT NULL DEFAULT '{}',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profissionais_replica (
    usuario_id UUID PRIMARY KEY,
    categorias UUID[] NOT NULL DEFAULT '{}',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
