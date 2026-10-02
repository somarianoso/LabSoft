import { useState } from "react";
import { ChevronDown, Search, ShieldCheck, Star } from "lucide-react";
import { professionals, videos } from "../data/content.js";
import ExploreFilters from "../components/ExploreFilters.jsx";
import VideoCard from "../components/VideoCard.jsx";

const videoCategories = [...new Set(videos.map((video) => video[1]))];
const allRatingFilters = new Set([4.5, 4, 3]);

export default function Explore({
  go,
  initialCategory = "Todos",
  initialType = "videos",
}) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState(initialType);
  const [selectedCategories, setSelectedCategories] = useState(() =>
    initialCategory === "Todos" ? new Set() : new Set([initialCategory]),
  );
  const [selectedRatings, setSelectedRatings] = useState(
    () => new Set(allRatingFilters),
  );
  const isVideoSearch = searchType === "videos";
  const categories = isVideoSearch
    ? videoCategories
    : [...new Set(professionals.flatMap((professional) => professional.categories))];
  const results = isVideoSearch
    ? videos.filter(
        (video) =>
          (selectedCategories.size === 0 || selectedCategories.has(video[1])) &&
          [...selectedRatings].some((rating) => rating <= 4.9) &&
          `${video[0]} ${video[1]}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      )
    : professionals.filter(
        (professional) =>
          (selectedCategories.size === 0 ||
            professional.categories.some((category) =>
              selectedCategories.has(category),
            )) &&
          [...selectedRatings].some((rating) => rating <= 4.9) &&
          `${professional.name} ${professional.specialty} ${professional.categories.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      );
  const resultNoun = isVideoSearch
    ? results.length === 1
      ? "vídeo"
      : "vídeos"
    : results.length === 1
      ? "profissional"
      : "profissionais";
  const resultText = `${results.length} ${resultNoun}`;
  const changeSearchType = (event) => {
    setSearchType(event.target.value);
    setSelectedCategories(new Set());
  };
  const toggleCategory = (category) => {
    if (category === "Todos") {
      setSelectedCategories(new Set());
      return;
    }
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };
  const toggleRating = (rating) => {
    setSelectedRatings((current) => {
      const next = new Set(current);
      if (next.has(rating)) next.delete(rating);
      else next.add(rating);
      return next;
    });
  };
  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedRatings(new Set(allRatingFilters));
    setQuery("");
  };

  return (
    <main className="wrap page">
      <span className="eyebrow">BIBLIOTECA WELLFLIX</span>
      <h1>{isVideoSearch ? "Conteúdo para a sua evolução" : "Conheça nossos profissionais"}</h1>
      <div className="search-large">
        <Search size={16} />
        <input
          id={isVideoSearch ? "video-search" : "professional-search"}
          type="search"
          aria-label={`Pesquisar ${isVideoSearch ? "vídeos" : "profissionais"}`}
          placeholder={
            isVideoSearch
              ? "Pesquisar por vídeo ou categoria"
              : "Pesquisar por profissional ou categoria"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span data-testid={isVideoSearch ? "video-result-count" : "explore-result-count"}>
          {resultText} encontrado{results.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="explore-layout">
        <ExploreFilters
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={toggleCategory}
          selectedRatings={selectedRatings}
          onRatingChange={toggleRating}
          onClear={clearFilters}
        />
        <div className="results">
          <div className="result-head">
            <span>
              {resultText} encontrado{results.length === 1 ? "" : "s"}
            </span>
            <label className="result-type">
              <span>Buscar por</span>
              <span className="result-type-control">
                <select
                  aria-label="Buscar por"
                  data-testid="explore-result-type"
                  value={searchType}
                  onChange={changeSearchType}
                >
                  <option value="videos">Vídeos</option>
                  <option value="professionals">Profissionais</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </label>
          </div>
          {isVideoSearch ? (
            <div className="video-grid" data-testid="video-results">
              {results.map((video) => (
                <VideoCard key={video[0]} video={video} go={go} />
              ))}
            </div>
          ) : (
            <div className="professional-grid" data-testid="professional-results">
              {results.map((professional) => (
                <article className="professional-card" key={professional.name}>
                  <img src={professional.image} alt={professional.name} />
                  <div className="professional-card-content">
                    <h2>
                      {professional.name} <ShieldCheck size={14} />
                    </h2>
                    <p>{professional.specialty}</p>
                    <strong>Publica conteúdo sobre</strong>
                    <div className="professional-categories">
                      {professional.categories.map((category) => (
                        <span key={category}>{category}</span>
                      ))}
                    </div>
                    <span className="professional-rating">
                      <Star size={12} fill="currentColor" /> 4,9
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
          {results.length === 0 && (
            <p role="status">
              Nenhum {isVideoSearch ? "vídeo" : "profissional"} encontrado para
              essa busca.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
