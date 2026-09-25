import { CirclePlay, ShieldCheck, Star } from "lucide-react";

export default function VideoCard({ video, go }) {
  return (
    <article className="video-card" onClick={() => go("detalhe")}>
      <div className="video-image">
        <img src={video[3]} alt="" />
        <button className="play">
          <CirclePlay size={19} />
        </button>
        <b>{video[2]}</b>
      </div>
      <span className="video-meta">
        {video[1]} <Star size={11} fill="currentColor" /> 4,9
      </span>
      <h3>{video[0]}</h3>
      <small>
        Caio Mendes <ShieldCheck size={11} />
      </small>
    </article>
  );
}
