import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

async function withServer(app, run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("health and plans are public while account endpoints require auth setup", async () => {
  const app = createApp({ pool: { query: async () => ({ rows: [] }) } });

  await withServer(app, async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { data: { status: "ok" } });

    const plans = await fetch(`${baseUrl}/api/planos`);
    assert.equal(plans.status, 200);
    assert.deepEqual(await plans.json(), { data: [] });

    const subscriptions = await fetch(`${baseUrl}/api/assinaturas/atual`);
    assert.equal(subscriptions.status, 503);
    assert.equal(
      (await subscriptions.json()).error.code,
      "AUTHENTICATION_NOT_CONFIGURED",
    );

    const trails = await fetch(`${baseUrl}/api/trilhas`);
    assert.equal(trails.status, 503);
  });
});

test("trail ownership is derived from authenticated context, not the request", async () => {
  const atletaId = "77777777-7777-4777-8777-777777777777";
  let queriedAtletaId;
  const app = createApp({
    pool: {
      query: async (_query, values) => {
        queriedAtletaId = values[0];
        return { rows: [] };
      },
    },
    authenticateUser: (request, response, next) => {
      request.auth = { usuarioId: atletaId };
      next();
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/trilhas?atleta_id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
    );
    assert.equal(response.status, 200);
    assert.equal(queriedAtletaId, atletaId);
  });
});
