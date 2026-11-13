"""Demonstração da integração entre os quatro microsserviços do WellFlix.

Executa, só pelas APIs públicas, um fluxo que atravessa todos os serviços e
só funciona se a comunicação por eventos (Kafka) e por REST estiver ativa:

  1. Cadastro de atleta (identidade)  -> evento usuario.atualizado -> réplicas em conta, catálogo e profissionais
  2. Moderador cria categoria (catálogo) -> evento categoria.atualizada -> réplicas em conta e profissionais
  3. Profissional se autoriza na categoria (profissionais valida pela réplica) -> evento perfil.atualizado -> catálogo
  4. Profissional envia vídeo nessa categoria (catálogo valida pela réplica do perfil)
  5. Moderador vê a fila e aprova (profissionais -> REST -> catálogo) -> evento video.atualizado -> conta
  6. Atleta põe o vídeo numa trilha (conta valida pela réplica de vídeos)
  7. /status de cada serviço: eventos publicados/consumidos e heartbeats recebidos

Cada passo envia um X-Request-ID próprio (demo-1, demo-2...). Procure esse id
em logs/*.log para seguir a ação de um serviço a outro.

Uso: python scripts/demo_integracao.py   (serviços em localhost:8001-8004)
URLs diferentes: WELLFLIX_IDENTIDADE_URL, WELLFLIX_CONTA_URL,
WELLFLIX_PROFISSIONAIS_URL, WELLFLIX_CATALOGO_URL.
"""

import os
import random
import sys
import time
import uuid

import httpx

URLS = {
    "identidade": os.getenv("WELLFLIX_IDENTIDADE_URL", "http://localhost:8001"),
    "conta": os.getenv("WELLFLIX_CONTA_URL", "http://localhost:8002"),
    "profissionais": os.getenv("WELLFLIX_PROFISSIONAIS_URL", "http://localhost:8003"),
    "catalogo": os.getenv("WELLFLIX_CATALOGO_URL", "http://localhost:8004"),
}
SENHA_DEMO = "WellflixDemo123!"
http = httpx.Client(timeout=60)
passo_atual = "demo-0"


def chamar(servico: str, metodo: str, caminho: str, token: str | None = None, **kwargs):
    headers = {"X-Request-ID": passo_atual}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resposta = http.request(metodo, URLS[servico] + caminho, headers=headers, **kwargs)
    return resposta.status_code, (resposta.json() if resposta.content else {})


def esperar(descricao: str, tentativa, segundos: float = 20.0):
    """Repete ``tentativa`` até dar certo: a réplica é atualizada de forma assíncrona."""
    inicio = time.monotonic()
    while True:
        status, corpo = tentativa()
        if 200 <= status < 300:
            print(f"   ok: {descricao} ({time.monotonic() - inicio:.1f} s após o evento) -> HTTP {status}")
            return corpo["data"]
        if time.monotonic() - inicio > segundos:
            print(f"   FALHOU: {descricao}: HTTP {status} {corpo}")
            sys.exit(1)
        time.sleep(0.3)


def passo(numero: int, titulo: str) -> None:
    global passo_atual
    passo_atual = f"demo-{numero}-{uuid.uuid4().hex[:6]}"
    print(f"\n[{numero}] {titulo}  (X-Request-ID: {passo_atual})")


def login(email: str, papel: str) -> str:
    status, corpo = chamar("identidade", "POST", "/api/auth/sessao", json={"email": email, "senha": SENHA_DEMO, "papel": papel})
    if status != 200:
        print(f"   FALHOU: login de {email} como {papel}: HTTP {status} {corpo}")
        sys.exit(1)
    return corpo["data"]["access_token"]


