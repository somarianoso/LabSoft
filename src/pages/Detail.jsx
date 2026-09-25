import { img, videos } from "../data/content.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Detail({ go }) {
  return (
    <main className="wrap page detail">
      <div className="detail-main">
        <div className="player">
          <img src={img.athlete} alt="Treino de pernas" />
          <div className="player-bar">
            <i />
            <span>04:32 / 28:10</span> ⛶
          </div>
        </div>
        <span className="video-meta">MUSCULAÇÃO · INTERMEDIÁRIO</span>
        <h1>Força total: treino de pernas sem atalhos</h1>
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
