import { HttpError } from "../shared/http-error.js";
import { hashPassword } from "../shared/password.js";
import {
  normalizeEmail,
  requireNonEmptyText,
  requireUuid,
} from "../shared/validation.js";

function normalizeCpf(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "Informe um CPF válido.", "INVALID_CPF");
  }

  const formattedCpf = value.trim();
  const cpf =
    /^\d{11}$/.test(formattedCpf) ||
    /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formattedCpf)
      ? formattedCpf.replace(/\D/g, "")
      : "";
  if (!cpf || /^(\d)\1{10}$/.test(cpf)) {
    throw new HttpError(400, "Informe um CPF válido.", "INVALID_CPF");
  }

  const digits = [...cpf].map(Number);
  const firstCheckDigit =
    (digits.slice(0, 9).reduce((sum, digit, index) => sum + digit * (10 - index), 0) *
      10) %
    11;
  const secondCheckDigit =
    (digits.slice(0, 10).reduce((sum, digit, index) => sum + digit * (11 - index), 0) *
      10) %
    11;

  if (
    digits[9] !== (firstCheckDigit === 10 ? 0 : firstCheckDigit) ||
    digits[10] !== (secondCheckDigit === 10 ? 0 : secondCheckDigit)
  ) {
    throw new HttpError(400, "Informe um CPF válido.", "INVALID_CPF");
  }

  return cpf;
}

export function createAtletasService(repository, passwordHasher = hashPassword) {
  return {
    async registrar(input) {
      const nomeCompleto = requireNonEmptyText(
        input.nome_completo,
        "nome_completo",
        120,
      );
      const cpf = normalizeCpf(input.cpf);
      const email = normalizeEmail(input.email);
      if (
        typeof input.senha !== "string" ||
        input.senha.length < 8 ||
        input.senha.length > 128
      ) {
        throw new HttpError(
          400,
          "A senha deve conter de 8 a 128 caracteres.",
          "INVALID_PASSWORD",
        );
      }

      const hashSenha = await passwordHasher(input.senha);
      return repository.criar({ nomeCompleto, cpf, email, hashSenha });
    },

    async perfil(usuarioId) {
      const profile = await repository.buscarPerfil(
        requireUuid(usuarioId, "usuarioId"),
      );
      if (!profile) {
        throw new HttpError(
          404,
          "Perfil de atleta não encontrado.",
          "ATHLETE_NOT_FOUND",
        );
      }
      return profile;
    },
  };
}
