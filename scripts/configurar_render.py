"""Configura a integração dos quatro serviços WellFlix no Render.

Para cada Web Service ``wellflix-*`` encontrado nos workspaces das chaves
informadas, define:

- as variáveis do Kafka (``KAFKA_*``), lidas do serviço Kafka do Aiven pela API
  dele (endereço, certificado da CA, certificado e chave do cliente);
- as URLs dos serviços que ele chama por REST (``*_API_URL``).

Nenhum segredo é impresso. Sem ``--aplicar`` o script só mostra o que faria.

Uso (na raiz do repositório):

    export RENDER_API_KEYS="rnd_xxx,rnd_yyy"   # uma chave por workspace (separadas por vírgula)
    export AIVEN_TOKEN="..."                   # Aiven Console > User profile > Tokens
    python scripts/configurar_render.py                 # simulação
    python scripts/configurar_render.py --aplicar       # grava as variáveis
    python scripts/configurar_render.py --aplicar --deploy   # grava e faz deploy
    python scripts/configurar_render.py --seed-demo          # contas/dados fictícios no banco do Render
"""

import argparse
import os
import sys

import httpx

RENDER = "https://api.render.com/v1"
AIVEN = "https://api.aiven.io/v1"

# URLs públicas dos serviços já publicados.
URLS = {
    "identidade": "https://wellflix-identidade-sophia.onrender.com",
    "conta": "https://wellflix-conta-maria.onrender.com",
    "profissionais": "https://wellflix-profissionais-moderadores.onrender.com",
    "catalogo": "https://wellflix-catalogo-luis.onrender.com",
}
# Quem chama quem por REST (ver backend/services/shared/clients.py).
CHAMA = {
    "identidade": [],
    "conta": [],
    "profissionais": ["identidade", "catalogo"],
    "catalogo": ["profissionais", "conta"],
}


def kafka_do_aiven(token: str) -> dict[str, str]:
    headers = {"Authorization": f"aivenv1 {token}"}
    with httpx.Client(timeout=30, headers=headers) as http:
        projetos = [p["project_name"] for p in http.get(f"{AIVEN}/project").raise_for_status().json()["projects"]]
        for projeto in projetos:
            servicos = http.get(f"{AIVEN}/project/{projeto}/service").raise_for_status().json()["services"]
            kafka = [s for s in servicos if s["service_type"] == "kafka"]
            if not kafka:
                continue
            servico = kafka[0]
            if servico["state"] != "RUNNING":
                sys.exit(f"O Kafka '{servico['service_name']}' do Aiven está '{servico['state']}'. Ligue-o no console.")
            detalhe = http.get(f"{AIVEN}/project/{projeto}/service/{servico['service_name']}",
                               params={"include_secrets": "true"}).raise_for_status().json()["service"]
            usuario = next(u for u in detalhe["users"] if u["username"] == "avnadmin")
            ca = http.get(f"{AIVEN}/project/{projeto}/kms/ca").raise_for_status().json()["certificate"]
            print(f"Kafka do Aiven: projeto '{projeto}', serviço '{servico['service_name']}' (autenticação por certificado)")
            return {
                "KAFKA_BOOTSTRAP_SERVERS": detalhe["service_uri"],
                "KAFKA_SECURITY_PROTOCOL": "SSL",
                "KAFKA_SSL_CA_PEM": ca,
                "KAFKA_SSL_CERT_PEM": usuario["access_cert"],
                "KAFKA_SSL_KEY_PEM": usuario["access_key"],
            }
    sys.exit("Nenhum serviço Kafka encontrado no Aiven com esse token.")


