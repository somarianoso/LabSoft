export class HttpError extends Error {
  constructor(status, message, code = "REQUEST_FAILED") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function asyncHandler(handler) {
  return (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next);
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error.code === "23505") {
    response.status(409).json({
      error: { code: "CONFLICT", message: "O registro já existe." },
    });
    return;
  }

  if (error.code === "23503") {
    response.status(422).json({
      error: {
        code: "INVALID_REFERENCE",
        message: "Uma das referências informadas não existe.",
      },
    });
    return;
  }

  console.error("Erro não tratado na API WellFlix.", {
    method: request.method,
    path: request.path,
    error,
  });
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Ocorreu um erro interno." },
  });
}
