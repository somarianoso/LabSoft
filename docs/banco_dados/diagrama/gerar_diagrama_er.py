"""Gera o diagrama entidade-relacionamento do WellFlix (um banco por microsserviço).

Estilo: fundo claro, entidades com cabeçalho azul-marinho, losangos para relacionamentos e
cardinalidade (mín, máx). Cada microsserviço aparece como uma área com o próprio
banco; relacionamentos entre serviços são tracejados (referência lógica, sem FK).

Uso (na raiz do repositório):

    pip install cairosvg            # só para gerar o PNG
    python docs/banco_dados/diagrama/gerar_diagrama_er.py

Saídas nesta pasta: diagrama_er_microsservicos.svg e .png.
"""

import math
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent

NAVY = "#263a7a"
NAVY_LIGHT = "#eef1fa"
INK = "#1f2430"
MUTED = "#6b7280"
LINE = "#3a3f4b"
CROSS = "#d9480f"  # relacionamento entre serviços (referência lógica)
FONT = "Liberation Sans, Arial, DejaVu Sans, sans-serif"

SERVICES = {
    "conta": ("#fff7e6", "#e8a33d", "CONTA", "schema conta · Maria Eduarda"),
    "identidade": ("#eefaf0", "#3fa34d", "IDENTIDADE", "schema identidade · Sophia"),
    "catalogo": ("#eef5ff", "#3b82f6", "CATÁLOGO", "schema catalogo · Luís"),
    "profissionais": ("#f5f0ff", "#8b5cf6", "PROFISSIONAIS E MODERAÇÃO", "schema profissionais · Gabriel"),
}
W, H = 4760, 3060
CW, HEAD, ROW = 300, 38, 25

# Áreas (x, y, w, h). Os losangos dos relacionamentos entre serviços ficam nos
# corredores entre as áreas: x = 1580 e x = 3180 (verticais), y = 1370 (horizontal).
Z = {
    "conta": (40, 200, 1480, 2620),
    "identidade": (1640, 200, 1480, 1110),
    "catalogo": (1640, 1430, 1480, 1390),
    "profissionais": (3240, 200, 1480, 2620),
}

