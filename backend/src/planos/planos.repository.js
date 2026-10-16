export function createPlanosRepository(pool) {
  return {
    async listarAtivos() {
      const result = await pool.query(
        `SELECT id, codigo, nome, descricao, preco_mensal_centavos,
                limite_categorias
         FROM planos
         WHERE ativo = TRUE
         ORDER BY preco_mensal_centavos`,
      );
      return result.rows;
    },

    async buscarPorCodigo(codigo) {
      const result = await pool.query(
        `SELECT id, codigo, nome, preco_mensal_centavos, limite_categorias
         FROM planos
         WHERE codigo = $1 AND ativo = TRUE`,
        [codigo],
      );
      return result.rows[0] || null;
    },
  };
}
