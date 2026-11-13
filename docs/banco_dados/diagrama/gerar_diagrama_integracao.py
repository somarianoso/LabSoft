"""Gera o diagrama de integração entre os microsserviços do WellFlix.

Uso (na raiz do repositório):

    python docs/banco_dados/diagrama/gerar_diagrama_integracao.py

Saídas nesta pasta: diagrama_integracao_microsservicos.svg e .png.
"""

from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent
BG, PANEL, LINE, MUTED, TEXT = "#ffffff", "#ffffff", "#d5dae2", "#6b7280", "#1f2430"
GREEN, BLUE = "#3fa34d", "#263a7a"
KAFKA = "#d9480f"
FONT = "Liberation Sans, Arial, DejaVu Sans, sans-serif"
MONO = "DejaVu Sans Mono, monospace"
W, H = 3000, 1760
out: list[str] = []

SVC = {
    "identidade": {"cor": GREEN, "t": "IDENTIDADE", "d": "Sophia · :8001", "x": 120, "y": 430,
                   "db": ["usuarios", "papeis_usuario", "atletas", "moderadores", "outbox_eventos"]},
    "profissionais": {"cor": "#8b5cf6", "t": "PROFISSIONAIS", "d": "Gabriel · :8003", "x": 2200, "y": 430,
                      "db": ["profissionais", "categorias_profissional", "seguimentos_profissional", "revisoes_video",
                             "outbox_eventos", "usuarios_replica", "categorias_replica"]},
    "conta": {"cor": "#e8a33d", "t": "CONTA", "d": "Maria Eduarda · :8002", "x": 120, "y": 1180,
              "db": ["planos", "assinaturas", "categorias_assinatura", "trilhas", "videos_trilha", "progresso_trilha",
                     "usuarios_replica", "categorias_replica", "videos_replica"]},
    "catalogo": {"cor": "#3b82f6", "t": "CATÁLOGO", "d": "Luís · :8004", "x": 2200, "y": 1180,
                 "db": ["categorias", "videos", "categorias_video", "comentarios", "avaliacoes", "outbox_eventos",
                        "usuarios_replica", "profissionais_replica"]},
}
BW = 680


