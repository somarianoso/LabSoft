import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { videos } from "../data/content.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Explore({ go }) {
  const [query, setQuery] = useState("");
  const results = videos.filter((video) =>
    `${video[0]} ${video[1]}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <main className="wrap page">
      <span className="eyebrow">BIBLIOTECA WELLFLIX</span>
      <h1>Conteúdo para a sua evolução</h1>
      <div className="search-large">
        <Search size={16} />
        <input
          id="video-search"
          type="search"
          aria-label="Pesquisar vídeos"
          placeholder="Pesquisar por vídeo ou categoria"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span data-testid="video-result-count">
          {results.length} {results.length === 1 ? "vídeo" : "vídeos"}
        </span>
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
              <span>{results.length} vídeos encontrados</span>
            <button className="dark-button">
              Mais relevantes <ChevronDown size={13} />
            </button>
          </div>
          <div className="video-grid" data-testid="video-results">
            {results.map((v) => (
              <VideoCard key={v[0]} video={v} go={go} />
            ))}
          </div>
          {results.length === 0 && (
            <p role="status">Nenhum vídeo encontrado para essa busca.</p>
          )}
        </div>
      </div>
    </main>
  );
}
