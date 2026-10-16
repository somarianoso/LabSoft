import assert from "node:assert/strict";
import test from "node:test";
import { createAuthService } from "../src/auth/auth.service.js";
import { hashPassword } from "../src/shared/password.js";
import { verifyAccessToken } from "../src/shared/tokens.js";

const tokenSecret = "wellflix-test-secret-with-at-least-32-bytes";

test("autentica atleta e emite token com identidade e expiração", async () => {
  const account = {
    id: "77777777-7777-4777-8777-777777777777",
    nome_completo: "Ana Silva",
    email: "ana@example.com",
    papel: "atleta",
    hash_senha: await hashPassword("Senha123!"),
  };
  const service = createAuthService(
    { buscarAtletaPorEmail: async () => account },
    tokenSecret,
  );

  const session = await service.iniciarSessao({
    email: "ANA@EXAMPLE.COM",
    senha: "Senha123!",
  });
  const payload = await verifyAccessToken(session.access_token, tokenSecret);

  assert.equal(session.token_type, "Bearer");
  assert.equal(session.expires_in, 900);
  assert.equal(payload.sub, account.id);
  assert.equal(payload.papel, "atleta");
  assert.equal("hash_senha" in session.usuario, false);
});

test("credenciais incorretas não revelam se a conta existe", async () => {
  const service = createAuthService(
    { buscarAtletaPorEmail: async () => null },
    tokenSecret,
  );

  await assert.rejects(
    service.iniciarSessao({ email: "ana@example.com", senha: "Senha123!" }),
    { status: 401, code: "INVALID_CREDENTIALS" },
  );
});

test("senha incorreta retorna o mesmo erro genérico de autenticação", async () => {
  const service = createAuthService(
    {
      buscarAtletaPorEmail: async () => ({
        id: "77777777-7777-4777-8777-777777777777",
        hash_senha: await hashPassword("Senha123!"),
      }),
    },
    tokenSecret,
  );

  await assert.rejects(
    service.iniciarSessao({ email: "ana@example.com", senha: "outra-senha" }),
    { status: 401, code: "INVALID_CREDENTIALS" },
  );
});