def main() -> None:
    sufixo = uuid.uuid4().hex[:6]

    passo(1, "Cadastro de atleta na identidade")
    cpf = "".join(random.choice("0123456789") for _ in range(11))
    email_atleta = f"atleta.{sufixo}@wellflix.test"
    status, corpo = chamar("identidade", "POST", "/api/atletas", json={
        "nome_completo": f"Atleta Integração {sufixo}", "cpf": cpf, "email": email_atleta, "senha": SENHA_DEMO,
    })
    print(f"   identidade respondeu HTTP {status}; id = {corpo.get('data', {}).get('id')}")
    token_atleta = login(email_atleta, "atleta")

    passo(2, "Moderador cria categoria no catálogo")
    token_moderador = login("moderador.demo@wellflix.test", "moderador")
    status, corpo = chamar("catalogo", "POST", "/api/categorias", token_moderador, json={"nome": f"Integração {sufixo}"})
    categoria = corpo["data"]
    print(f"   catálogo respondeu HTTP {status}; categoria {categoria['nome']} ({categoria['id']})")

    passo(3, "Profissional se autoriza na nova categoria (profissionais usa a réplica de categorias)")
    token_prof = login("lara.demo@wellflix.test", "profissional")
    status, corpo = chamar("profissionais", "GET", "/api/profissionais/me", token_prof)  # chama a identidade por REST
    perfil = corpo["data"]
    categorias = [c["id"] for c in perfil["categorias"]] + [categoria["id"]]
    esperar("profissionais aceitou a categoria criada no catálogo", lambda: chamar(
        "profissionais", "PUT", "/api/profissionais/me", token_prof,
        json={"especialidade": perfil["especialidade"], "biografia": perfil["biografia"], "categorias": categorias}))

    passo(4, "Profissional envia vídeo na categoria (catálogo usa a réplica do perfil profissional)")
    video = esperar("catálogo aceitou o vídeo na categoria autorizada", lambda: chamar(
        "catalogo", "POST", "/api/videos", token_prof, json={
            "titulo": f"Treino de integração {sufixo}", "descricao": "Vídeo da demonstração de integração.",
            "duracao_segundos": 300, "url_conteudo": "https://example.com/videos/integracao.mp4",
            "categorias": [categoria["id"]],
        }))
    print(f"   vídeo {video['id']} em situação {video['situacao']}")

    passo(5, "Moderador consulta a fila e aprova (profissionais -> REST -> catálogo)")
    status, corpo = chamar("profissionais", "GET", "/api/moderacao/videos", token_moderador)
    na_fila = any(v["id"] == video["id"] for v in corpo["data"])
    print(f"   fila de moderação (vinda do catálogo): HTTP {status}, vídeo na fila: {na_fila}")
    status, corpo = chamar("profissionais", "POST", f"/api/moderacao/videos/{video['id']}/decisao", token_moderador,
                           json={"situacao": "aprovado", "observacao": "Aprovado na demonstração de integração."})
    print(f"   decisão: HTTP {status}; vídeo agora {corpo['data']['video']['situacao']}")

    passo(6, "Atleta coloca o vídeo aprovado numa trilha (conta usa a réplica de vídeos)")
    status, corpo = chamar("conta", "POST", "/api/trilhas", token_atleta, json={"nome": f"Trilha {sufixo}"})
    trilha = corpo["data"]
    esperar("conta aceitou o vídeo publicado na trilha", lambda: chamar(
        "conta", "POST", f"/api/trilhas/{trilha['id']}/videos", token_atleta, json={"video_id": video["id"]}))

    passo(7, "Estado operacional de cada serviço (/status)")
    for servico in URLS:
        status, corpo = chamar(servico, "GET", "/status")
        d = corpo["data"]
        hb = ", ".join(f"{nome} há {info['segundos_desde_ultimo']} s" for nome, info in sorted(d["heartbeats_recebidos"].items()))
        print(f"   {servico:13} broker conectado={d['broker'].get('conectado')} | publicados={d['eventos_publicados']['total']}"
              f" | consumidos={d['eventos_consumidos']['total']} {d['eventos_consumidos']['por_origem']}"
              f" | REST={d['chamadas_rest']['total']} | heartbeats: {hb or 'nenhum ainda'}")
    print("\nFluxo concluído: os quatro serviços se comunicaram por eventos e por REST.")


if __name__ == "__main__":
    main()
