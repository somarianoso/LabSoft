import { HttpError } from "../shared/http-error.js";
import { requireUuid } from "../shared/validation.js";

const paymentMethods = new Set(["cartao", "pix", "boleto"]);

export function createAssinaturasService(repository) {
  return {
    async criar(atletaId, input) {
      if (
        !input ||
        typeof input.codigo_plano !== "string" ||
        input.codigo_plano.trim().length === 0
      ) {
        throw new HttpError(400, "Informe um código de plano válido.");
      }

      const metodoPagamento = input.metodo_pagamento;
      if (!paymentMethods.has(metodoPagamento)) {
        throw new HttpError(
          400,
          "O método de pagamento deve ser cartao, pix ou boleto.",
        );
      }

      const categorias = input.categorias ?? [];
      if (
        !Array.isArray(categorias) ||
        categorias.some(
          (categoria) =>
            typeof categoria !== "string" || categoria.trim().length === 0,
        )
      ) {
        throw new HttpError(400, "Categorias deve ser uma lista de nomes.");
      }

      const nomesCategorias = categorias.map((categoria) => categoria.trim());
      if (new Set(nomesCategorias).size !== nomesCategorias.length) {
        throw new HttpError(400, "Não repita categorias na assinatura.");
      }

      const plano = await repository.buscarPlano(input.codigo_plano.trim());
      if (!plano) {
        throw new HttpError(404, "O plano informado não existe ou está inativo.");
      }

      if (
        plano.limite_categorias !== null &&
        nomesCategorias.length !== plano.limite_categorias
      ) {
        throw new HttpError(
          422,
          `O plano ${plano.nome} exige exatamente ${plano.limite_categorias} categorias.`,
          "INVALID_CATEGORY_SELECTION",
        );
      }

      const categoriasEncontradas =
        nomesCategorias.length > 0
          ? await repository.buscarCategoriasPorNome(nomesCategorias)
          : [];
      if (categoriasEncontradas.length !== nomesCategorias.length) {
        throw new HttpError(
          422,
          "Uma ou mais categorias informadas não estão disponíveis.",
          "UNKNOWN_CATEGORY",
        );
      }

      return repository.criar({
        atletaId: requireUuid(atletaId, "usuarioId"),
        plano,
        categorias: categoriasEncontradas,
        metodoPagamento,
      });
    },

    atual: (atletaId) =>
      repository.buscarAtual(requireUuid(atletaId, "usuarioId")),

    async cancelar(atletaId, assinaturaId) {
      const id = requireUuid(assinaturaId, "assinaturaId");
      const canceled = await repository.cancelar(
        requireUuid(atletaId, "usuarioId"),
        id,
      );
      if (!canceled) {
        throw new HttpError(
          404,
          "Assinatura ativa ou pendente não encontrada para esta conta.",
          "SUBSCRIPTION_NOT_FOUND",
        );
      }
      return canceled;
    },
  };
}
