const apiBaseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

async function post(path, body) {
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    throw new Error(
      result?.error?.message || "Não foi possível concluir a solicitação.",
    );
  }
  if (!result || !Object.hasOwn(result, "data")) {
    throw new Error("A API do WellFlix retornou uma resposta inválida.");
  }

  return result.data;
}

export function registerAthlete({ name, cpf, email, password }) {
  return post("/api/atletas", {
    nome_completo: name,
    cpf,
    email,
    senha: password,
  });
}

export function loginAthlete({ email, password }) {
  return post("/api/auth/sessao", { email, senha: password });
}
