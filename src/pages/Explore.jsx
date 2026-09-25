import { ChevronDown, Search } from "lucide-react";
import { videos } from "../data/content.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Explore({ go }) {
  return (
    <main className="wrap page">
      <span className="eyebrow">BIBLIOTECA WELLFLIX</span>
      <h1>Conteúdo para a sua evolução</h1>
      <div className="search-large">
        <Search size={16} /> treino de performance <span>128 resultados</span>
      </div>
      <div className="explore-layout">
        <aside className="filters">
          <strong>Filtros</strong>
          <button>Limpar</button>
          <h5>Categoria</h5>
          {["Todos", "Musculação", "Yoga", "Basquete", "Nutrição", "Risco"].map(
            (x) => (
              <label key={x}>
                <input type="checkbox" defaultChecked /> {x}
              </label>
            ),
          )}
          <h5>Avaliação</h5>
          {["★★★★★ 4,5+", "★★★★☆ 4,0+", "★★★☆☆ 3,0+"].map((x) => (
            <label key={x}>
              <input type="checkbox" defaultChecked /> {x}
            </label>
          ))}
        </aside>
        <div className="results">
          <div className="result-head">
            <span>128 vídeos encontrados</span>
            <button className="dark-button">
              Mais relevantes <ChevronDown size={13} />
            </button>
          </div>
          <div className="video-grid">
            {videos.map((v) => (
              <VideoCard key={v[0]} video={v} go={go} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
