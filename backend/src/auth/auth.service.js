import { randomBytes } from "node:crypto";
import { HttpError } from "../shared/http-error.js";
import { hashPassword, verifyPassword } from "../shared/password.js";
import { normalizeEmail } from "../shared/validation.js";
import { createAccessToken } from "../shared/tokens.js";

let missingAccountHash;

function getMissingAccountHash() {
  if (!missingAccountHash) {
    missingAccountHash = hashPassword(randomBytes(32).toString("base64url"));
  }
  return missingAccountHash;
}

export function createAuthService(repository, tokenSecret) {
  return {
    async iniciarSessao(input) {
      const email = normalizeEmail(input.email);
      if (typeof input.senha !== "string" || input.senha.length === 0) {
        throw new HttpError(
          400,
          "Informe e-mail e senha.",
          "INVALID_CREDENTIALS",
        );
      }

      const account = await repository.buscarAtletaPorEmail(email);
      const passwordHash =
        account?.hash_senha || (await getMissingAccountHash());
      const passwordMatches = await verifyPassword(input.senha, passwordHash);
      if (!account || !passwordMatches) {
        throw new HttpError(
          401,
          "E-mail ou senha incorretos.",
          "INVALID_CREDENTIALS",
        );
      }

      const accessToken = await createAccessToken(account, tokenSecret);
      return {
        ...accessToken,
        usuario: {
          id: account.id,
          nome_completo: account.nome_completo,
          email: account.email,
          papel: account.papel,
        },
      };
    },
  };
}
