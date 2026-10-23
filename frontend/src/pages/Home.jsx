import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight, Dumbbell } from "lucide-react";
import { cats, img } from "../data/content.js";
import Expert from "../components/Expert.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { getCategories, getProfessionals, getVideos } from "../services/wellflix.js";

export default function Home({ go }) {
  const [content, setContent] = useState({ categories: [], videos: [], professionals: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const leadVideo = content.videos[0] || null;

  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), getVideos(), getProfessionals()])
      .then(([categories, videos, professionals]) => {
        if (active) setContent({ categories, videos, professionals });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="pill">◉ CONTEÚDO 100% CERTIFICADO</span>
          <h1>
            Seu próximo nível
            <br />
            começa com
            <br />
            orientação certa.
          </h1>
          <p>
            Treinos, nutrição e recuperação guiados por profissionais
            verificados. Evolua com conteúdo em que você pode confiar.
          </p>
          <div className="actions">
            <button className="green" onClick={() => go("explorar")}>
              Explorar conteúdos <ArrowUpRight size={15} />
            </button>
            <button className="dark-button" onClick={() => go("planos")}>
              Conhecer planos
            </button>
          </div>
          <div className="social-proof">
            <span>●●●</span> Conteúdos publicados por profissionais
          </div>
        </div>
        <div
          className="hero-art"
          role={leadVideo ? "link" : undefined}
          tabIndex={leadVideo ? 0 : -1}
          aria-label={leadVideo ? `Assistir vídeo: ${leadVideo[0]}` : "Conteúdo em destaque indisponível"}
          onClick={() => leadVideo && go("detalhe", leadVideo)}
          onKeyDown={(event) => {
            if (leadVideo && event.key === "Enter") {
              event.preventDefault();
              go("detalhe", leadVideo);
            }
          }}
        >
          <img src={img.athlete} alt="Atleta em movimento" />
          <div className="featured">
            {leadVideo ? <>
              <span>EM DESTAQUE · {leadVideo[2]}</span>
              <strong>{leadVideo[0]}</strong>
              <small>Com {leadVideo.professional || "Profissional WellFlix"} <ChevronRight size={12} /></small>
            </> : <>
              <span>{loading ? "CARREGANDO DO CATÁLOGO" : "CATÁLOGO WELLFLIX"}</span>
              <strong>{loading ? "Buscando conteúdo publicado…" : "Nenhum vídeo publicado disponível"}</strong>
            </>}
          </div>
        </div>
      </section>
      <section className="section wrap">
        <SectionTitle
          eyebrow="ENCONTRE SEU FOCO"
          title="Treine do seu jeito"
          action="Ver todas as categorias →"
          onAction={() => go("explorar")}
        />
        <div className="categories">
          {content.categories.map((name, i) => {
            const Icon = cats.find(([categoryName]) => categoryName === name)?.[1] || Dumbbell;
            return (
            <button
              className={i === 0 ? "category selected" : "category"}
              key={name}
              onClick={() => go("explorar", { category: name })}
            >
              <Icon size={18} />
              <strong>{name}</strong>
            </button>
          );})}
          {!loading && content.categories.length === 0 && <p role="status">Nenhuma categoria disponível no backend.</p>}
        </div>
      </section>
      <section className="section wrap">
        <SectionTitle
          eyebrow="EM ALTA"
          title="Conteúdos que movem atletas"
          action="Explorar conteúdos →"
          onAction={() => go("explorar")}
        />
        <div className="video-grid">
          {content.videos.slice(0, 4).map((video) => (
            <VideoCard key={video[0]} video={video} go={go} />
          ))}
          {!loading && content.videos.length === 0 && <p role="status">Nenhum vídeo publicado disponível.</p>}
        </div>
      </section>
      <section className="trust wrap">
        <div>
          <span className="eyebrow blue">PROFISSIONAIS VERIFICADOS</span>
          <h2>
            Experiência real.
            <br />
            Resultados confiáveis.
          </h2>
          <p>
            Cada especialista passa por uma análise rigorosa de formação e
            experiência antes de entrar na plataforma.
          </p>
          <button
            className="green"
            onClick={() => go("explorar", { type: "professionals" })}
          >
            Conheça os especialistas <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="expert-row">
          {content.professionals.slice(0, 3).map((professional) => (
            <Expert
              key={professional.name}
              name={professional.name}
              role={professional.specialty}
              image={professional.image}
            />
          ))}
          {!loading && content.professionals.length === 0 && <p role="status">Nenhum profissional cadastrado.</p>}
        </div>
      </section>
      {error && <p className="wrap" role="alert">Não foi possível carregar o conteúdo do backend: {error}</p>}
    </main>
  );
}
