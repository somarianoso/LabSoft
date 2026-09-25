import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CirclePlay,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { img } from "../data/content.js";

export default function Moderator() {
  const [queue, setQueue] = useState([
    [
      "Agachamento Búlgaro Avançado: Técnica, Força e Execução Perfeita",
      "Caio Mendes",
      "Musculação",
      "Hoje, às 10:42",
      "14:20",
      img.athlete,
    ],
    [
      "Vinyasa Flow Intenso: Respiração, Equilíbrio e Conexão Mente-Corpo",
      "Juliana Ruiz",
      "Yoga",
      "Hoje, às 08:15",
      "28:15",
      img.yoga,
    ],
    [
      "HIIT Explosivo de Alta Intensidade: Condicionamento Físico de Elite",
      "Marcos Vinícius",
      "Performance",
      "Ontem, às 17:30",
      "18:40",
      img.athlete,
    ],
    [
      "Mobilidade Articular Ativa e Alívio de Tensão Pós-Treino",
      "Dr. Caio Mendes",
      "Prevenção",
      "Ontem, às 14:02",
      "12:10",
      img.coach,
    ],
  ]);
  const [rejected, setRejected] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas as categorias");
  const [publishedTotal, setPublishedTotal] = useState(1240);
  const [published, setPublished] = useState([
    {
      title: "Mobilidade articular e prevenção de lesão",
      professional: "Caio Mendes",
      category: "Prevenção",
      date: "26/03/2026",
      views: "1.240",
      rating: "4.9",
      image: img.yoga,
    },
    {
      title: "Core forte para qualquer esporte",
      professional: "Caio Mendes",
      category: "Performance",
      date: "21/03/2026",
      views: "4.820",
      rating: "4.8",
      image: img.athlete,
    },
    {
      title: "Treino de ombros avançado e estabilização",
      professional: "Caio Mendes",
      category: "Musculação",
      date: "14/03/2026",
      views: "8.910",
      rating: "4.9",
      image: img.coach,
    },
  ]);
  const [notice, setNotice] = useState("");
  const decide = (index, action) => {
    const item = queue[index];
    setQueue((items) => items.filter((_, itemIndex) => itemIndex !== index));
    if (action === "reject") {
      setRejected((items) => [...items, item]);
    } else {
      setPublishedTotal((total) => total + 1);
      setPublished((items) => [
        {
          title: item[0],
          professional: item[1],
          category: item[2],
          date: new Intl.DateTimeFormat("pt-BR").format(new Date()),
          views: "0",
          rating: "—",
          image: item[5],
        },
        ...items,
      ]);
    }
    setNotice(
      action === "approve" ? "Vídeo aprovado e publicado." : "Vídeo rejeitado.",
    );
    window.setTimeout(() => setNotice(""), 2200);
  };
  const visibleItems = (activeTab === "rejected" ? rejected : queue).filter(
    (item) => {
      const matchesSearch = `${item[0]} ${item[1]}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR"));
      const matchesCategory =
        category === "Todas as categorias" || item[2] === category;
      return matchesSearch && matchesCategory;
    },
  );
  const visiblePublished = published.filter((item) => {
    const matchesSearch = `${item.title} ${item.professional}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR"));
    const matchesCategory =
      category === "Todas as categorias" || item.category === category;
    return matchesSearch && matchesCategory;
  });
  const tabs = [
    { id: "pending", label: "Pendentes de Aprovação", count: queue.length },
    {
      id: "published",
      label: "Publicados",
      count: publishedTotal.toLocaleString("pt-BR"),
    },
    { id: "rejected", label: "Rejeitados", count: 45 + rejected.length },
  ];
  return (
    <main className="moderator-page">
      <div className="moderator-heading">
        <div>
          <span className="eyebrow">
            PAINEL MODERADOR <i>·</i> <b>APROVAÇÃO DE CONTEÚDOS</b>
          </span>
          <h2>Aprovação de Vídeos</h2>
        </div>
        <span className="pending-count">
          <i />
          <span>
            <small>PENDENTES</small>
            <strong>{queue.length} vídeos</strong>
          </span>
        </span>
      </div>
      <div className="moderator-toolbar">
        <div
          className="moderator-tabs"
          role="tablist"
          aria-label="Status dos vídeos"
        >
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "active" : ""}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label} <span>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="moderator-tools">
          <label className="moderator-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar vídeo ou profissional..."
            />
          </label>
          <label className="moderator-category">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filtrar por categoria"
            >
              <option>Todas as categorias</option>
              <option>Musculação</option>
              <option>Yoga</option>
              <option>Performance</option>
              <option>Prevenção</option>
            </select>
            <ChevronDown size={13} />
          </label>
        </div>
      </div>
      {activeTab !== "published" && (
        <section className="moderator-section">
          <div className="moderator-section-head">
            <div>
              <span className="eyebrow">
                FILA DE ANÁLISE{" "}
                {activeTab === "rejected" ? "REJEITADA" : "PENDENTE"}
              </span>
              <h2>
                {activeTab === "rejected"
                  ? "Conteúdos rejeitados"
                  : "Conteúdos aguardando sua decisão"}
              </h2>
            </div>
          </div>
          {notice && <div className="moderator-notice">{notice}</div>}
          <div className="review-list">
            {visibleItems.length ? (
              visibleItems.map((item) => {
                const index = queue.indexOf(item);
                return (
                  <article className="review-card" key={item[0]}>
                    <div className="review-thumb">
                      <img src={item[5]} alt="" />
                      <span>{item[4]}</span>
                    </div>
                    <div className="review-content">
                      <div className="review-title">
                        <h3>{item[0]}</h3>
                      </div>
                      <p>
                        <strong>{item[1]}</strong>
                        <ShieldCheck size={12} />
                        <i>•</i>
                        <b>{item[2]}</b>
                        <i>•</i> Enviado em {item[3]}
                      </p>
                    </div>
                    <div className="review-actions">
                      {activeTab === "pending" ? (
                        <>
                          <button
                            className="preview"
                            aria-label={`Pré-visualizar ${item[0]}`}
                          >
                            <CirclePlay size={16} />
                          </button>
                          <button
                            className="reject"
                            onClick={() => decide(index, "reject")}
                          >
                            <X size={13} /> Rejeitar
                          </button>
                          <button
                            className="approve"
                            onClick={() => decide(index, "approve")}
                          >
                            <Check size={13} /> Aprovar
                          </button>
                        </>
                      ) : (
                        <button
                          className="restore"
                          onClick={() => {
                            setRejected((items) =>
                              items.filter((entry) => entry !== item),
                            );
                            setQueue((items) => [item, ...items]);
                          }}
                        >
                          Voltar para pendentes
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-review">
                {search || category !== "Todas as categorias"
                  ? "Nenhum conteúdo encontrado com esses filtros."
                  : activeTab === "rejected"
                    ? "Não há vídeos rejeitados nesta sessão."
                    : "Tudo certo por aqui. Não há vídeos pendentes."}
              </div>
            )}
          </div>
        </section>
      )}
      {activeTab === "published" && (
        <section className="moderator-section published-section">
          <div className="moderator-section-head">
            <div>
              <span className="eyebrow">HISTÓRICO</span>
              <h2>Últimos Conteúdos Publicados</h2>
            </div>
            <button className="section-link">
              Ver histórico completo <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="published-table-wrap">
            <table className="published-table">
              <thead>
                <tr>
                  <th>VÍDEO</th>
                  <th>PROFISSIONAL</th>
                  <th>CATEGORIA</th>
                  <th>DATA</th>
                  <th>VIEWS</th>
                  <th>AVALIAÇÃO</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {visiblePublished.length ? (
                  visiblePublished.map((item) => (
                    <tr key={item.title}>
                      <td className="table-video">
                        <img src={item.image} alt="" />
                        {item.title}
                      </td>
                      <td>
                        <span className="table-professional">
                          <img src={img.coach} alt="" />
                          {item.professional}
                        </span>
                      </td>
                      <td>
                        <span className="category-badge">{item.category}</span>
                      </td>
                      <td>{item.date}</td>
                      <td>{item.views}</td>
                      <td className="table-rating">
                        <Star size={12} fill="currentColor" /> {item.rating}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setPublished((items) =>
                              items.filter((entry) => entry !== item),
                            );
                            setPublishedTotal((total) =>
                              Math.max(0, total - 1),
                            );
                          }}
                        >
                          Despublicar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="table-empty" colSpan="7">
                      Nenhum conteúdo publicado encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
