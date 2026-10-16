function toVideoRow(row) {
  return {
    id: row.id,
    profissional_id: row.profissional_id,
    profissional_nome: row.profissional_nome ?? null,
    titulo: row.titulo,
    descricao: row.descricao,
    duracao_segundos: Number(row.duracao_segundos),
    url_conteudo: row.url_conteudo,
    situacao: row.situacao,
    data_publicacao: row.data_publicacao,
    data_criacao: row.data_criacao,
    data_atualizacao: row.data_atualizacao,
    categorias: Array.isArray(row.categorias) ? row.categorias : [],
  };
}

export function createVideosRepository(pool) {
  const baseSelect = `
    SELECT
      video.id,
      video.profissional_id,
      usuario.nome_completo AS profissional_nome,
      video.titulo,
      video.descricao,
      video.duracao_segundos,
      video.url_conteudo,
      video.situacao,
      video.data_publicacao,
      video.data_criacao,
      video.data_atualizacao,
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object('id', categoria.id, 'nome', categoria.nome)),
        '[]'::jsonb
      ) AS categorias
    FROM videos AS video
    LEFT JOIN usuarios AS usuario ON usuario.id = video.profissional_id
    LEFT JOIN categorias_video AS relacao ON relacao.video_id = video.id
    LEFT JOIN categorias AS categoria ON categoria.id = relacao.categoria_id
  `;

  return {
    async listarPublicados() {
      const result = await pool.query(
        `${baseSelect}
         WHERE video.situacao = 'publicado'
         GROUP BY video.id, usuario.id
         ORDER BY video.data_publicacao DESC NULLS LAST, video.data_criacao DESC`,
      );

      return result.rows.map(toVideoRow);
    },

    async listarPorProfissional(profissionalId) {
      const result = await pool.query(
        `${baseSelect}
         WHERE video.profissional_id = $1
         GROUP BY video.id, usuario.id
         ORDER BY video.data_atualizacao DESC NULLS LAST, video.data_criacao DESC`,
        [profissionalId],
      );

      return result.rows.map(toVideoRow);
    },

    async buscarPorId(videoId) {
      const result = await pool.query(
        `${baseSelect}
         WHERE video.id = $1
         GROUP BY video.id, usuario.id`,
        [videoId],
      );

      return result.rows[0] ? toVideoRow(result.rows[0]) : null;
    },

    async criar({ profissionalId, titulo, descricao, duracaoSegundos, urlConteudo, situacao }) {
      const result = await pool.query(
        `INSERT INTO videos (
          profissional_id,
          titulo,
          descricao,
          duracao_segundos,
          url_conteudo,
          situacao
        ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, profissional_id, titulo, descricao, duracao_segundos,
                   url_conteudo, situacao, data_publicacao, data_criacao,
                   data_atualizacao`,
        [profissionalId, titulo, descricao, duracaoSegundos, urlConteudo, situacao],
      );

      return result.rows[0];
    },

    async alterar({ videoId, titulo, descricao, duracaoSegundos, urlConteudo, situacao }) {
      const result = await pool.query(
        `UPDATE videos
         SET titulo = COALESCE($2, titulo),
             descricao = COALESCE($3, descricao),
             duracao_segundos = COALESCE($4, duracao_segundos),
             url_conteudo = COALESCE($5, url_conteudo),
             situacao = COALESCE($6, situacao),
             data_publicacao = CASE
               WHEN $6 IS NOT NULL AND $6 = 'publicado' AND data_publicacao IS NULL THEN now()
               WHEN $6 IS NOT NULL AND $6 <> 'publicado' THEN NULL
               ELSE data_publicacao
             END,
             data_atualizacao = now()
         WHERE id = $1
         RETURNING id, profissional_id, titulo, descricao, duracao_segundos,
                   url_conteudo, situacao, data_publicacao, data_criacao,
                   data_atualizacao`,
        [videoId, titulo, descricao, duracaoSegundos, urlConteudo, situacao],
      );

      return result.rows[0] || null;
    },

    async definirCategorias(videoId, categoriaIds) {
      const uniqueCategorias = [...new Set(categoriaIds)];
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query(
          "DELETE FROM categorias_video WHERE video_id = $1",
          [videoId],
        );

        if (uniqueCategorias.length > 0) {
          const placeholders = uniqueCategorias
            .map((_, index) => `($1, $${index + 2})`)
            .join(", ");

          await client.query(
            `INSERT INTO categorias_video (video_id, categoria_id)
             VALUES ${placeholders}`,
            [videoId, ...uniqueCategorias],
          );
        }

        await client.query("COMMIT");
        return uniqueCategorias;
      } catch (error) {
        await client.query("ROLLBACK").catch((rollbackError) => {
          console.error("Falha ao reverter categorias do vídeo.", rollbackError);
        });
        throw error;
      } finally {
        client.release();
      }
    },

    async registrarRevisao({ videoId, moderadorId, situacao, observacao }) {
      const result = await pool.query(
        `INSERT INTO revisoes_video (video_id, moderador_id, situacao, observacao)
         VALUES ($1, $2, $3, $4)
         RETURNING id, video_id, moderador_id, situacao, observacao, data_criacao`,
        [videoId, moderadorId, situacao, observacao],
      );

      return result.rows[0];
    },
  };
}
