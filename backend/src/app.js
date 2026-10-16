import express from "express";
import { createAssinaturasRepository } from "./assinaturas/assinaturas.repository.js";
import { createAssinaturasRouter } from "./assinaturas/assinaturas.routes.js";
import { createAssinaturasService } from "./assinaturas/assinaturas.service.js";
import { createPlanosRepository } from "./planos/planos.repository.js";
import { createPlanosRouter } from "./planos/planos.routes.js";
import { createPlanosService } from "./planos/planos.service.js";
import { authenticationNotConfigured } from "./shared/authentication.js";
import { errorHandler, HttpError } from "./shared/http-error.js";
import { createTrilhasRepository } from "./trilhas/trilhas.repository.js";
import { createTrilhasRouter } from "./trilhas/trilhas.routes.js";
import { createTrilhasService } from "./trilhas/trilhas.service.js";

export function createApp({
  pool,
  authenticateUser = authenticationNotConfigured,
  frontendOrigin = process.env.FRONTEND_ORIGIN,
}) {
  if (!pool) {
    throw new Error("createApp exige uma conexão de banco pool.");
  }

  const app = express();
  app.disable("x-powered-by");
  app.use((request, response, next) => {
    const origin = request.get("origin");
    if (!origin || !frontendOrigin || origin === frontendOrigin) {
      if (origin && frontendOrigin) {
        response.set("Access-Control-Allow-Origin", frontendOrigin);
        response.set("Vary", "Origin");
        response.set("Access-Control-Allow-Credentials", "true");
        response.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        );
        response.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        );
      }
      if (request.method === "OPTIONS") {
        response.sendStatus(204);
        return;
      }
      next();
      return;
    }

    next(new HttpError(403, "Origem não autorizada.", "ORIGIN_NOT_ALLOWED"));
  });
  app.use(express.json({ limit: "32kb" }));

  const planosRepository = createPlanosRepository(pool);
  const assinaturasRepository = createAssinaturasRepository(pool);
  const trilhasRepository = createTrilhasRepository(pool);

  app.get("/api/health", (request, response) => {
    response.json({ data: { status: "ok" } });
  });
  app.use(
    "/api/planos",
    createPlanosRouter(createPlanosService(planosRepository)),
  );
  app.use(
    "/api/assinaturas",
    authenticateUser,
    createAssinaturasRouter(createAssinaturasService(assinaturasRepository)),
  );
  app.use(
    "/api/trilhas",
    createTrilhasRouter(
      createTrilhasService(trilhasRepository),
      authenticateUser,
    ),
  );
  app.use((request, response) => {
    response.status(404).json({
      error: { code: "NOT_FOUND", message: "Rota não encontrada." },
    });
  });
  app.use(errorHandler);

  return app;
}
