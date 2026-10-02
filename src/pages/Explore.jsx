import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { videos } from "../data/content.js";
import VideoCard from "../components/VideoCard.jsx";

const categories = ["Todos", ...new Set(videos.map((video) => video[1]))];

export default function Explore({ go, initialCategory = "Todos" }) {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(() =>
    initialCategory === "Todos" ? new Set() : new Set([initialCategory]),
  );
  const results = videos.filter((video) =>
    (selectedCategories.size === 0 || selectedCategories.has(video[1])) &&
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
          <button
            onClick={() => {
              setSelectedCategories(new Set());
              setQuery("");
            }}
          >
            Limpar
          </button>
          <h5>Categoria</h5>
          {categories.map((name) => (
            <label key={name}>
              <input
                type="checkbox"
                name="category"
                checked={name === "Todos" ? selectedCategories.size === 0 : selectedCategories.has(name)}
                onChange={() => {
                  if (name === "Todos") {
                    setSelectedCategories(new Set());
                    return;
                  }
                  setSelectedCategories((current) => {
                    const next = new Set(current);
                    if (next.has(name)) next.delete(name);
                    else next.add(name);
                    return next;
                  });
                }}
              /> {name}
            </label>
          ))}
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
