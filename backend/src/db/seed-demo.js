import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPool } from "./pool.js";

if (!process.argv.includes("--confirm-demo-database")) {
  console.error(
    "Este comando grava dados fictícios no banco configurado. " +
      "Revise DATABASE_URL e confirme usando --confirm-demo-database.",
  );
  process.exit(1);
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const seedPath = join(currentDirectory, "seeds", "demo.sql");
const seedSql = await readFile(seedPath, "utf8");
const pool = createPool();

try {
  await pool.query(seedSql);
  console.info("Dados fictícios de demonstração inseridos/atualizados com sucesso.");
} catch (error) {
  console.error("Não foi possível inserir os dados de demonstração.", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
