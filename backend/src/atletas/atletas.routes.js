import { Router } from "express";
import { authenticatedUserId } from "../shared/authentication.js";
import { asyncHandler } from "../shared/http-error.js";
import { requireObject } from "../shared/validation.js";

export function createAtletasRouter(service, authenticateUser) {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const athlete = await service.registrar(requireObject(request.body));
      response.status(201).json({ data: athlete });
    }),
  );

  router.get(
    "/me",
    authenticateUser,
    asyncHandler(async (request, response) => {
      response.json({ data: await service.perfil(authenticatedUserId(request)) });
    }),
  );

  return router;
}
