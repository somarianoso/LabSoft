import { Router } from "express";
import { asyncHandler } from "../shared/http-error.js";
import { requireObject } from "../shared/validation.js";

export function createAuthRouter(service) {
  const router = Router();

  router.post(
    "/sessao",
    asyncHandler(async (request, response) => {
      response.json({
        data: await service.iniciarSessao(requireObject(request.body)),
      });
    }),
  );

  return router;
}
