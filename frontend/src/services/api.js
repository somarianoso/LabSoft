const serviceUrls = {
  auth: import.meta.env.VITE_AUTH_API_URL || (import.meta.env.DEV ? "http://localhost:8001" : ""),
  account: import.meta.env.VITE_ACCOUNT_API_URL || (import.meta.env.DEV ? "http://localhost:8002" : ""),
  creator: import.meta.env.VITE_CREATOR_API_URL || (import.meta.env.DEV ? "http://localhost:8003" : ""),
  catalog: import.meta.env.VITE_CATALOG_API_URL || (import.meta.env.DEV ? "http://localhost:8004" : ""),
};

export const sessionExpiredEvent = "wellflix:sessao-expirada";
const unavailableMessage = "Não foi possível carregar agora. Tente novamente em instantes.";

export async function apiRequest(service, path, { method = "GET", body, token } = {}) {
  const baseUrl = serviceUrls[service];
  if (!baseUrl) {
    console.error(`Endereço não configurado: VITE_${String(service).toUpperCase()}_API_URL`);
    throw new Error(unavailableMessage);
  }

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
    throw new Error("Não foi possível conectar ao WellFlix. Verifique sua internet e tente novamente.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(unavailableMessage);
  }

  if (!response.ok) {
    const code = result?.error?.code;
    if (token && response.status === 401) {
      // Sessão vencida: o App encerra a sessão e pede um novo login.
      window.dispatchEvent(new Event(sessionExpiredEvent));
      throw new Error("Sua sessão expirou. Entre novamente.");
    }
    if (response.status >= 500 || code === "SERVICE_UNAVAILABLE" || code === "UPSTREAM_ERROR") {
      throw new Error(unavailableMessage);
    }
    throw new Error(result?.error?.message || "Não foi possível concluir a solicitação.");
  }
  if (!result || !Object.hasOwn(result, "data")) {
    throw new Error(unavailableMessage);
  }
  return result.data;
}
