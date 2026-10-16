export function createTrilhasRepository(pool) {
  return {
    async listarDoAtleta(atletaId) {
      const result = await pool.query(
        `SELECT trilha.id, trilha.nome, trilha.privacidade,
                trilha.data_criacao, trilha.data_atualizacao,
                COUNT(video_trilha.video_id)::integer AS quantidade_videos,
                COUNT(progresso.video_id)
                  FILTER (WHERE progresso.concluido)::integer
                  AS videos_concluidos
         FROM trilhas AS trilha
         LEFT JOIN videos_trilha AS video_trilha
           ON video_trilha.trilha_id = trilha.id
         LEFT JOIN progresso_trilha AS progresso
           ON progresso.trilha_id = video_trilha.trilha_id
          AND progresso.video_id = video_trilha.video_id
         WHERE trilha.atleta_id = $1
         GROUP BY trilha.id
         ORDER BY trilha.data_atualizacao DESC NULLS LAST, trilha.data_criacao DESC`,
        [atletaId],
      );
      return result.rows;
    },

    async criar({ atletaId, nome, privacidade }) {
      const result = await pool.query(
        `INSERT INTO trilhas (atleta_id, nome, privacidade)
         VALUES ($1, $2, $3)
         RETURNING id, nome, privacidade, data_criacao, data_atualizacao`,
        [atletaId, nome, privacidade],
      );
      return result.rows[0];
    },

    async buscarPorId(trilhaId) {
      const result = await pool.query(
        `SELECT id, atleta_id, nome, privacidade, data_criacao,
                data_atualizacao
         FROM trilhas
         WHERE id = $1`,
        [trilhaId],
      );
      return result.rows[0] || null;
    },

    async listarVideos(trilhaId) {
      const result = await pool.query(
        `SELECT video_trilha.video_id, video_trilha.ordem,
                COALESCE(progresso.segundos_assistidos, 0)
                  AS segundos_assistidos,
                COALESCE(progresso.concluido, FALSE) AS concluido
         FROM videos_trilha AS video_trilha
         LEFT JOIN progresso_trilha AS progresso
           ON progresso.trilha_id = video_trilha.trilha_id
          AND progresso.video_id = video_trilha.video_id
         WHERE video_trilha.trilha_id = $1
         ORDER BY video_trilha.ordem`,
        [trilhaId],
      );
      return result.rows;
    },

    async alterar({ atletaId, trilhaId, nome, privacidade }) {
      const result = await pool.query(
        `UPDATE trilhas
         SET nome = COALESCE($3, nome),
             privacidade = COALESCE($4, privacidade),
             data_atualizacao = now()
         WHERE id = $1 AND atleta_id = $2
         RETURNING id, atleta_id, nome, privacidade, data_criacao,
                   data_atualizacao`,
        [trilhaId, atletaId, nome, privacidade],
      );
      return result.rows[0] || null;
    },

    async adicionarVideo({ atletaId, trilhaId, videoId }) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const trail = await client.query(
          "SELECT id FROM trilhas WHERE id = $1 AND atleta_id = $2 FOR UPDATE",
          [trilhaId, atletaId],
        );
        if (trail.rowCount === 0) {
          await client.query("ROLLBACK");
          return null;
        }

        const nextOrder = await client.query(
          `SELECT COALESCE(MAX(ordem), 0) + 1 AS ordem
           FROM videos_trilha WHERE trilha_id = $1`,
          [trilhaId],
        );
        await client.query(
          `INSERT INTO videos_trilha (trilha_id, video_id, ordem)
           VALUES ($1, $2, $3)`,
          [trilhaId, videoId, nextOrder.rows[0].ordem],
        );
        await client.query(
          "UPDATE trilhas SET data_atualizacao = now() WHERE id = $1",
          [trilhaId],
        );
        await client.query("COMMIT");
        return {
          trilha_id: trilhaId,
          video_id: videoId,
          ordem: nextOrder.rows[0].ordem,
        };
      } catch (error) {
        await client.query("ROLLBACK").catch((rollbackError) => {
          console.error("Falha ao reverter inclusão de vídeo na trilha.", rollbackError);
        });
        throw error;
      } finally {
        client.release();
      }
    },

    async removerVideo({ atletaId, trilhaId, videoId }) {
      const result = await pool.query(
        `WITH removido AS (
           DELETE FROM videos_trilha AS video_trilha
           USING trilhas AS trilha
           WHERE video_trilha.trilha_id = trilha.id
             AND video_trilha.trilha_id = $1
             AND video_trilha.video_id = $3
             AND trilha.atleta_id = $2
           RETURNING video_trilha.trilha_id, video_trilha.video_id
         ),
         trilha_atualizada AS (
           UPDATE trilhas
           SET data_atualizacao = now()
           WHERE id IN (SELECT trilha_id FROM removido)
           RETURNING id
         )
         SELECT removido.video_id
         FROM removido
         JOIN trilha_atualizada ON trilha_atualizada.id = removido.trilha_id`,
        [trilhaId, atletaId, videoId],
      );
      return result.rows[0] || null;
    },

    async atualizarProgresso({
      atletaId,
      trilhaId,
      videoId,
      segundos,
      concluido,
    }) {
      const result = await pool.query(
        `INSERT INTO progresso_trilha
           (trilha_id, video_id, segundos_assistidos, concluido)
         SELECT $1, video_trilha.video_id, $4, $5
         FROM videos_trilha AS video_trilha
         JOIN trilhas AS trilha ON trilha.id = video_trilha.trilha_id
         WHERE trilha.id = $1 AND trilha.atleta_id = $2
           AND video_trilha.video_id = $3
         ON CONFLICT (trilha_id, video_id) DO UPDATE
         SET segundos_assistidos = EXCLUDED.segundos_assistidos,
             concluido = EXCLUDED.concluido,
             data_atualizacao = now()
         RETURNING trilha_id, video_id, segundos_assistidos, concluido,
                   data_atualizacao`,
        [trilhaId, atletaId, videoId, segundos, concluido],
      );
      return result.rows[0] || null;
    },
  };
}
