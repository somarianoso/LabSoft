import { HttpError } from "./http-error.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireUuid(value, fieldName = "id") {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new HttpError(400, `O campo ${fieldName} deve ser um UUID válido.`);
  }

  return value;
}

export function requireObject(value, fieldName = "body") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `O campo ${fieldName} deve ser um objeto.`);
  }

  return value;
}

export function requireNonEmptyText(value, fieldName, maxLength) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > maxLength
  ) {
    throw new HttpError(
      400,
      `${fieldName} deve conter de 1 a ${maxLength} caracteres.`,
    );
  }

  return value.trim();
}

export function normalizeEmail(value) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  ) {
    throw new HttpError(400, "Informe um e-mail válido.", "INVALID_EMAIL");
  }

  return value.trim().toLowerCase();
}
