import { Router } from "express";
import { asyncHandler } from "../shared/http-error.js";

export function createPlanosRouter(service) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      response.json({ data: await service.listar() });
    }),
  );

  return router;
}
