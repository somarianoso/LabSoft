import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { img } from "../data/content.js";
import Metric from "../components/Metric.jsx";

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
  const [notice, setNotice] = useState("");
  const decide = (index, action) => {
    setQueue((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setNotice(
      action === "approve" ? "Vídeo aprovado e publicado." : "Vídeo rejeitado.",
    );
    window.setTimeout(() => setNotice(""), 2200);
  };
  return (
    <main className="moderator-page">
      <section className="moderator-hero">
        <div>
          <span className="eyebrow blue">MODO MODERADOR</span>
          <h1>Alexandre S.</h1>
        </div>
        <span className="moderator-badge">
          <ShieldCheck size={14} /> Acesso administrativo
        </span>
      </section>
      <div className="moderator-heading">
        <div>
          <span className="eyebrow">
            PAINEL MODERADOR · APROVAÇÃO DE CONTEÚDOS
          </span>
          <h2>Aprovação de Vídeos</h2>
        </div>
        <span className="pending-count">
          Pendentes <strong>{queue.length || 0} vídeos</strong>
        </span>
      </div>
      <div className="moderator-stats">
        <Metric value="28 vídeos" label="Aprovados hoje" />
        <Metric value="3 vídeos" label="Rejeitados" />
        <Metric
          value={`${queue.length} vídeos`}
          label="Pendentes de aprovação"
        />
      </div>
      <section className="moderator-section">
        <div className="moderator-section-head">
          <div>
            <span className="eyebrow">FILA DE ANÁLISE PENDENTE</span>
            <h2>Conteúdos aguardando sua decisão</h2>
          </div>
          <div className="moderator-tools">
            <div className="search-large">
              <Search size={15} />
              <input placeholder="Buscar vídeo ou profissional..." />
            </div>
            <button className="dark-button">
              Musculação <ChevronDown size={13} />
            </button>
          </div>
        </div>
        {notice && <div className="moderator-notice">{notice}</div>}
        <div className="review-list">
          {queue.length ? (
            queue.map((item, index) => (
              <article className="review-card" key={item[0]}>
                <img src={item[5]} alt="" />
                <div className="review-content">
                  <div className="review-title">
                    <h3>{item[0]}</h3>
                    <span>{item[4]}</span>
                  </div>
                  <p>
                    <strong>{item[1]}</strong>
                    <i>•</i>
                    {item[2]}
                    <i>•</i> Enviado em {item[3]}
                  </p>
                  <div className="review-actions">
                    <button
                      className="reject"
                      onClick={() => decide(index, "reject")}
                    >
                      <X size={14} /> Rejeitar
                    </button>
                    <button
                      className="approve"
                      onClick={() => decide(index, "approve")}
                    >
                      <Check size={14} /> Aprovar
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-review">
              Tudo certo por aqui. Não há vídeos pendentes.
            </div>
          )}
        </div>
      </section>
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
        <div className="published-table">
          <div className="table-row table-head">
            <span>VÍDEO</span>
            <span>PROFISSIONAL</span>
            <span>CATEGORIA</span>
            <span>DATA</span>
            <span>VIEWS</span>
            <span>AVALIAÇÃO</span>
            <span>AÇÕES</span>
          </div>
          {[
            [
              "Mobilidade articular e prevenção de lesão",
              "Caio Mendes",
              "Prevenção",
              "26/03/2026",
              "1.240",
              "4.9",
            ],
            [
              "Core forte para qualquer esporte",
              "Caio Mendes",
              "Performance",
              "21/03/2026",
              "4.820",
              "4.8",
            ],
            [
              "Treino de ombros avançado e estabilização",
              "Caio Mendes",
              "Musculação",
              "14/03/2026",
              "8.910",
              "4.9",
            ],
          ].map((row) => (
            <div className="table-row" key={row[0]}>
              {row.map((cell, i) => (
                <span key={cell} className={i === 0 ? "table-video" : ""}>
                  {i === 5 && <Star size={11} fill="currentColor" />} {cell}
                </span>
              ))}
              <button>Despublicar</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
