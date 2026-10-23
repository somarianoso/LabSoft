import { CirclePlay, ShieldCheck, Star } from "lucide-react";

export default function VideoCard({ video, go }) {
  return (
    <article
      className="video-card"
      role="link"
      tabIndex={0}
      aria-label={`Assistir vídeo: ${video[0]}`}
      onClick={() => go("detalhe", video)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          go("detalhe", video);
        }
      }}
    >
      <div className="video-image">
        <img src={video[3]} alt="" />
        <span className="play" aria-hidden="true">
          <CirclePlay size={19} />
        </span>
        <b>{video[2]}</b>
      </div>
      <span className="video-meta">
        {video[1]} <Star size={11} fill="currentColor" /> {(video.rating ?? 0).toFixed(1)}
      </span>
      <h3>{video[0]}</h3>
      <small>
        {video.professional || "Profissional WellFlix"} <ShieldCheck size={11} />
      </small>
    </article>
  );
}
