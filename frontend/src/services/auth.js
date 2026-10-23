import { apiRequest } from "./api.js";

export function registerAthlete({ name, cpf, email, password }) {
  return apiRequest("auth", "/api/atletas", {
    method: "POST",
    body: {
      nome_completo: name,
      cpf,
      email,
      senha: password,
    },
  });
}

export function loginAthlete({ email, password, role = "atleta" }) {
  return apiRequest("auth", "/api/auth/sessao", {
    method: "POST",
    body: { email, senha: password, papel: role },
  });
}
