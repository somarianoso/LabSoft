import { Router } from "express";
import { authenticatedUserId, requireAuthenticatedUser } from "../shared/authentication.js";
import { asyncHandler } from "../shared/http-error.js";
import { requireObject } from "../shared/validation.js";

export function createAssinaturasRouter(service) {
  const router = Router();
  router.use(requireAuthenticatedUser);

  router.get(
    "/atual",
    asyncHandler(async (request, response) => {
      response.json({ data: await service.atual(authenticatedUserId(request)) });
    }),
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const assinatura = await service.criar(
        authenticatedUserId(request),
        requireObject(request.body),
      );
      response.status(201).json({ data: assinatura });
    }),
  );

  router.post(
    "/:assinaturaId/cancelamento",
    asyncHandler(async (request, response) => {
      const assinatura = await service.cancelar(
        authenticatedUserId(request),
        request.params.assinaturaId,
      );
      response.json({ data: assinatura });
    }),
  );

  return router;
}
