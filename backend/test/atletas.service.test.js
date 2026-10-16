import assert from "node:assert/strict";
import test from "node:test";
import { createAtletasService } from "../src/atletas/atletas.service.js";

const usuarioId = "77777777-7777-4777-8777-777777777777";
const input = {
  nome_completo: " Ana Silva ",
  cpf: "123.456.789-09",
  email: "ANA@EXAMPLE.COM",
  senha: "Senha123!",
};

function serviceFor(overrides = {}) {
  const calls = [];
  const service = createAtletasService(
    {
      criar: async (account) => {
        calls.push(account);
        return { id: usuarioId, nome_completo: account.nomeCompleto };
      },
      buscarPerfil: async () => ({
        id: usuarioId,
        nome_completo: "Ana Silva",
      }),
      ...overrides,
    },
    async () => "senha-hash",
  );
  return { service, calls };
}

test("registra atleta com dados normalizados e senha protegida", async () => {
  const { service, calls } = serviceFor();
  const result = await service.registrar(input);

  assert.deepEqual(result, { id: usuarioId, nome_completo: "Ana Silva" });
  assert.deepEqual(calls, [
    {
      nomeCompleto: "Ana Silva",
      cpf: "12345678909",
      email: "ana@example.com",
      hashSenha: "senha-hash",
    },
  ]);
});

test("rejeita CPF inválido e senha fora dos limites", async () => {
  const { service } = serviceFor();

  await assert.rejects(
    service.registrar({ ...input, cpf: "111.111.111-11" }),
    { status: 400, code: "INVALID_CPF" },
  );
  await assert.rejects(
    service.registrar({ ...input, cpf: "abc12345678909" }),
    { status: 400, code: "INVALID_CPF" },
  );
  await assert.rejects(
    service.registrar({ ...input, senha: "curta" }),
    { status: 400, code: "INVALID_PASSWORD" },
  );
});

test("consulta somente o perfil do usuário autenticado", async () => {
  let queriedId;
  const { service } = serviceFor({
    buscarPerfil: async (id) => {
      queriedId = id;
      return { id, nome_completo: "Ana Silva" };
    },
  });

  const profile = await service.perfil(usuarioId);
  assert.equal(profile.id, usuarioId);
  assert.equal(queriedId, usuarioId);
  await assert.rejects(service.perfil("not-a-uuid"), { status: 400 });
});
