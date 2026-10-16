export function createAuthRepository(pool) {
  return {
    async buscarAtletaPorEmail(email) {
      const result = await pool.query(
        `SELECT usuario.id, usuario.nome_completo, usuario.email,
                usuario.hash_senha, papel.papel
         FROM usuarios AS usuario
         JOIN papeis_usuario AS papel ON papel.usuario_id = usuario.id
         JOIN atletas AS atleta ON atleta.usuario_id = usuario.id
         WHERE lower(usuario.email) = $1 AND papel.papel = 'atleta'
         LIMIT 1`,
        [email],
      );
      return result.rows[0] || null;
    },
  };
}