# Entidades: nome -> (x, y, [(atributo, chave)]); chave: PK, FK, PKFK, REF, PKREF, ""
E = {
    # identidade
    "USUARIOS": (2230, 500, [("id", "PK"), ("nome_completo", ""), ("email", ""), ("cpf", ""), ("hash_senha", ""),
                             ("data_criacao", ""), ("data_atualizacao", "")]),
    "PAPEIS_USUARIO": (2230, 250, [("usuario_id", "PKFK"), ("papel", "PK"), ("data_criacao", "")]),
    "ATLETAS": (1720, 560, [("usuario_id", "PKFK"), ("data_criacao", "")]),
    # catálogo
    "COMENTARIOS": (1740, 1540, [("id", "PK"), ("video_id", "FK"), ("usuario_id", "REF"), ("conteudo", ""), ("data_criacao", "")]),
    "AVALIACOES": (2720, 1540, [("video_id", "PKFK"), ("usuario_id", "PKREF"), ("gostou", ""), ("data_criacao", ""),
                                ("data_atualizacao", "")]),
    "VIDEOS": (2230, 1810, [("id", "PK"), ("profissional_id", "REF"), ("titulo", ""), ("descricao", ""),
                            ("duracao_segundos", ""), ("url_conteudo", ""), ("situacao", ""), ("data_publicacao", ""),
                            ("data_criacao", ""), ("data_atualizacao", "")]),
    "CATEGORIAS": (1740, 2420, [("id", "PK"), ("nome", ""), ("data_criacao", "")]),
    "CATEGORIAS_VIDEO": (2230, 2440, [("video_id", "PKFK"), ("categoria_id", "PKFK")]),
    # conta
    "PLANOS": (130, 320, [("id", "PK"), ("codigo", ""), ("nome", ""), ("descricao", ""), ("preco_mensal_centavos", ""),
                          ("limite_categorias", ""), ("ativo", ""), ("data_criacao", ""), ("data_atualizacao", "")]),
    "ASSINATURAS": (1080, 320, [("id", "PK"), ("atleta_id", "REF"), ("plano_id", "FK"), ("metodo_pagamento", ""),
                                ("situacao", ""), ("referencia_pagamento", ""), ("data_inicio", ""), ("data_vencimento", ""),
                                ("data_criacao", ""), ("data_atualizacao", "")]),
    "CATEGORIAS_ASSINATURA": (130, 2380, [("assinatura_id", "PKFK"), ("categoria_id", "PKREF"), ("categoria_nome", "")]),
    "TRILHAS": (1080, 980, [("id", "PK"), ("atleta_id", "REF"), ("nome", ""), ("privacidade", ""), ("data_criacao", ""),
                            ("data_atualizacao", "")]),
    "VIDEOS_TRILHA": (1080, 1700, [("trilha_id", "PKFK"), ("video_id", "PKREF"), ("ordem", "")]),
    "PROGRESSO_TRILHA": (1080, 2110, [("trilha_id", "PKFK"), ("video_id", "PKFK"), ("segundos_assistidos", ""),
                                     ("concluido", ""), ("data_criacao", ""), ("data_atualizacao", "")]),
    # profissionais
    "PROFISSIONAIS": (3330, 340, [("usuario_id", "PKREF"), ("especialidade", ""), ("biografia", ""), ("data_criacao", ""),
                                  ("data_atualizacao", "")]),
    "SEGUIMENTOS_PROFISSIONAL": (4180, 660, [("profissional_id", "PKFK"), ("seguidor_id", "PKREF"), ("data_criacao", "")]),
    "CATEGORIAS_PROFISSIONAL": (4180, 2440, [("profissional_id", "PKFK"), ("categoria_id", "PKREF")]),
    "MODERADORES": (3380, 1100, [("usuario_id", "PKREF"), ("data_criacao", "")]),
    "REVISOES_VIDEO": (3330, 1700, [("id", "PK"), ("video_id", "REF"), ("moderador_id", "FK"), ("situacao", ""),
                                    ("observacao", ""), ("data_criacao", "")]),
}

