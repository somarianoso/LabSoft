import { useState } from "react";
import { CirclePause, CirclePlay } from "lucide-react";
import { img, videos } from "../data/content.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Detail({ go, video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const selectedVideo = video || videos[0];

  return (
    <main className="wrap page detail">
      <div className="detail-main">
        <div className="player" data-testid="video-player">
          <img src={selectedVideo[3] || img.athlete} alt={selectedVideo[0]} />
          <button
            className="player-toggle"
            type="button"
            aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
            data-testid="player-toggle"
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isPlaying ? <CirclePause size={42} /> : <CirclePlay size={42} />}
          </button>
          <span className="player-status" role="status" data-testid="playback-status">
            {isPlaying ? "Reproduzindo prévia" : "Prévia pausada"}
          </span>
          <div className="player-bar">
            <i />
            <span>00:00 / {selectedVideo[2]}</span>
          </div>
        </div>
        <span className="video-meta">{selectedVideo[1].toUpperCase()} · CONTEÚDO CERTIFICADO</span>
        <h1 data-testid="video-title">{selectedVideo[0]}</h1>
        <p>
          Uma sessão completa para construir força, estabilidade e potência.
          Aprenda técnica, progressão de carga e os ajustes que protegem sua
          execução.
        </p>
        <div className="coach-line">
          <img src={img.coach} alt="Caio Mendes" />
          <div>
            <strong>Caio Mendes</strong>
            <small>Preparador físico · CREF verificado</small>
          </div>
          <button className="dark-button">Ver perfil</button>
        </div>
        <h2>Comentários 248</h2>
        {[
          "Treino excelente. A explicação da amplitude no agachamento mudou minha execução.",
          "Didática muito clara e progressão bem estruturada!",
        ].map((x, i) => (
          <div className="comment" key={x}>
            <b>{i ? "ML" : "JP"}</b>
            <span>
              <strong>{i ? "Mia Lima" : "João Pedro"}</strong>
              {x}
            </span>
          </div>
        ))}
      </div>
      <aside className="side-videos">
        <h2>Continue evoluindo</h2>
        {videos.slice(0, 3).map((v) => (
          <VideoCard key={v[0]} video={v} go={go} />
        ))}
      </aside>
    </main>
  );
}