def text(x, y, s, size=16, color=TEXT, weight=400, anchor="start", family=FONT):
    out.append(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{escape(s)}</text>')


def box_h(svc):
    return 120 + 30 * ((len(SVC[svc]["db"]) + 1) // 2) + 30


def service(svc):
    s = SVC[svc]
    x, y, h = s["x"], s["y"], box_h(svc)
    out.append(f'<rect x="{x}" y="{y}" width="{BW}" height="{h}" rx="22" fill="{PANEL}" stroke="{s["cor"]}" stroke-width="2.2"/>')
    out.append(f'<path d="M{x},{y + 22} a22,22 0 0 1 22,-22 h{BW - 44} a22,22 0 0 1 22,22 v38 h-{BW} z" fill="{s["cor"]}" fill-opacity="0.18"/>')
    text(x + 26, y + 40, s["t"], 26, s["cor"], 700)
    text(x + BW - 24, y + 40, "FastAPI " + s["d"], 16, MUTED, 500, "end")
    # banco
    dy = y + 80
    out.append(f'<rect x="{x + 20}" y="{dy}" width="{BW - 40}" height="{h - 100}" rx="14" fill="#f7f8fa" stroke="{LINE}"/>')
    text(x + 38, dy + 30, f'PostgreSQL · schema "{svc}"', 15, MUTED, 700)
    for i, name in enumerate(s["db"]):
        cx = x + 38 + (i % 2) * 310
        cy = dy + 62 + 30 * (i // 2)
        rep = name.endswith("_replica")
        outbox = name == "outbox_eventos"
        color = MUTED if rep else (KAFKA if outbox else TEXT)
        if rep:
            out.append(f'<rect x="{cx}" y="{cy - 12}" width="13" height="13" rx="3" fill="none" stroke="{MUTED}" stroke-dasharray="3 2"/>')
        else:
            out.append(f'<rect x="{cx}" y="{cy - 12}" width="13" height="13" rx="3" fill="{KAFKA if outbox else s["cor"]}" fill-opacity="0.85"/>')
        text(cx + 22, cy, name, 15, color, 600 if not rep else 400)


def arrow_defs():
    out.append("<defs>")
    for name, color in (("g", GREEN), ("k", KAFKA), ("b", BLUE), ("m", MUTED)):
        out.append(f'<marker id="a{name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{color}"/></marker>')
    out.append("</defs>")


def line(points, color, marker, dash=False, width=3):
    d = " ".join(("M" if i == 0 else "L") + f"{x},{y}" for i, (x, y) in enumerate(points))
    da = ' stroke-dasharray="12 8"' if dash else ""
    out.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"{da} marker-end="url(#a{marker})"/>')


def pill(x, y, label, color, anchor="middle", size=14):
    w = len(label) * (size * 0.52) + 22
    rx = x - w / 2 if anchor == "middle" else (x - w if anchor == "end" else x)
    out.append(f'<rect x="{rx}" y="{y - 18}" width="{w}" height="26" rx="13" fill="{BG}" stroke="{color}" stroke-width="1.4"/>')
    text(rx + w / 2, y, label, size, color, 600, "middle")


def build():
    out.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
    out.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
    arrow_defs()
    text(W / 2, 84, "MODELO DE INTEGRAÇÃO DOS MICROSSERVIÇOS", 40, TEXT, 400, "middle")
    text(W / 2, 132, "WellFlix · cada serviço tem o próprio banco. Mudanças viram eventos no Kafka (tempo real) e alimentam réplicas locais; "
                  "comandos imediatos usam REST; quem é o usuário vem do token JWT.", 19, MUTED, 400, "middle")

    # frontend
    fx, fy, fw = 1100, 190, 800
    out.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="110" rx="20" fill="{PANEL}" stroke="{TEXT}" stroke-opacity="0.6" stroke-width="2"/>')
    text(fx + fw / 2, fy + 48, "FRONTEND · React (Render Static Site)", 24, TEXT, 700, "middle")
    text(fx + fw / 2, fy + 82, "chama cada serviço pela própria URL (VITE_*_API_URL) e envia o token", 16, MUTED, 400, "middle")

    for svc in SVC:
        service(svc)
    I, P, C, K = (SVC[n] for n in ("identidade", "profissionais", "conta", "catalogo"))

    # frontend -> serviços (token do usuário)
    line([(fx + 80, fy + 110), (fx + 80, 360), (460, 360), (460, I["y"] - 8)], TEXT, "m", width=2)
    line([(fx + fw - 80, fy + 110), (fx + fw - 80, 360), (2540, 360), (2540, P["y"] - 8)], TEXT, "m", width=2)
    line([(fx + 30, fy + 110), (fx + 30, 330), (60, 330), (60, 1330), (112, 1330)], TEXT, "m", width=2)
    line([(fx + fw - 30, fy + 110), (fx + fw - 30, 330), (2940, 330), (2940, 1330), (2888, 1330)], TEXT, "m", width=2)
    pill(fx + fw / 2, 324, "HTTPS + Authorization: Bearer <JWT do usuário>", TEXT)
    pill(460, 400, "login emite o JWT (sub = usuarios.id + papéis)", GREEN)

    # Kafka
    kx, ky, kw, kh = 1060, 500, 880, 800
    out.append(f'<rect x="{kx}" y="{ky}" width="{kw}" height="{kh}" rx="30" fill="{KAFKA}" fill-opacity="0.06" stroke="{KAFKA}" stroke-width="2.5"/>')
    text(kx + kw / 2, ky + 56, "APACHE KAFKA", 32, KAFKA, 700, "middle")
    text(kx + kw / 2, ky + 88, "tópicos compactados · chave = id da entidade · um consumer group por serviço", 16, MUTED, 400, "middle")
    topics = [
        ("wellflix.identidade.usuarios", "usuario.atualizado / removido  →  conta, catálogo, profissionais", GREEN),
        ("wellflix.catalogo.categorias", "categoria.atualizada / removida  →  conta, profissionais", "#3b82f6"),
        ("wellflix.catalogo.videos", "video.atualizado / removido  →  conta", "#3b82f6"),
        ("wellflix.profissionais.perfis", "perfil.atualizado / removido  →  catálogo", "#8b5cf6"),
    ]
    for i, (name, ev, color) in enumerate(topics):
        ty = ky + 130 + i * 160
        out.append(f'<rect x="{kx + 60}" y="{ty}" width="{kw - 120}" height="120" rx="16" fill="{PANEL}" stroke="{color}" stroke-width="1.6"/>')
        for j in range(10):
            out.append(f'<rect x="{kx + 86 + j * 30}" y="{ty + 78}" width="24" height="22" rx="4" fill="{color}" fill-opacity="{0.12 + j * 0.08}"/>')
        text(kx + 400, ty + 96, "→ offset de cada consumidor", 14, MUTED)
        text(kx + 86, ty + 40, name, 21, color, 700, family=MONO)
        text(kx + 86, ty + 66, ev, 15, MUTED)

    # serviço <-> Kafka: setas curtas e paralelas
    def link(x1, x2, y, color, marker, dash, label, label_y):
        line([(x1, y), (x2, y)], color, marker, dash=dash)
        pill((x1 + x2) / 2, label_y, label, color, size=13)

    link(808, kx - 8, 560, GREEN, "g", False, "publica", 544)
    link(P["x"] - 0, kx + kw + 8, 560, "#8b5cf6", "b", False, "publica", 544)
    link(kx + kw, P["x"] - 8, 640, KAFKA, "k", True, "consome", 624)
    link(kx, 808, 1230, KAFKA, "k", True, "consome", 1214)
    link(K["x"], kx + kw + 8, 1220, "#3b82f6", "b", False, "publica", 1204)
    link(kx + kw, K["x"] - 8, 1280, KAFKA, "k", True, "consome", 1300)

    # REST síncrono (token de serviço)
    line([(P["x"], 470), (808, 470)], BLUE, "b")
    pill(1500, 476, "REST  GET /api/usuarios/me  (repassa o token do usuário: e-mail do perfil profissional)", BLUE, size=13)
    ph = P["y"] + box_h("profissionais")
    line([(2330, ph), (2330, K["y"] - 8)], BLUE, "b")
    pill(2316, 930, "REST /internal: moderação, vídeos, estatísticas", BLUE, "end", size=13)
    line([(2700, K["y"]), (2700, ph + 8)], BLUE, "b")
    pill(2714, 960, "REST /internal: categoria em uso?", BLUE, "start", size=13)
    line([(K["x"], 1420), (808, 1420)], BLUE, "b")
    pill(1500, 1426, "REST /internal: categoria em uso em alguma assinatura?", BLUE, size=13)

    # legenda
    ly = H - 80
    out.append(f'<rect x="40" y="{ly - 40}" width="{W - 80}" height="100" rx="18" fill="{PANEL}" stroke="{LINE}"/>')
    items = [(GREEN, False, "evento publicado (trigger → outbox → relay)"), (KAFKA, True, "evento consumido → atualiza réplica local"),
             (BLUE, False, "chamada REST síncrona (token de serviço)"), (TEXT, False, "frontend → serviço (token do usuário)")]
    lx = 80
    for color, dash, label in items:
        da = ' stroke-dasharray="12 8"' if dash else ""
        out.append(f'<line x1="{lx}" y1="{ly + 8}" x2="{lx + 70}" y2="{ly + 8}" stroke="{color}" stroke-width="3"{da}/>')
        text(lx + 84, ly + 14, label, 16, TEXT)
        lx += 140 + len(label) * 8.6
    out.append("</svg>")
    svg = "\n".join(out)
    (OUT / "diagrama_integracao_microsservicos.svg").write_text(svg, encoding="utf-8")
    try:
        import cairosvg
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(OUT / "diagrama_integracao_microsservicos.png"))
        print("PNG gerado")
    except ImportError:
        print("Instale cairosvg para gerar o PNG (o SVG já foi gerado).")


if __name__ == "__main__":
    build()
