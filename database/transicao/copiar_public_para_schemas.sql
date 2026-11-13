-- Transição única: copia os dados do schema compartilhado antigo (public.*)
-- para os schemas próprios de cada serviço.
--
-- Ordem:
--   1. python -m backend.services.shared.migrate todos      (cria os 4 schemas vazios)
--   2. psql "$DATABASE_URL" -f database/transicao/copiar_public_para_schemas.sql
--   3. suba os serviços com KAFKA_BOOTSTRAP_SERVERS configurada: os triggers
--      gravam os eventos no outbox e as réplicas são preenchidas pelo Kafka.
--
-- Não apaga nada de public.*: as tabelas antigas ficam como backup até a
-- equipe conferir os dados. Pode ser executado de novo (ON CONFLICT DO NOTHING).

BEGIN;

-- identidade ---------------------------------------------------------------
INSERT INTO identidade.usuarios SELECT * FROM public.usuarios ON CONFLICT DO NOTHING;
INSERT INTO identidade.papeis_usuario SELECT * FROM public.papeis_usuario ON CONFLICT DO NOTHING;
INSERT INTO identidade.atletas SELECT * FROM public.atletas ON CONFLICT DO NOTHING;
INSERT INTO identidade.moderadores SELECT * FROM public.moderadores ON CONFLICT DO NOTHING;

-- catalogo -----------------------------------------------------------------
-- As categorias iniciais da migration nova têm ids fixos; se o nome já existia
-- no banco antigo, o id antigo prevalece (é ele que as outras tabelas usam).
DELETE FROM catalogo.categorias c
USING public.categorias old
WHERE old.nome = c.nome AND old.id <> c.id
  AND NOT EXISTS (SELECT 1 FROM catalogo.categorias_video cv WHERE cv.categoria_id = c.id);
INSERT INTO catalogo.categorias SELECT id, nome, data_criacao FROM public.categorias ON CONFLICT DO NOTHING;
INSERT INTO catalogo.videos SELECT * FROM public.videos ON CONFLICT DO NOTHING;
INSERT INTO catalogo.categorias_video SELECT * FROM public.categorias_video ON CONFLICT DO NOTHING;
INSERT INTO catalogo.comentarios SELECT * FROM public.comentarios ON CONFLICT DO NOTHING;
INSERT INTO catalogo.avaliacoes SELECT * FROM public.avaliacoes ON CONFLICT DO NOTHING;

-- profissionais ------------------------------------------------------------
-- public.profissional_videos não é copiada: repetia videos.profissional_id e
-- nenhuma rota a usava.
INSERT INTO profissionais.profissionais SELECT * FROM public.profissionais ON CONFLICT DO NOTHING;
INSERT INTO profissionais.categorias_profissional SELECT * FROM public.categorias_profissional ON CONFLICT DO NOTHING;
INSERT INTO profissionais.seguimentos_profissional SELECT * FROM public.seguimentos_profissional ON CONFLICT DO NOTHING;
INSERT INTO profissionais.revisoes_video (id, video_id, moderador_id, situacao, observacao, data_criacao)
SELECT id, video_id, moderador_id, situacao, observacao, data_criacao
FROM public.revisoes_video WHERE moderador_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- conta --------------------------------------------------------------------
-- Mesmo caso das categorias: os planos criados pela migration nova dão lugar
-- aos antigos (mesmo código), cujos ids as assinaturas antigas usam.
DELETE FROM conta.planos p
USING public.planos old
WHERE old.codigo = p.codigo AND old.id <> p.id
  AND NOT EXISTS (SELECT 1 FROM conta.assinaturas a WHERE a.plano_id = p.id);
INSERT INTO conta.planos SELECT * FROM public.planos ON CONFLICT DO NOTHING;
INSERT INTO conta.assinaturas SELECT * FROM public.assinaturas ON CONFLICT DO NOTHING;
INSERT INTO conta.categorias_assinatura (assinatura_id, categoria_id, categoria_nome)
SELECT ca.assinatura_id, ca.categoria_id, c.nome
FROM public.categorias_assinatura ca JOIN public.categorias c ON c.id = ca.categoria_id
ON CONFLICT DO NOTHING;
INSERT INTO conta.trilhas SELECT * FROM public.trilhas ON CONFLICT DO NOTHING;
INSERT INTO conta.videos_trilha SELECT * FROM public.videos_trilha ON CONFLICT DO NOTHING;
INSERT INTO conta.progresso_trilha SELECT * FROM public.progresso_trilha ON CONFLICT DO NOTHING;

COMMIT;
