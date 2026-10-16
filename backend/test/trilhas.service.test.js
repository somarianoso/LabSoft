import assert from "node:assert/strict";
import test from "node:test";
import { createTrilhasService } from "../src/trilhas/trilhas.service.js";

const atletaId = "77777777-7777-4777-8777-777777777777";
const trilhaId = "88888888-8888-4888-8888-888888888888";
const videoId = "99999999-9999-4999-8999-999999999999";

function serviceFor(repositoryOverrides = {}) {
  return createTrilhasService({
    listarDoAtleta: async () => [],
    criar: async (input) => input,
    buscarPorId: async () => ({
      id: trilhaId,
      atleta_id: atletaId,
      nome: "Minha trilha",
      privacidade: "privada",
    }),
    listarVideos: async () => [],
    alterar: async (input) => input,
    adicionarVideo: async (input) => input,
    removerVideo: async (input) => input,
    atualizarProgresso: async (input) => input,
    ...repositoryOverrides,
  });
}

test("cria trilha privada por padrão", async () => {
  const trail = await serviceFor().criar(atletaId, { nome: "Mobilidade" });
  assert.equal(trail.nome, "Mobilidade");
  assert.equal(trail.privacidade, "privada");
  assert.equal(trail.atletaId, atletaId);
});

test("rejeita trilha sem nome ou com privacidade inválida", async () => {
  const service = serviceFor();

  await assert.rejects(
    service.criar(atletaId, { nome: " " }),
    { status: 400 },
  );
  await assert.rejects(
    service.criar(atletaId, { nome: "Mobilidade", privacidade: "aberta" }),
    { status: 400 },
  );
});

test("não permite leitura de trilha privada por outro atleta", async () => {
  const service = serviceFor();
  const outroAtleta = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  await assert.rejects(service.buscar(outroAtleta, trilhaId), {
    status: 404,
    code: "TRAIL_NOT_FOUND",
  });
});

test("trilha pública não expõe ID do atleta nem progresso pessoal", async () => {
  const service = serviceFor({
    buscarPorId: async () => ({
      id: trilhaId,
      atleta_id: atletaId,
      nome: "Minha trilha",
      privacidade: "publica",
    }),
    listarVideos: async () => [
      {
        video_id: videoId,
        ordem: 1,
        segundos_assistidos: 420,
        concluido: false,
      },
    ],
  });
  const publicTrail = await service.buscar(null, trilhaId, true);

  assert.equal("atleta_id" in publicTrail, false);
  assert.deepEqual(publicTrail.videos, [{ video_id: videoId, ordem: 1 }]);
});

test("valida progresso e exige que o vídeo pertença à trilha", async () => {
  const service = serviceFor({
    atualizarProgresso: async () => null,
  });

  await assert.rejects(
    service.atualizarProgresso(atletaId, trilhaId, videoId, {
      segundos_assistidos: -1,
      concluido: false,
    }),
    { status: 400 },
  );

  await assert.rejects(
    service.atualizarProgresso(atletaId, trilhaId, videoId, {
      segundos_assistidos: 30,
      concluido: false,
    }),
    { status: 404, code: "TRAIL_VIDEO_NOT_FOUND" },
  );
});