# Relacionamentos: (A, card A, B, card B, rótulo, (x, y) do losango, entre serviços?)
R = [
    # identidade
    ("USUARIOS", "(1,1)", "PAPEIS_USUARIO", "(0,N)", "possui", (2380, 432), False),
    ("USUARIOS", "(1,1)", "ATLETAS", "(0,1)", "perfil", (2100, 605), False),
    # catálogo
    ("VIDEOS", "(1,1)", "COMENTARIOS", "(0,N)", "recebe", (2040, 1770), False),
    ("VIDEOS", "(1,1)", "AVALIACOES", "(0,N)", "recebe", (2720, 1770), False),
    ("VIDEOS", "(1,1)", "CATEGORIAS_VIDEO", "(0,N)", "classificado_em", (2380, 2300), False),
    ("CATEGORIAS", "(1,1)", "CATEGORIAS_VIDEO", "(0,N)", "classifica", (2115, 2470), False),
    # conta
    ("PLANOS", "(1,1)", "ASSINATURAS", "(0,N)", "contratado_em", (760, 450), False),
    ("ASSINATURAS", "(1,1)", "CATEGORIAS_ASSINATURA", "(0,N)", "seleciona", (600, 1400), False),
    ("TRILHAS", "(1,1)", "VIDEOS_TRILHA", "(0,N)", "organiza", (1230, 1440), False),
    ("VIDEOS_TRILHA", "(1,1)", "PROGRESSO_TRILHA", "(0,1)", "registra", (1230, 1955), False),
    # profissionais
    ("PROFISSIONAIS", "(1,1)", "SEGUIMENTOS_PROFISSIONAL", "(0,N)", "seguido", (3900, 560), False),
    ("PROFISSIONAIS", "(1,1)", "CATEGORIAS_PROFISSIONAL", "(0,N)", "atua_em", (3900, 1700), False),
    ("MODERADORES", "(1,1)", "REVISOES_VIDEO", "(0,N)", "revisa", (3505, 1450), False),
    # entre serviços (referência lógica, sem FK)
    ("ATLETAS", "(1,1)", "ASSINATURAS", "(0,N)", "realiza", (1580, 470), True),
    ("ATLETAS", "(1,1)", "TRILHAS", "(0,N)", "cria", (1580, 900), True),
    ("CATEGORIAS", "(1,1)", "CATEGORIAS_ASSINATURA", "(0,N)", "incluida_em", (1580, 2450), True),
    ("VIDEOS", "(1,1)", "VIDEOS_TRILHA", "(0,N)", "incluido_em", (1580, 1960), True),
    ("USUARIOS", "(1,1)", "PROFISSIONAIS", "(0,1)", "perfil", (3180, 470), True),
    ("USUARIOS", "(1,1)", "SEGUIMENTOS_PROFISSIONAL", "(0,N)", "segue", (3180, 700), True),
    ("USUARIOS", "(1,1)", "MODERADORES", "(0,1)", "perfil", (3180, 1000), True),
    ("PROFISSIONAIS", "(1,1)", "VIDEOS", "(0,N)", "publica", (3180, 1830), True),
    ("VIDEOS", "(1,1)", "REVISOES_VIDEO", "(0,N)", "recebe", (3180, 2120), True),
    ("CATEGORIAS", "(1,1)", "CATEGORIAS_PROFISSIONAL", "(0,N)", "associada_a", (3180, 2700), True),
    ("USUARIOS", "(1,1)", "COMENTARIOS", "(0,N)", "escreve", (1990, 1370), True),
    ("USUARIOS", "(1,1)", "AVALIACOES", "(0,N)", "avalia", (2780, 1370), True),
]

DW, DH = 128, 60  # losango
out: list[str] = []


def text(x, y, s, size=15, color=INK, weight=400, anchor="start", extra=""):
    out.append(f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
               f'fill="{color}" text-anchor="{anchor}" {extra}>{escape(s)}</text>')


def box(name):
    x, y, cols = E[name]
    return x, y, CW, HEAD + ROW * len(cols) + 8


def hexagon(cx, cy, r, filled):
    pts = " ".join(f"{cx + r * math.cos(math.radians(30 + 60 * i)):.1f},{cy + r * math.sin(math.radians(30 + 60 * i)):.1f}" for i in range(6))
    if filled:
        out.append(f'<polygon points="{pts}" fill="{NAVY}"/>')
    else:
        out.append(f'<polygon points="{pts}" fill="none" stroke="#9aa3b5" stroke-width="1.2"/>')


def draw_entity(name):
    x, y, w, h = box(name)
    _, _, cols = E[name]
    out.append(f'<rect x="{x + 3}" y="{y + 3}" width="{w}" height="{h}" fill="#000" fill-opacity="0.10"/>')
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#ffffff" stroke="{LINE}" stroke-width="1.4"/>')
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{HEAD}" fill="{NAVY}"/>')
    text(x + w / 2, y + 25, name, 15, "#ffffff", 700, "middle")
    for i, (col, key) in enumerate(cols):
        ry = y + HEAD + 4 + ROW * i
        is_key = key in ("PK", "PKFK", "PKREF")
        if is_key:
            out.append(f'<rect x="{x + 1}" y="{ry}" width="{w - 2}" height="{ROW}" fill="{NAVY_LIGHT}"/>')
        hexagon(x + 18, ry + ROW / 2, 6, is_key)
        text(x + 34, ry + 17, col, 14, INK)
        tag_x = x + 40 + len(col) * 7.6
        if key in ("PK", "PKFK", "FK"):
            label = {"PK": "PK", "PKFK": "PK / FK", "FK": "FK"}[key]
            color = NAVY if key != "FK" else "#4a5a9a"
            text(tag_x, ry + 17, label, 13, color, 700)
        elif key in ("REF", "PKREF"):
            if key == "PKREF":
                text(tag_x, ry + 17, "PK", 13, NAVY, 700)
                tag_x += 26
            text(tag_x, ry + 17, "REF", 13, CROSS, 700)


