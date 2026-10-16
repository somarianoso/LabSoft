export function createAtletasRepository(pool) {
  return {
    async criar({ nomeCompleto, cpf, email, hashSenha }) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const user = await client.query(
          `INSERT INTO usuarios (nome_completo, cpf, email, hash_senha)
           VALUES ($1, $2, $3, $4)
           RETURNING id, nome_completo, email, data_criacao`,
          [nomeCompleto, cpf, email, hashSenha],
        );
        const usuarioId = user.rows[0].id;

        await client.query(
          `INSERT INTO papeis_usuario (usuario_id, papel)
           VALUES ($1, 'atleta')`,
          [usuarioId],
        );
        await client.query(
          `INSERT INTO atletas (usuario_id) VALUES ($1)`,
          [usuarioId],
        );
        await client.query("COMMIT");
        return user.rows[0];
      } catch (error) {
        await client.query("ROLLBACK").catch((rollbackError) => {
          console.error("Falha ao reverter cadastro de atleta.", rollbackError);
        });
        throw error;
      } finally {
        client.release();
      }
    },

    async buscarPerfil(usuarioId) {
      const result = await pool.query(
        `SELECT usuario.id, usuario.nome_completo, usuario.email,
                usuario.data_criacao
         FROM atletas AS atleta
         JOIN usuarios AS usuario ON usuario.id = atleta.usuario_id
         WHERE atleta.usuario_id = $1`,
        [usuarioId],
      );
      return result.rows[0] || null;
    },
  };
}
