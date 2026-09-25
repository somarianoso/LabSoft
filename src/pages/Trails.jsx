import { useState } from "react";
import { ArrowUpRight, ChevronRight, CirclePlay, Play } from "lucide-react";
import { videos } from "../data/content.js";

const trails = [
  {
    category: "Musculação",
    title: "Programa de Musculação 12 Semanas",
    description:
      "Uma progressão completa de força e hipertrofia, da base técnica ao desempenho máximo.",
    parts: 3,
    totalEpisodes: 24,
    progress: 38,
    episodes: [
      ["Fundamentos e avaliação inicial", 0],
      ["Construindo uma base de força", 2],
      ["Pernas: força e controle", 0],
      ["Sobrecarga progressiva", 4],
    ],
  },
  {
    category: "Yoga",
    title: "Yoga para Iniciantes",
    description:
      "Respiração, mobilidade e posturas essenciais em uma sequência segura e acolhedora.",
    parts: 2,
    totalEpisodes: 12,
    progress: 67,
    episodes: [
      ["Respiração e presença", 1],
      ["Saudação ao sol", 3],
      ["Mobilidade de quadril", 1],
      ["Equilíbrio e estabilidade", 5],
    ],
  },
  {
    category: "Recuperação",
    title: "Recuperação Pós-Lesão",
    description:
      "Retome o movimento com confiança em sessões guiadas por fisioterapeutas.",
    parts: 3,
    totalEpisodes: 18,
    progress: 0,
    episodes: [
      ["Entendendo sua recuperação", 5],
      ["Mobilidade sem dor", 1],
      ["Estabilidade e controle", 4],
      ["Retorno gradual ao treino", 5],
    ],
  },
];

export default function Trails({ go }) {
  const [category, setCategory] = useState("Todas as trilhas");
  const visibleTrails =
    category === "Todas as trilhas"
      ? trails
      : trails.filter((trail) => trail.category === category);

  return (
    <main className="wrap page trails-page">
      <header className="trails-intro">
        <span className="eyebrow">SUA JORNADA CONTINUA</span>
        <h1>Trilhas de Conteúdo</h1>
        <p>
          Programas completos, organizados em partes e episódios sequenciais
          para você evoluir no seu ritmo.
        </p>
      </header>

      <div className="trail-summary" aria-label="Resumo da sua jornada">
        <div>
          <strong>3 trilhas em andamento</strong>
          <span>Programas para diferentes objetivos</span>
        </div>
        <div>
          <strong>18 episódios concluídos</strong>
          <span>Sua evolução acontece aula a aula</span>
        </div>
      </div>

      <section className="continue-watching" aria-labelledby="continue-title">
        <div className="continue-cover">
          <img src={videos[0][3]} alt="Treino de força" />
          <span>PARTE 2 · EPISÓDIO 4</span>
          <button
            className="continue-play"
            onClick={() => go("detalhe")}
            aria-label="Reproduzir episódio Pernas: força e controle"
          >
            <Play size={18} fill="currentColor" />
          </button>
        </div>
        <div className="continue-copy">
          <span className="eyebrow">CONTINUE ASSISTINDO</span>
          <h2 id="continue-title">Programa de Musculação 12 Semanas</h2>
          <p>Parte 2 · Episódio 4 — Pernas: força e controle</p>
          <div className="continue-progress">
            <span>
              <i />
            </span>
            <small>
              08:42 <b>/</b> 28:10
            </small>
          </div>
          <button className="green" onClick={() => go("detalhe")}>
            <CirclePlay size={16} /> Continuar episódio
          </button>
        </div>
      </section>

      <section className="trails-library" aria-labelledby="my-trails-title">
        <div className="trails-library-heading">
          <div>
            <h2 id="my-trails-title">Minhas trilhas</h2>
            <p>Continue de onde parou ou comece uma nova sequência.</p>
          </div>
          <label className="trail-filter">
            <span className="sr-only">Filtrar trilhas</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Todas as trilhas</option>
              {trails.map((trail) => (
                <option key={trail.category}>{trail.category}</option>
              ))}
            </select>
            <ChevronRight size={14} />
          </label>
        </div>

        <div className="trail-list">
          {visibleTrails.map((trail) => (
            <article className="trail-card" key={trail.title}>
              <div className="trail-card-heading">
                <div>
                  <span className="eyebrow">{trail.category}</span>
                  <h3>{trail.title}</h3>
                  <p>{trail.description}</p>
                </div>
                <div className="trail-progress-label">
                  {trail.progress
                    ? `${trail.progress}% concluído`
                    : "Comece sua trilha"}
                </div>
              </div>

              <div
                className="trail-progress-track"
                role="progressbar"
                aria-label={`Progresso: ${trail.title}`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={trail.progress}
              >
                <span style={{ width: `${trail.progress}%` }} />
              </div>

              <div className="trail-card-controls">
                <span>
                  {trail.parts} partes · {trail.totalEpisodes} episódios
                </span>
                <button className="dark-button" onClick={() => go("detalhe")}>
                  Ver detalhes <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="trail-episodes">
                {trail.episodes.map(([title, videoIndex], index) => {
                  const video = videos[videoIndex];
                  return (
                    <button
                      className="trail-episode"
                      key={title}
                      onClick={() => go("detalhe")}
                      aria-label={`Episódio ${index + 1}: ${title}`}
                    >
                      <span className="trail-episode-image">
                        <img src={video[3]} alt="" />
                        <b>{video[2]}</b>
                        <i>{index + 1}</i>
                      </span>
                      <strong>{title}</strong>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