def servicos_render(chave: str) -> list[dict]:
    with httpx.Client(timeout=30, headers={"Authorization": f"Bearer {chave}"}) as http:
        itens = http.get(f"{RENDER}/services", params={"limit": 100}).raise_for_status().json()
    encontrados = []
    for item in itens:
        servico = item["service"]
        if servico["type"] != "web_service":
            continue
        # Identifica pelo endereço público: só configura a instância que o
        # frontend usa. Cópias com outra URL ficam de fora para não dividirem
        # o consumer group (e os eventos) com a instância oficial.
        url = servico.get("serviceDetails", {}).get("url", "").rstrip("/")
        dominio = next((d for d, u in URLS.items() if u == url), None)
        if dominio:
            encontrados.append({"id": servico["id"], "nome": servico["name"], "dominio": dominio, "chave": chave})
        elif servico["name"].startswith("wellflix-"):
            print(f"Ignorado: {servico['name']} ({url}) não é a URL usada pelo frontend.")
    return encontrados


def seed_demo(servicos: list[dict]) -> None:
    """Aplica migrations + seeds de demonstração no banco do Render (sem mostrar a URL)."""
    import subprocess

    urls = set()
    for s in servicos:
        with httpx.Client(timeout=30, headers={"Authorization": f"Bearer {s['chave']}"}) as http:
            for item in http.get(f"{RENDER}/services/{s['id']}/env-vars", params={"limit": 100}).raise_for_status().json():
                if item["envVar"]["key"] == "DATABASE_URL":
                    urls.add(item["envVar"]["value"])
    if len(urls) != 1:
        sys.exit(f"Esperava um único DATABASE_URL entre os serviços; encontrei {len(urls)}.")
    env = {**os.environ, "DATABASE_URL": urls.pop()}
    subprocess.run([sys.executable, "-m", "backend.services.shared.migrate", "todos", "--seed-demo",
                    "--confirm-demo-database"], env=env, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--aplicar", action="store_true", help="grava as variáveis no Render")
    parser.add_argument("--deploy", action="store_true", help="dispara um deploy depois de gravar")
    parser.add_argument("--seed-demo", action="store_true",
                        help="aplica os seeds de demonstração no banco usado pelos serviços no Render")
    args = parser.parse_args()

    chaves = [k.strip() for k in os.getenv("RENDER_API_KEYS", "").split(",") if k.strip()]
    if not chaves:
        sys.exit("Defina RENDER_API_KEYS (uma chave do Render por workspace, separadas por vírgula).")
    token = os.getenv("AIVEN_TOKEN", "").strip()
    kafka = kafka_do_aiven(token) if token else {}
    if not kafka:
        print("AIVEN_TOKEN não definido: as variáveis do Kafka não serão alteradas.")

    servicos = [s for chave in chaves for s in servicos_render(chave)]
    if args.seed_demo:
        seed_demo(servicos)
        return
    faltando = set(URLS) - {s["dominio"] for s in servicos}
    for s in servicos:
        variaveis = dict(kafka)
        for alvo in CHAMA[s["dominio"]]:
            variaveis[f"{alvo.upper()}_API_URL"] = URLS[alvo]
        print(f"\n{s['nome']} ({s['dominio']}): {', '.join(sorted(variaveis)) or 'nada a configurar'}")
        if not args.aplicar:
            continue
        with httpx.Client(timeout=30, headers={"Authorization": f"Bearer {s['chave']}"}) as http:
            for nome, valor in variaveis.items():
                http.put(f"{RENDER}/services/{s['id']}/env-vars/{nome}", json={"value": valor}).raise_for_status()
            print(f"   {len(variaveis)} variáveis gravadas")
            if args.deploy:
                deploy = http.post(f"{RENDER}/services/{s['id']}/deploys", json={}).raise_for_status().json()
                print(f"   deploy disparado: {deploy.get('id')}")
    if faltando:
        print(f"\nServiços não encontrados com as chaves informadas: {', '.join(sorted(faltando))}."
              " Inclua a chave do workspace de quem os publicou.")
    if not args.aplicar:
        print("\nSimulação. Rode de novo com --aplicar para gravar.")


if __name__ == "__main__":
    main()
