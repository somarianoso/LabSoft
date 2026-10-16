import { HttpError } from "../shared/http-error.js";
import { requireUuid, requireNonEmptyText } from "../shared/validation.js";

const privacyOptions = new Set(["privada", "publica"]);

export function createTrilhasService(repository) {
  return {
    listar: (atletaId) =>
      repository.listarDoAtleta(requireUuid(atletaId, "usuarioId")),

    async criar(atletaId, input) {
      const body = input || {};
      const nome = requireNonEmptyText(body.nome, "nome", 120);
      const privacidade = body.privacidade ?? "privada";
      if (!privacyOptions.has(privacidade)) {
        throw new HttpError(400, "A privacidade deve ser privada ou publica.");
      }

      return repository.criar({
        atletaId: requireUuid(atletaId, "usuarioId"),
        nome,
        privacidade,
      });
    },

    async buscar(atletaId, trilhaId, publicOnly = false) {
      const id = requireUuid(trilhaId, "trilhaId");
      const trail = await repository.buscarPorId(id);
      const { atleta_id: ownerId, ...trailDetails } = trail || {};
      const isOwner =
        !publicOnly && ownerId === requireUuid(atletaId, "usuarioId");
      if (
        !trail ||
        (publicOnly && trail.privacidade !== "publica") ||
        (!isOwner && trail.privacidade === "privada")
      ) {
        throw new HttpError(404, "Trilha não encontrada.", "TRAIL_NOT_FOUND");
      }
      const videos = await repository.listarVideos(id);
      return {
        ...trailDetails,
        videos: isOwner
          ? videos
          : videos.map(({ video_id, ordem }) => ({ video_id, ordem })),
      };
    },

    async alterar(atletaId, trilhaId, input) {
      const body = input || {};
      const nome =
        body.nome === undefined
          ? null
          : requireNonEmptyText(body.nome, "nome", 120);
      const privacidade = body.privacidade ?? null;
      if (privacidade !== null && !privacyOptions.has(privacidade)) {
        throw new HttpError(400, "A privacidade deve ser privada ou publica.");
      }
      const trail = await repository.alterar({
        atletaId: requireUuid(atletaId, "usuarioId"),
        trilhaId: requireUuid(trilhaId, "trilhaId"),
        nome,
        privacidade,
      });
      if (!trail) {
        throw new HttpError(404, "Trilha não encontrada.", "TRAIL_NOT_FOUND");
      }
      return trail;
    },

    async adicionarVideo(atletaId, trilhaId, videoId) {
      const item = await repository.adicionarVideo({
        atletaId: requireUuid(atletaId, "usuarioId"),
        trilhaId: requireUuid(trilhaId, "trilhaId"),
        videoId: requireUuid(videoId, "videoId"),
      });
      if (!item) {
        throw new HttpError(404, "Trilha não encontrada.", "TRAIL_NOT_FOUND");
      }
      return item;
    },

    async removerVideo(atletaId, trilhaId, videoId) {
      const removed = await repository.removerVideo({
        atletaId: requireUuid(atletaId, "usuarioId"),
        trilhaId: requireUuid(trilhaId, "trilhaId"),
        videoId: requireUuid(videoId, "videoId"),
      });
      if (!removed) {
        throw new HttpError(
          404,
          "Vídeo não encontrado na trilha.",
          "TRAIL_VIDEO_NOT_FOUND",
        );
      }
      return removed;
    },

    async atualizarProgresso(atletaId, trilhaId, videoId, input) {
      const body = input || {};
      if (
        !Number.isInteger(body.segundos_assistidos) ||
        body.segundos_assistidos < 0 ||
        typeof body.concluido !== "boolean"
      ) {
        throw new HttpError(
          400,
          "Informe segundos_assistidos (inteiro não negativo) e concluido (booleano).",
        );
      }
      const progress = await repository.atualizarProgresso({
        atletaId: requireUuid(atletaId, "usuarioId"),
        trilhaId: requireUuid(trilhaId, "trilhaId"),
        videoId: requireUuid(videoId, "videoId"),
        segundos: body.segundos_assistidos,
        concluido: body.concluido,
      });
      if (!progress) {
        throw new HttpError(
          404,
          "Vídeo não encontrado na trilha.",
          "TRAIL_VIDEO_NOT_FOUND",
        );
      }
      return progress;
    },
  };
}
