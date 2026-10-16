import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPool } from "./pool.js";

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), "migrations");
const pool = createPool();

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wellflix_schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of migrationFiles) {
    const client = await pool.connect();

    try {
      await client.query("SELECT pg_advisory_lock(hashtext($1))", [
        "wellflix_schema_migrations",
      ]);
      const alreadyApplied = await client.query(
        "SELECT id FROM wellflix_schema_migrations WHERE id = $1",
        [fileName],
      );

      if (alreadyApplied.rowCount > 0) {
        continue;
      }

      const sql = await readFile(join(migrationsDirectory, fileName), "utf8");
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO wellflix_schema_migrations (id) VALUES ($1)",
        [fileName],
      );
      await client.query("COMMIT");
      console.info(`Migração aplicada: ${fileName}`);
    } catch (error) {
      await client.query("ROLLBACK").catch((rollbackError) => {
        console.error(`Falha ao reverter ${fileName}.`, rollbackError);
      });
      throw new Error(`Falha ao aplicar a migração ${fileName}.`, {
        cause: error,
      });
    } finally {
      await client
        .query("SELECT pg_advisory_unlock(hashtext($1))", [
          "wellflix_schema_migrations",
        ])
        .catch((unlockError) => {
          console.error("Não foi possível liberar o lock de migrations.", unlockError);
        });
      client.release();
    }
  }
} catch (error) {
  console.error(error.message, error.cause || "");
  process.exitCode = 1;
} finally {
  await pool.end();
}
