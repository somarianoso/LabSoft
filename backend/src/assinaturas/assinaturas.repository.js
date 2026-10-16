export function createAssinaturasRepository(pool) {
  return {
    async buscarPlano(codigo) {
      const result = await pool.query(
        `SELECT id, codigo, nome, preco_mensal_centavos, limite_categorias
         FROM planos
         WHERE codigo = $1 AND ativo = TRUE`,
        [codigo],
      );
      return result.rows[0] || null;
    },

    async buscarCategoriasPorNome(nomes) {
      const result = await pool.query(
        `SELECT id, nome
         FROM categorias
         WHERE nome = ANY($1::text[])`,
        [nomes],
      );
      return result.rows;
    },

    async criar({ atletaId, plano, categorias, metodoPagamento }) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const subscription = await client.query(
          `INSERT INTO assinaturas
             (atleta_id, plano_id, metodo_pagamento, situacao)
           VALUES ($1, $2, $3, 'pendente_pagamento')
             RETURNING id, plano_id, metodo_pagamento, situacao,
                     data_inicio, data_vencimento, data_criacao`,
          [atletaId, plano.id, metodoPagamento],
        );

        if (categorias.length > 0) {
          await client.query(
            `INSERT INTO categorias_assinatura (assinatura_id, categoria_id)
             SELECT $1, categoria.id
             FROM categorias AS categoria
             WHERE categoria.id = ANY($2::uuid[])`,
            [subscription.rows[0].id, categorias.map(({ id }) => id)],
          );
        }

        await client.query("COMMIT");
        return {
          ...subscription.rows[0],
          plano: {
            codigo: plano.codigo,
            nome: plano.nome,
            preco_mensal_centavos: plano.preco_mensal_centavos,
          },
          categorias: categorias.map(({ id, nome }) => ({ id, nome })),
        };
      } catch (error) {
        await client.query("ROLLBACK").catch((rollbackError) => {
          console.error(
            "Falha ao reverter criação de assinatura.",
            rollbackError,
          );
        });
        throw error;
      } finally {
        client.release();
      }
    },

    async buscarAtual(atletaId) {
      const result = await pool.query(
        `SELECT assinatura.id, assinatura.situacao,
                assinatura.metodo_pagamento, assinatura.data_inicio,
                assinatura.data_vencimento, assinatura.data_criacao,
                plano.codigo AS plano_codigo, plano.nome AS plano_nome,
                plano.preco_mensal_centavos,
                COALESCE(
                  array_agg(categoria.nome)
                    FILTER (WHERE categoria.id IS NOT NULL),
                  ARRAY[]::text[]
                ) AS categorias
         FROM assinaturas AS assinatura
         JOIN planos AS plano ON plano.id = assinatura.plano_id
         LEFT JOIN categorias_assinatura AS vinculo
           ON vinculo.assinatura_id = assinatura.id
         LEFT JOIN categorias AS categoria ON categoria.id = vinculo.categoria_id
         WHERE assinatura.atleta_id = $1
           AND assinatura.situacao IN ('ativa', 'pendente_pagamento')
         GROUP BY assinatura.id, plano.id
         ORDER BY assinatura.data_criacao DESC
         LIMIT 1`,
        [atletaId],
      );
      return result.rows[0] || null;
    },

    async cancelar(atletaId, assinaturaId) {
      const result = await pool.query(
        `UPDATE assinaturas
         SET situacao = 'cancelada',
             data_vencimento = COALESCE(data_vencimento, now()),
             data_atualizacao = now()
         WHERE id = $1 AND atleta_id = $2
           AND situacao IN ('ativa', 'pendente_pagamento')
         RETURNING id, situacao, data_vencimento, data_atualizacao`,
        [assinaturaId, atletaId],
      );
      return result.rows[0] || null;
    },
  };
}
