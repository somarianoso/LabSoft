-- Eventos do serviço de profissionais.
--
-- PRODUZ (outbox + triggers, publicados pelo relay):
--   wellflix.profissionais.perfis  perfil.atualizado / perfil.removido
--     (perfil + lista de categorias autorizadas, usada pelo catálogo)
--
-- CONSOME (réplicas locais, atualizadas pelo consumidor Kafka):
--   usuarios_replica    <- wellflix.identidade.usuarios   (nome dos profissionais)
--   categorias_replica  <- wellflix.catalogo.categorias   (validar e exibir categorias)

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

CREATE FUNCTION publicar_perfil(p_usuario_id UUID) RETURNS VOID
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM profissionais WHERE usuario_id = p_usuario_id) THEN
        INSERT INTO outbox_eventos (topico, chave, tipo, payload)
        SELECT 'wellflix.profissionais.perfis', p_usuario_id::text, 'perfil.atualizado',
               jsonb_build_object(
                   'usuario_id', p_usuario_id,
                   'categorias', COALESCE(
                       (SELECT jsonb_agg(cp.categoria_id ORDER BY cp.categoria_id)
                        FROM categorias_profissional cp WHERE cp.profissional_id = p_usuario_id),
                       '[]'::jsonb)
               );
    ELSE
        INSERT INTO outbox_eventos (topico, chave, tipo, payload)
        VALUES ('wellflix.profissionais.perfis', p_usuario_id::text, 'perfil.removido',
                jsonb_build_object('usuario_id', p_usuario_id));
    END IF;
    PERFORM pg_notify('outbox', '');
END;
$$;

CREATE FUNCTION trg_perfil_evento() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
    IF TG_TABLE_NAME = 'profissionais' THEN
        PERFORM publicar_perfil(COALESCE(NEW.usuario_id, OLD.usuario_id));
    ELSE
        PERFORM publicar_perfil(COALESCE(NEW.profissional_id, OLD.profissional_id));
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER profissionais_evento
    AFTER INSERT OR DELETE ON profissionais
    FOR EACH ROW EXECUTE FUNCTION trg_perfil_evento();

CREATE TRIGGER categorias_profissional_evento
    AFTER INSERT OR DELETE ON categorias_profissional
    FOR EACH ROW EXECUTE FUNCTION trg_perfil_evento();

CREATE FUNCTION republicar_tudo() RETURNS VOID
LANGUAGE sql SET search_path FROM CURRENT AS $$
    SELECT publicar_perfil(usuario_id) FROM profissionais;
$$;

SELECT republicar_tudo();

CREATE TABLE usuarios_replica (
    id UUID PRIMARY KEY,
    nome_completo VARCHAR(120) NOT NULL,
    papeis TEXT[] NOT NULL DEFAULT '{}',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categorias_replica (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
