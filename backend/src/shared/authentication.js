import { HttpError } from "./http-error.js";
import { verifyAccessToken } from "./tokens.js";

export function authenticationNotConfigured(request, response, next) {
  next(
    new HttpError(
      503,
      "A autenticação ainda não está integrada a esta API.",
      "AUTHENTICATION_NOT_CONFIGURED",
    ),
  );
}

export function createAuthenticationMiddleware(secret) {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    return authenticationNotConfigured;
  }

  return async (request, response, next) => {
    const authorization = request.get("authorization");
    const match =
      typeof authorization === "string" &&
      authorization.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);

    if (!match) {
      next(
        new HttpError(
          401,
          "É necessário entrar em uma conta para realizar esta operação.",
          "AUTHENTICATION_REQUIRED",
        ),
      );
      return;
    }

    try {
      const payload = await verifyAccessToken(match[1], secret);
      if (
        typeof payload.sub !== "string" ||
        !["atleta", "profissional", "moderador"].includes(payload.papel)
      ) {
        throw new Error("Token sem identidade ou papel válidos.");
      }
      request.auth = { usuarioId: payload.sub, papel: payload.papel };
      next();
    } catch {
      next(
        new HttpError(
          401,
          "A sessão é inválida ou expirou. Entre novamente.",
          "AUTHENTICATION_INVALID",
        ),
      );
    }
  };
}

export function requireAuthenticatedUser(request, response, next) {
  if (!request.auth?.usuarioId) {
    next(
      new HttpError(
        401,
        "É necessário entrar em uma conta para realizar esta operação.",
        "AUTHENTICATION_REQUIRED",
      ),
    );
    return;
  }

  next();
}

export function authenticatedUserId(request) {
  if (!request.auth?.usuarioId) {
    throw new HttpError(
      401,
      "É necessário entrar em uma conta para realizar esta operação.",
      "AUTHENTICATION_REQUIRED",
    );
  }

  return request.auth.usuarioId;
}