def border_point(name, tx, ty):
    """Ponto da borda da entidade na direção de (tx, ty)."""
    x, y, w, h = box(name)
    cx, cy = x + w / 2, y + h / 2
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return cx, cy
    sx = (w / 2) / abs(dx) if dx else math.inf
    sy = (h / 2) / abs(dy) if dy else math.inf
    s = min(sx, sy)
    return cx + dx * s, cy + dy * s


def diamond_point(dx0, dy0, tx, ty):
    dx, dy = tx - dx0, ty - dy0
    s = 1 / (abs(dx) / (DW / 2) + abs(dy) / (DH / 2))
    return dx0 + dx * s, dy0 + dy * s


def card_label(px, py, qx, qy, label, color):
    """Cardinalidade perto da entidade (px, py), deslocada para o lado da linha."""
    vx, vy = qx - px, qy - py
    n = math.hypot(vx, vy) or 1
    ux, uy = vx / n, vy / n
    lx, ly = px + ux * 24 - uy * 14, py + uy * 24 + ux * 14
    text(lx, ly + 5, label, 13, color, 400, "middle")


def draw_rel(a, ca, b, cb, label, pos, cross):
    mx, my = pos
    color = CROSS if cross else LINE
    dash = ' stroke-dasharray="9 6"' if cross else ""
    for ent, card in ((a, ca), (b, cb)):
        ex, ey = border_point(ent, mx, my)
        qx, qy = diamond_point(mx, my, ex, ey)
        out.append(f'<line x1="{ex:.1f}" y1="{ey:.1f}" x2="{qx:.1f}" y2="{qy:.1f}" stroke="{color}" stroke-width="1.5"{dash}/>')
        card_label(ex, ey, qx, qy, card, color)


def draw_diamond(label, pos, cross):
    mx, my = pos
    pts = f"{mx},{my - DH / 2} {mx + DW / 2},{my} {mx},{my + DH / 2} {mx - DW / 2},{my}"
    if cross:
        out.append(f'<polygon points="{pts}" fill="#fff4ec" stroke="{CROSS}" stroke-width="1.8" stroke-dasharray="7 4"/>')
    else:
        out.append(f'<polygon points="{pts}" fill="#ffffff" stroke="{LINE}" stroke-width="1.5"/>')
    size = 14 if len(label) <= 11 else 12
    text(mx, my + 5, label, size, CROSS if cross else INK, 600 if cross else 400, "middle")


def draw_zone(svc):
    x, y, w, h = Z[svc]
    fill, stroke, title, sub = SERVICES[svc]
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="{fill}" stroke="{stroke}" stroke-width="2.4"/>')
    # cilindro de banco de dados
    cx, cy = x + 36, y + 34
    out.append(f'<path d="M{cx - 14},{cy - 9} v20 a14,5 0 0 0 28,0 v-20" fill="{stroke}" fill-opacity="0.25" stroke="{stroke}" stroke-width="1.6"/>')
    out.append(f'<ellipse cx="{cx}" cy="{cy - 9}" rx="14" ry="5" fill="{fill}" stroke="{stroke}" stroke-width="1.6"/>')
    text(x + 62, y + 42, f"BANCO {title}", 24, stroke, 700)
    text(x + 64, y + 68, f"microsserviço {svc} · {sub}", 15, MUTED)


