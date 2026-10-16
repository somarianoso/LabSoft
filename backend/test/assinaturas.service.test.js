import assert from "node:assert/strict";
import test from "node:test";
import { createAssinaturasService } from "../src/assinaturas/assinaturas.service.js";

const atletaId = "77777777-7777-4777-8777-777777777777";
const categories = [
  { id: "11111111-1111-4111-8111-111111111111", nome: "Yoga" },
  { id: "22222222-2222-4222-8222-222222222222", nome: "Musculação" },
];

function serviceFor(plan, foundCategories = categories) {
  const repository = {
    buscarPlano: async () => plan,
    buscarCategoriasPorNome: async () => foundCategories,
    criar: async (input) => input,
    buscarAtual: async () => null,
    cancelar: async () => null,
  };
  return createAssinaturasService(repository);
}

test("cria assinatura pendente com o limite exato de categorias", async () => {
  const service = serviceFor({
    id: "33333333-3333-4333-8333-333333333333",
    codigo: "basico",
    nome: "Básico",
    preco_mensal_centavos: 2900,
    limite_categorias: 2,
  });

  const result = await service.criar(atletaId, {
    codigo_plano: "basico",
    metodo_pagamento: "cartao",
    categorias: ["Yoga", "Musculação"],
  });

  assert.equal(result.atletaId, atletaId);
  assert.equal(result.metodoPagamento, "cartao");
  assert.equal(result.categorias.length, 2);
});

test("rejeita quantidade de categorias diferente do plano", async () => {
  const service = serviceFor({
    id: "33333333-3333-4333-8333-333333333333",
    codigo: "basico",
    nome: "Básico",
    preco_mensal_centavos: 2900,
    limite_categorias: 2,
  });

  await assert.rejects(
    service.criar(atletaId, {
      codigo_plano: "basico",
      metodo_pagamento: "cartao",
      categorias: ["Yoga"],
    }),
    { status: 422, code: "INVALID_CATEGORY_SELECTION" },
  );
});

test("rejeita categoria não encontrada e método de pagamento inválido", async () => {
  const plan = {
    id: "33333333-3333-4333-8333-333333333333",
    codigo: "basico",
    nome: "Básico",
    preco_mensal_centavos: 2900,
    limite_categorias: 2,
  };

  await assert.rejects(
    serviceFor(plan, [categories[0]]).criar(atletaId, {
      codigo_plano: "basico",
      metodo_pagamento: "cartao",
      categorias: ["Yoga", "Musculação"],
    }),
    { status: 422, code: "UNKNOWN_CATEGORY" },
  );

  await assert.rejects(
    serviceFor(plan).criar(atletaId, {
      codigo_plano: "basico",
      metodo_pagamento: "dinheiro",
      categorias: ["Yoga", "Musculação"],
    }),
    { status: 400 },
  );
});

test("plano ilimitado não exige lista de categorias", async () => {
  const service = serviceFor({
    id: "33333333-3333-4333-8333-333333333333",
    codigo: "premium",
    nome: "Premium",
    preco_mensal_centavos: 8900,
    limite_categorias: null,
  });

  const result = await service.criar(atletaId, {
    codigo_plano: "premium",
    metodo_pagamento: "pix",
  });

  assert.deepEqual(result.categorias, []);
});
