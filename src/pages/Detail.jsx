import { useState } from "react";
import {
  Check,
  CirclePause,
  CirclePlay,
  ListPlus,
  Plus,
  Star,
  X,
} from "lucide-react";
import { img, videos } from "../data/content.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Detail({
  go,
  video,
  user,
  role,
  customTrails,
  createCustomTrail,
  addVideoToCustomTrail,
  videoRatings,
  rateVideo,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(248);
  const [showTrailDialog, setShowTrailDialog] = useState(false);
  const [newTrailName, setNewTrailName] = useState("");
  const [trailNotice, setTrailNotice] = useState("");
  const [comments, setComments] = useState([
    {
      initials: "JP",
      name: "João Pedro",
      text: "Treino excelente. A explicação da amplitude no agachamento mudou minha execução.",
    },
    {
      initials: "ML",
      name: "Mia Lima",
      text: "Didática muito clara e progressão bem estruturada!",
    },
  ]);
  const selectedVideo = video || videos[0];
  const isAthlete = role === "atleta";
  const currentRating = videoRatings[selectedVideo[0]] || 0;

  const submitComment = (event) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    const name = user.name;
    const initials =
      name
        .split(/[.\s_-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "U";

    setComments((current) => [...current, { initials, name, text }]);
    setCommentCount((count) => count + 1);
    setCommentText("");
  };

  const submitNewTrail = (event) => {
    event.preventDefault();
    const name = newTrailName.trim();
    if (!name) return;

    createCustomTrail(name, selectedVideo);
    setTrailNotice(`"${name}" criada com este vídeo.`);
    setNewTrailName("");
    setShowTrailDialog(false);
  };

  const addVideoToTrail = (trail) => {
    if (trail.videos.some((savedVideo) => savedVideo[0] === selectedVideo[0])) {
      setTrailNotice(`Este vídeo já está na trilha "${trail.name}".`);
      return;
    }

    addVideoToCustomTrail(trail.id, selectedVideo);
    setTrailNotice(`Vídeo adicionado à trilha "${trail.name}".`);
    setShowTrailDialog(false);
  };

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
          <button
            className="dark-button"
            type="button"
            onClick={() => go("profissionais")}
          >
            Ver perfil
          </button>
        </div>
        {isAthlete && (
          <section
            className="video-rating"
            aria-labelledby="video-rating-title"
          >
            <div>
              <h2 id="video-rating-title">Avalie este vídeo</h2>
              <p>Como você avalia este conteúdo?</p>
            </div>
            <div
              className="video-rating-stars"
              role="group"
              aria-label="Sua avaliação"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={rating <= currentRating ? "selected" : ""}
                  aria-label={`Avaliar com ${rating} ${
                    rating === 1 ? "estrela" : "estrelas"
                  }`}
                  aria-pressed={currentRating === rating}
                  onClick={() => rateVideo(selectedVideo[0], rating)}
                >
                  <Star
                    size={23}
                    fill={rating <= currentRating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <span className="video-rating-status" role="status">
              {currentRating
                ? `Sua avaliação: ${currentRating} de 5 ${
                    currentRating === 1 ? "estrela" : "estrelas"
                  }`
                : "Selecione de 1 a 5 estrelas"}
            </span>
          </section>
        )}
        {isAthlete && (
          <section
            className="video-trail-actions"
            aria-label="Adicionar vídeo a uma trilha"
          >
            <button
              className="dark-button"
              type="button"
              onClick={() => {
                setTrailNotice("");
                setShowTrailDialog(true);
              }}
            >
              <ListPlus size={16} />
              Adicionar à minha trilha
            </button>
            {trailNotice && (
              <span role="status">
                <Check size={14} />
                {trailNotice}
              </span>
            )}
          </section>
        )}
        <h2>Comentários {commentCount}</h2>
        {user && (
          <form className="comment-form" onSubmit={submitComment}>
            <label htmlFor="video-comment">Deixe seu comentário</label>
            <textarea
              id="video-comment"
              data-testid="video-comment"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="O que achou deste vídeo?"
              rows={3}
              required
            />
            <button
              className="green"
              type="submit"
              data-testid="submit-video-comment"
            >
              Enviar comentário
            </button>
          </form>
        )}
        {comments.map(({ initials, name, text }, index) => (
          <div className="comment" key={`${name}-${index}`}>
            <b>{initials}</b>
            <span>
              <strong>{name}</strong>
              {text}
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
      {showTrailDialog && (
        <div
          className="trail-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowTrailDialog(false);
            }
          }}
        >
          <section
            className="trail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trail-dialog-title"
          >
            <header>
              <div>
                <span className="eyebrow">SUAS PLAYLISTS</span>
                <h2 id="trail-dialog-title">Adicionar à trilha</h2>
              </div>
              <button
                className="trail-dialog-close"
                type="button"
                aria-label="Fechar"
                onClick={() => setShowTrailDialog(false)}
              >
                <X size={18} />
              </button>
            </header>
            <p className="trail-dialog-video">{selectedVideo[0]}</p>
            {customTrails.length > 0 ? (
              <div className="trail-dialog-list">
                {customTrails.map((trail) => {
                  const alreadyAdded = trail.videos.some(
                    (savedVideo) => savedVideo[0] === selectedVideo[0],
                  );
                  return (
                    <button
                      key={trail.id}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addVideoToTrail(trail)}
                    >
                      <span>
                        <strong>{trail.name}</strong>
                        <small>
                          {trail.videos.length}{" "}
                          {trail.videos.length === 1 ? "vídeo" : "vídeos"}
                        </small>
                      </span>
                      {alreadyAdded ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="trail-dialog-empty">
                Você ainda não tem trilhas. Crie uma para organizar seus vídeos.
              </p>
            )}
            <form className="trail-create-form" onSubmit={submitNewTrail}>
              <label htmlFor="new-trail-name">Criar uma nova trilha</label>
              <input
                id="new-trail-name"
                value={newTrailName}
                onChange={(event) => setNewTrailName(event.target.value)}
                placeholder="Ex.: Treinos da semana"
                maxLength={60}
                required
              />
              <button className="green" type="submit">
                <Plus size={15} />
                Criar trilha
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
