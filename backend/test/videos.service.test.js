import assert from "node:assert/strict";
import test from "node:test";
import { createVideosService } from "../src/videos/videos.service.js";

const profissionalId = "11111111-1111-4111-8111-111111111111";
const videoId = "22222222-2222-4222-8222-222222222222";
const categoriaId = "33333333-3333-4333-8333-333333333333";

function serviceFor(repositoryOverrides = {}) {
  return createVideosService({
    listarPublicados: async () => [],
    listarPorProfissional: async () => [],
    buscarPorId: async (id) => ({
      id,
      profissional_id: profissionalId,
      profissional_nome: "Ana Reforço",
      titulo: "Treino de mobilidade",
      descricao: "Descrição de exemplo",
      duracao_segundos: 1800,
      url_conteudo: "/videos/mobilidade.mp4",
      situacao: "publicado",
      categorias: [{ id: categoriaId, nome: "Yoga" }],
    }),
    criar: async (input) => ({ id: videoId, ...input }),
    alterar: async (input) => input,
    definirCategorias: async () => [],
    registrarRevisao: async (input) => input,
    ...repositoryOverrides,
  });
}

test("cria vídeo com status padrão e categorias válidas", async () => {
  const service = serviceFor({
    criar: async (input) => ({
      id: videoId,
      profissional_id: input.profissionalId,
      titulo: input.titulo,
      descricao: input.descricao,
      duracao_segundos: input.duracaoSegundos,
      url_conteudo: input.urlConteudo,
      situacao: input.situacao,
    }),
    buscarPorId: async () => ({
      id: videoId,
      profissional_id: profissionalId,
      profissional_nome: "Ana Reforço",
      titulo: "Treino de mobilidade",
      descricao: "Descrição de exemplo",
      duracao_segundos: 1800,
      url_conteudo: "/videos/mobilidade.mp4",
      situacao: "rascunho",
      categorias: [{ id: categoriaId, nome: "Yoga" }],
    }),
  });

  const video = await service.criar(profissionalId, {
    titulo: "Treino de mobilidade",
    descricao: "Descrição de exemplo",
    duracao_segundos: 1800,
    url_conteudo: "/videos/mobilidade.mp4",
    categorias: [categoriaId],
  });

  assert.equal(video.titulo, "Treino de mobilidade");
  assert.equal(video.situacao, "rascunho");
  assert.equal(video.url_conteudo, "/videos/mobilidade.mp4");
});

test("rejeita vídeo com duração e URL inválidas", async () => {
  const service = serviceFor();

  await assert.rejects(
    service.criar(profissionalId, {
      titulo: "Teste",
      duracao_segundos: 0,
      url_conteudo: "not-a-url",
    }),
    { status: 400 },
  );

  await assert.rejects(
    service.criar(profissionalId, {
      titulo: "Teste",
      duracao_segundos: 60,
      url_conteudo: "https://example.com/video.mp4",
      categorias: ["not-a-uuid"],
    }),
    { status: 400 },
  );
});

test("exige revisão com decisão válida e atualiza status do vídeo", async () => {
  const service = serviceFor({
    buscarPorId: async () => ({
      id: videoId,
      profissional_id: profissionalId,
      situacao: "aguardando_revisao",
    }),
    alterar: async ({ situacao }) => ({ id: videoId, situacao }),
    registrarRevisao: async ({ situacao }) => ({
      id: "99999999-9999-4999-8999-999999999999",
      situacao,
    }),
  });

  const review = await service.revisar(
    "44444444-4444-4444-8444-444444444444",
    videoId,
    { situacao: "aprovado", observacao: "Conteúdo adequado." },
  );

  assert.equal(review.video.situacao, "publicado");
  assert.equal(review.revisao.situacao, "aprovado");
});
