import "dotenv/config";
import { createApp } from "./app.js";
import { createPool } from "./db/pool.js";

const pool = createPool();
const port = Number.parseInt(process.env.PORT || "3001", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT deve ser um número entre 1 e 65535.");
}

const app = createApp({ pool });
const server = app.listen(port, () => {
  console.info(`API WellFlix disponível na porta ${port}.`);
});

const close = async () => {
  server.close(async (error) => {
    if (error) {
      console.error("Falha ao encerrar o servidor HTTP.", error);
      process.exitCode = 1;
    }
    await pool.end();
  });
};

process.on("SIGINT", close);
process.on("SIGTERM", close);
