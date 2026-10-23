const serviceUrls = {
  auth: import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8001" : ""),
  account: import.meta.env.VITE_ACCOUNT_API_URL || (import.meta.env.DEV ? "http://localhost:8002" : ""),
  creator: import.meta.env.VITE_CREATOR_API_URL || (import.meta.env.DEV ? "http://localhost:8003" : ""),
  catalog: import.meta.env.VITE_CATALOG_API_URL || (import.meta.env.DEV ? "http://localhost:8004" : ""),
};

export async function apiRequest(service, path, { method = "GET", body, token } = {}) {
  const baseUrl = serviceUrls[service];
  if (!Object.hasOwn(serviceUrls, service)) throw new Error(`Serviço de API desconhecido: ${service}`);
  if (!baseUrl) throw new Error(`Configure a variável VITE_${service.toUpperCase()}_API_URL no Render.`);

  let response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error("Não foi possível conectar à API do WellFlix.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("A API do WellFlix retornou uma resposta inválida.");
  }

  if (!response.ok) {
    throw new Error(result?.error?.message || "Não foi possível concluir a solicitação.");
  }
  if (!result || !Object.hasOwn(result, "data")) {
    throw new Error("A API do WellFlix retornou uma resposta inválida.");
  }
  return result.data;
}
