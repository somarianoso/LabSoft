import { HttpError } from "../shared/http-error.js";
import {
  requireNonEmptyText,
  requireObject,
  requireUuid,
} from "../shared/validation.js";

const validStatuses = new Set([
  "rascunho",
  "aguardando_revisao",
  "publicado",
  "rejeitado",
  "arquivado",
]);

const reviewStatuses = new Set(["aprovado", "rejeitado"]);

function normalizeCategorias(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, "Categorias deve ser uma lista de UUIDs.");
  }

  const values = value.map((categoriaId) => {
    if (typeof categoriaId !== "string") {
      throw new HttpError(400, "Cada categoria deve ser um UUID válido.");
    }
    return requireUuid(categoriaId, "categoriaId");
  });

  return [...new Set(values)];
}

function normalizeDescricao(value) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "A descrição do vídeo deve ser textual.");
  }

  const trimmed = value.trim();
  if (trimmed.length > 2000) {
    throw new HttpError(400, "A descrição deve ter até 2000 caracteres.");
  }

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeConteudoUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, "Informe uma URL ou caminho de conteúdo válido.");
  }

  const trimmed = value.trim();
  if (trimmed.length > 500) {
    throw new HttpError(400, "A URL do conteúdo deve ter até 500 caracteres.");
  }

  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
    throw new HttpError(
      400,
      "O conteúdo do vídeo deve ser uma URL HTTP ou um caminho relativo.",
    );
  }

  return trimmed;
}

export function createVideosService(repository) {
  return {
    async listarPublicados() {
      return repository.listarPublicados();
    },

    async listarDoProfissional(profissionalId) {
      return repository.listarPorProfissional(
        requireUuid(profissionalId, "usuarioId"),
      );
    },

    async buscar(videoId) {
      const video = await repository.buscarPorId(requireUuid(videoId, "videoId"));
      if (!video) {
        throw new HttpError(404, "Vídeo não encontrado.", "VIDEO_NOT_FOUND");
      }
      return video;
    },

    async criar(profissionalId, input) {
      const body = requireObject(input);
      const profissional = requireUuid(profissionalId, "usuarioId");
      const titulo = requireNonEmptyText(body.titulo, "titulo", 200);
      const descricao = normalizeDescricao(body.descricao);
      const duracaoSegundos = Number(body.duracao_segundos);
      if (!Number.isInteger(duracaoSegundos) || duracaoSegundos <= 0) {
        throw new HttpError(
          400,
          "duracao_segundos deve ser um inteiro maior que zero.",
        );
      }

      const urlConteudo = normalizeConteudoUrl(
        body.url_conteudo ?? body.conteudo_url,
      );
      const situacao = body.situacao ?? "rascunho";
      if (!validStatuses.has(situacao)) {
        throw new HttpError(
          400,
          "A situação do vídeo deve ser rascunho, aguardando_revisao, publicado, rejeitado ou arquivado.",
        );
      }

      const categorias = normalizeCategorias(body.categorias ?? []);
      const video = await repository.criar({
        profissionalId: profissional,
        titulo,
        descricao,
        duracaoSegundos,
        urlConteudo,
        situacao,
      });

      if (categorias.length > 0) {
        await repository.definirCategorias(video.id, categorias);
      }

      return repository.buscarPorId(video.id);
    },

    async atualizar(profissionalId, videoId, input) {
      const body = requireObject(input);
      const id = requireUuid(videoId, "videoId");
      const ownerId = requireUuid(profissionalId, "usuarioId");
      const video = await repository.buscarPorId(id);
      if (!video || video.profissional_id !== ownerId) {
        throw new HttpError(404, "Vídeo não encontrado para este profissional.", "VIDEO_NOT_FOUND");
      }

      const titulo =
        body.titulo === undefined
          ? undefined
          : requireNonEmptyText(body.titulo, "titulo", 200);
      const descricao =
        body.descricao === undefined ? undefined : normalizeDescricao(body.descricao);
      const duracaoSegundos =
        body.duracao_segundos === undefined
          ? undefined
          : Number(body.duracao_segundos);
      if (
        duracaoSegundos !== undefined &&
        (!Number.isInteger(duracaoSegundos) || duracaoSegundos <= 0)
      ) {
        throw new HttpError(
          400,
          "duracao_segundos deve ser um inteiro maior que zero.",
        );
      }

      const urlConteudo =
        body.url_conteudo === undefined && body.conteudo_url === undefined
          ? undefined
          : normalizeConteudoUrl(body.url_conteudo ?? body.conteudo_url);
      const situacao =
        body.situacao === undefined ? undefined : body.situacao;
      if (situacao !== undefined && !validStatuses.has(situacao)) {
        throw new HttpError(
          400,
          "A situação do vídeo deve ser rascunho, aguardando_revisao, publicado, rejeitado ou arquivado.",
        );
      }

      const nextVideo = await repository.alterar({
        videoId: id,
        titulo,
        descricao,
        duracaoSegundos,
        urlConteudo,
        situacao,
      });

      if (body.categorias !== undefined) {
        await repository.definirCategorias(id, normalizeCategorias(body.categorias));
      }

      return repository.buscarPorId(nextVideo?.id ?? id);
    },

    async revisar(moderadorId, videoId, input) {
      const body = requireObject(input);
      const video = await repository.buscarPorId(requireUuid(videoId, "videoId"));
      if (!video) {
        throw new HttpError(404, "Vídeo não encontrado.", "VIDEO_NOT_FOUND");
      }

      const situacao = body.situacao;
      if (!reviewStatuses.has(situacao)) {
        throw new HttpError(
          400,
          "A revisão deve aprovar ou rejeitar o vídeo.",
        );
      }

      const observacao =
        body.observacao === undefined
          ? null
          : requireNonEmptyText(body.observacao, "observacao", 1000);
      const moderatedStatus = situacao === "aprovado" ? "publicado" : "rejeitado";
      const updatedVideo = await repository.alterar({
        videoId: video.id,
        situacao: moderatedStatus,
      });

      const review = await repository.registrarRevisao({
        videoId: video.id,
        moderadorId: requireUuid(moderadorId, "usuarioId"),
        situacao,
        observacao,
      });

      const refreshedVideo = updatedVideo
        ? { ...video, ...updatedVideo }
        : await repository.buscarPorId(video.id);

      return {
        video: refreshedVideo,
        revisao: review,
      };
    },
  };
}
