import { Router } from "express";
import {
  authenticatedUserId,
  requireAuthenticatedUser,
} from "../shared/authentication.js";
import { asyncHandler } from "../shared/http-error.js";
import { requireObject } from "../shared/validation.js";

export function createTrilhasRouter(
  service,
  authenticateUser = requireAuthenticatedUser,
) {
  const router = Router();

  router.get(
    "/publicas/:trilhaId",
    asyncHandler(async (request, response) => {
      response.json({
        data: await service.buscar(null, request.params.trilhaId, true),
      });
    }),
  );

  router.use(authenticateUser);

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      response.json({ data: await service.listar(authenticatedUserId(request)) });
    }),
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      response.status(201).json({
        data: await service.criar(
          authenticatedUserId(request),
          requireObject(request.body),
        ),
      });
    }),
  );

  router.get(
    "/:trilhaId",
    asyncHandler(async (request, response) => {
      response.json({
        data: await service.buscar(
          authenticatedUserId(request),
          request.params.trilhaId,
        ),
      });
    }),
  );

  router.patch(
    "/:trilhaId",
    asyncHandler(async (request, response) => {
      response.json({
        data: await service.alterar(
          authenticatedUserId(request),
          request.params.trilhaId,
          requireObject(request.body),
        ),
      });
    }),
  );

  router.post(
    "/:trilhaId/videos",
    asyncHandler(async (request, response) => {
      const body = requireObject(request.body);
      response.status(201).json({
        data: await service.adicionarVideo(
          authenticatedUserId(request),
          request.params.trilhaId,
          body.video_id,
        ),
      });
    }),
  );

  router.delete(
    "/:trilhaId/videos/:videoId",
    asyncHandler(async (request, response) => {
      response.json({
        data: await service.removerVideo(
          authenticatedUserId(request),
          request.params.trilhaId,
          request.params.videoId,
        ),
      });
    }),
  );

  router.put(
    "/:trilhaId/videos/:videoId/progresso",
    asyncHandler(async (request, response) => {
      response.json({
        data: await service.atualizarProgresso(
          authenticatedUserId(request),
          request.params.trilhaId,
          request.params.videoId,
          requireObject(request.body),
        ),
      });
    }),
  );

  return router;
}
