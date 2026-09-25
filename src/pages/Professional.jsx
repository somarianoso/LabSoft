import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { img, videos } from "../data/content.js";
import Metric from "../components/Metric.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import VideoCard from "../components/VideoCard.jsx";

export default function Professional() {
  return (
    <main className="wrap page professional">
      <div className="cover" />
      <div className="pro-intro">
        <img src={img.coach} alt="Caio Mendes" />
        <div>
          <h1>
            Caio Mendes <ShieldCheck size={16} />
          </h1>
          <span className="eyebrow">Preparador físico e condicionamento</span>
          <p>
            Especialista em performance esportiva e treinamento de força, com 12
            anos de experiência preparando atletas.
          </p>
        </div>
        <button className="green">
          Seguir profissional <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="stat-row">
        <Metric value="18,4 mil" label="alunos" />
        <Metric value="4,9" label="avaliação média" />
        <Metric value="42" label="vídeos publicados" />
      </div>
      <SectionTitle title="Vídeos publicados" action="Ver todos →" />
      <div className="video-grid">
        {videos.slice(0, 3).map((v) => (
          <VideoCard key={v[0]} video={v} go={() => {}} />
        ))}
      </div>
    </main>
  );
}
