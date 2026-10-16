import pg from "pg";

const { Pool } = pg;

export function createPool(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("A variável DATABASE_URL é obrigatória para iniciar a API.");
  }

  return new Pool({ connectionString: databaseUrl });
}
