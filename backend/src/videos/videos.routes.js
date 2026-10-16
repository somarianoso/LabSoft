import { Router } from "express";
import { HttpError } from "../shared/http-error.js";
import { authenticatedUserId, requireAuthenticatedUser } from "../shared/authentication.js";
import { asyncHandler } from "../shared/http-error.js";
import { requireObject } from "../shared/validation.js";

function requireProfessional(request) {
  if (request.auth?.papel !== "profissional") {
    throw new HttpError(403, "Este endpoint é exclusivo para profissionais.", "FORBIDDEN");
  }
}

function requireModerator(request) {
  if (request.auth?.papel !== "moderador") {
    throw new HttpError(403, "Este endpoint é exclusivo para moderadores.", "FORBIDDEN");
  }
}

export function createVideosRouter(service, authenticateUser) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      response.json({ data: await service.listarPublicados() });
    }),
  );

  router.get(
    "/me",
    authenticateUser,
    asyncHandler(async (request, response) => {
      requireProfessional(request);
      response.json({
        data: await service.listarDoProfissional(authenticatedUserId(request)),
      });
    }),
  );

  router.get(
    "/:videoId",
    asyncHandler(async (request, response) => {
      const video = await service.buscar(request.params.videoId);
      if (video.situacao !== "publicado") {
        throw new HttpError(404, "Vídeo não encontrado.", "VIDEO_NOT_FOUND");
      }
      response.json({ data: video });
    }),
  );

  router.post(
    "/",
    authenticateUser,
    asyncHandler(async (request, response) => {
      requireProfessional(request);
      const video = await service.criar(
        authenticatedUserId(request),
        requireObject(request.body),
      );
      response.status(201).json({ data: video });
    }),
  );

  router.patch(
    "/:videoId",
    authenticateUser,
    asyncHandler(async (request, response) => {
      requireProfessional(request);
      const video = await service.atualizar(
        authenticatedUserId(request),
        request.params.videoId,
        requireObject(request.body),
      );
      response.json({ data: video });
    }),
  );

  router.post(
    "/:videoId/revisoes",
    authenticateUser,
    asyncHandler(async (request, response) => {
      requireModerator(request);
      const review = await service.revisar(
        authenticatedUserId(request),
        request.params.videoId,
        requireObject(request.body),
      );
      response.status(201).json({ data: review });
    }),
  );

  return router;
}