NOTES = {
    "identidade": (2130, 1170, ["Publica no Kafka: wellflix.identidade.usuarios",
                                "(nome e papéis; e-mail, CPF e senha não saem)"]),
    "catalogo": (1740, 2640, ["Publica: categorias e vídeos", "Réplicas: usuarios_replica,", "profissionais_replica"]),
    "conta": (130, 2560, ["Réplicas locais (Kafka): usuarios_replica,", "categorias_replica, videos_replica"]),
    "profissionais": (3330, 2400, ["Publica: wellflix.profissionais.perfis", "Réplicas: usuarios_replica, categorias_replica"]),
}


def draw_note(svc):
    x, y, lines = NOTES[svc]
    _, stroke, _, _ = SERVICES[svc]
    w = max(len(line) for line in lines) * 7.9 + 30
    h = 18 + 22 * len(lines)
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#ffffff" fill-opacity="0.8" stroke="{stroke}" stroke-dasharray="5 4"/>')
    for i, line in enumerate(lines):
        text(x + 14, y + 26 + 22 * i, line, 14, MUTED)


def build():
    out.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
    out.append(f'<rect width="{W}" height="{H}" fill="#ffffff"/>')
    text(W / 2, 80, "MODELO ENTIDADE–RELACIONAMENTO", 40, INK, 400, "middle")
    text(W / 2, 128, "WellFlix · um banco de dados por microsserviço · relacionamentos tracejados cruzam bancos: "
                     "referência lógica (sem FK), integrada por eventos Kafka e API", 20, MUTED, 400, "middle")
    for svc in Z:
        draw_zone(svc)
    for rel in R:
        draw_rel(*rel)
    for rel in R:
        draw_diamond(rel[4], rel[5], rel[6])
    for name in E:
        draw_entity(name)
    for svc in NOTES:
        draw_note(svc)
    # legenda
    lx, ly = 40, H - 200
    out.append(f'<rect x="{lx}" y="{ly}" width="{W - 80}" height="160" rx="14" fill="#fafbfc" stroke="#d5dae2"/>')
    text(lx + 30, ly + 40, "LEGENDA", 16, MUTED, 700)
    x = lx + 30
    y = ly + 90
    hexagon(x + 8, y - 5, 7, True)
    text(x + 24, y, "chave primária (PK)", 16)
    x += 250
    text(x, y, "FK", 15, "#4a5a9a", 700)
    text(x + 30, y, "chave estrangeira (mesmo banco)", 16)
    x += 330
    text(x, y, "REF", 15, CROSS, 700)
    text(x + 42, y, "referência lógica a outro banco (UUID, sem FK)", 16)
    x += 460
    out.append(f'<polygon points="{x + 40},{y - 26} {x + 80},{y - 5} {x + 40},{y + 16} {x},{y - 5}" fill="#ffffff" stroke="{LINE}" stroke-width="1.5"/>')
    text(x + 92, y, "relacionamento no mesmo banco", 16)
    x += 400
    out.append(f'<polygon points="{x + 40},{y - 26} {x + 80},{y - 5} {x + 40},{y + 16} {x},{y - 5}" fill="#fff4ec" stroke="{CROSS}" stroke-width="1.8" stroke-dasharray="7 4"/>')
    out.append(f'<line x1="{x + 80}" y1="{y - 5}" x2="{x + 130}" y2="{y - 5}" stroke="{CROSS}" stroke-width="1.5" stroke-dasharray="9 6"/>')
    text(x + 142, y, "relacionamento entre bancos (Kafka / API)", 16, CROSS)
    x += 520
    text(x, y, "(mín, máx)", 16, INK, 700)
    text(x + 96, y, "cardinalidade: (1,1) exatamente um · (0,1) zero ou um · (0,N) zero ou muitos", 16)
    out.append("</svg>")
    svg = "\n".join(out)
    (OUT / "diagrama_er_microsservicos.svg").write_text(svg, encoding="utf-8")
    try:
        import cairosvg
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(OUT / "diagrama_er_microsservicos.png"))
        print("PNG gerado")
    except ImportError:
        print("Instale cairosvg para gerar o PNG (o SVG já foi gerado).")


if __name__ == "__main__":
    build()
