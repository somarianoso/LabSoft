import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let server, PaymentFields, Trails, services;
const athlete = { name: "Atleta", roles: ["atleta"] };
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL("..", import.meta.url)), server: { middlewareMode: true }, appType: "custom" });
  PaymentFields = (await server.ssrLoadModule("/src/components/PaymentFields.jsx")).default;
  Trails = (await server.ssrLoadModule("/src/pages/Trails.jsx")).default;
  services = await server.ssrLoadModule("/src/services/wellflix.js");
  globalThis.window = { location: { search: "" } };
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  await server?.close();
});

test("campos obrigatórios correspondem a cada método de pagamento", () => {
  for (const method of ["cartao", "pix", "boleto"]) {
    const html = renderToStaticMarkup(React.createElement(PaymentFields, { method }));
    const ids = method === "cartao" ? ["payment-name", "card-number", "card-expiry", "card-cvv"] : ["payment-name", "payment-cpf", "payment-email"];
    for (const id of ids) assert.match(html, new RegExp(`id="${id}"[^>]*required`));
    assert.equal(html.includes('id="billing-address"'), method === "boleto");
    assert.equal(html.includes('id="card-number"'), method === "cartao");
    assert.match(html, /não serão enviados nem armazenados/);
  }
});

test("trilha própria oferece exclusão e remoção individual sem aninhar botões", () => {
  const video = Object.assign(["Mobilidade", "Yoga", "5 min", "/image.jpg"], { id: "video-1" });
  const html = renderToStaticMarkup(React.createElement(Trails, { user: athlete, customTrails: [{ id: "trail-1", name: "Semana", videos: [video] }] }));
  assert.match(html, /aria-label="Excluir trilha Semana"/);
  assert.match(html, /aria-label="Remover Mobilidade da trilha Semana"/);
  assert.doesNotMatch(html, /<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/);
});

test("trilha vazia permite exclusão e desabilita compartilhamento", () => {
  const html = renderToStaticMarkup(React.createElement(Trails, { user: athlete, customTrails: [{ id: "trail-1", name: "Semana", videos: [] }] }));
  assert.match(html, /Esta trilha está vazia/);
  assert.match(html, /disabled=""[^>]*>[\s\S]*?Compartilhar/);
  assert.match(html, /aria-label="Excluir trilha Semana"/);
});

test("falha de carregamento não é apresentada como lista vazia", () => {
  const html = renderToStaticMarkup(React.createElement(Trails, { user: athlete, trailsError: "API indisponível" }));
  assert.match(html, /role="alert"/);
  assert.match(html, /API indisponível/);
  assert.doesNotMatch(html, /Você ainda não criou trilhas/);
});

test("trilhas pedem login de atleta antes de carregar", () => {
  const anonymous = renderToStaticMarkup(React.createElement(Trails, { go: () => {} }));
  assert.match(anonymous, /Entre na sua conta de atleta/);
  const professional = renderToStaticMarkup(React.createElement(Trails, { user: { roles: ["profissional"] } }));
  assert.match(professional, /As trilhas são para contas de atleta/);
});

test("remoções usam DELETE autenticado e propagam falhas da API", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, ...options }); return { ok: true, json: async () => ({ data: {} }) }; };
  await services.deleteTrail("trail-1", "test-token");
  await services.removeTrailVideo("trail-1", "video-1", "test-token");
  assert.ok(calls[0].url.endsWith("/api/trilhas/trail-1"));
  assert.ok(calls[1].url.endsWith("/api/trilhas/trail-1/videos/video-1"));
  for (const call of calls) { assert.equal(call.method, "DELETE"); assert.equal(call.headers.Authorization, "Bearer test-token"); }
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { message: "Trilha não encontrada." } }) });
  await assert.rejects(services.deleteTrail("trail-1", "test-token"), /Trilha não encontrada/);
});
