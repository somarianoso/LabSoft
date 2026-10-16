import { HttpError } from "./http-error.js";

export function authenticationNotConfigured(request, response, next) {
  next(
    new HttpError(
      503,
      "A autenticação ainda não está integrada a esta API.",
      "AUTHENTICATION_NOT_CONFIGURED",
    ),
  );
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
