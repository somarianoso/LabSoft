import { ArrowUpRight, ChevronRight } from "lucide-react";
import { cats, img, professionals, videos } from "../data/content.js";
import Expert from "../components/Expert.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import VideoCard from "../components/VideoCard.jsx";

const featuredVideo = [
  "Explosão e velocidade para atletas",
  "Basquete",
  "18 min",
  img.athlete,
];

export default function Home({ go }) {
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
            <span>●●●</span> +18 mil atletas já estão evoluindo
          </div>
        </div>
        <div
          className="hero-art"
          role="link"
          tabIndex={0}
          aria-label={`Assistir vídeo: ${featuredVideo[0]}`}
          onClick={() => go("detalhe", featuredVideo)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              go("detalhe", featuredVideo);
            }
          }}
        >
          <img src={img.athlete} alt="Atleta em movimento" />
          <div className="featured">
            <span>EM DESTAQUE · 18 MIN</span>
            <strong>Explosão e velocidade para atletas</strong>
            <small>
              Com Lucas Freire <ChevronRight size={12} />
            </small>
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
          {cats.map(([name, Icon], i) => (
            <button
              className={i === 0 ? "category selected" : "category"}
              key={name}
              onClick={() => go("explorar", { category: name })}
            >
              <Icon size={18} />
              <strong>{name}</strong>
            </button>
          ))}
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
          {videos.slice(0, 4).map((video) => (
            <VideoCard key={video[0]} video={video} go={go} />
          ))}
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
          {professionals.map((professional) => (
            <Expert
              key={professional.name}
              name={professional.name}
              role={professional.specialty}
              image={professional.image}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
