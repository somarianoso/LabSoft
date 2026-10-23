import { useEffect, useState } from "react";
import {
  Check,
  ListPlus,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { img } from "../data/content.js";
import VideoCard from "../components/VideoCard.jsx";
import { addVideoComment, getMyVideoRating, getNextVideos, getVideo } from "../services/wellflix.js";

export default function Detail({
  go,
  video,
  user,
  role,
  customTrails,
  createCustomTrail,
  addVideoToCustomTrail,
  rateVideo,
}) {
  const [selectedVideo, setSelectedVideo] = useState(video || null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [showTrailDialog, setShowTrailDialog] = useState(false);
  const [newTrailName, setNewTrailName] = useState("");
  const [trailNotice, setTrailNotice] = useState("");
  const [comments, setComments] = useState([]);
  const [myBackendRating, setMyBackendRating] = useState(null);
  const isAthlete = role === "atleta";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    const load = async () => {
      const detail = video?.id ? await getVideo(video.id) : video;
      if (!detail) throw new Error("Escolha um vídeo publicado no catálogo.");
      if (active) {
        setSelectedVideo(detail);
        setComments(detail.comments || []);
      }
      const next = detail.id ? await getNextVideos(detail.id).catch(() => []) : [];
      if (active) setRelatedVideos(next);
    };
    load().catch((error) => active && setLoadError(error.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [video?.id]);

  useEffect(() => {
    if (!selectedVideo?.id || !user?.accessToken || role !== "atleta") return;
    let active = true;
    getMyVideoRating(selectedVideo.id, user.accessToken)
      .then((rating) => active && setMyBackendRating(rating?.gostou ?? null))
      .catch(() => active && setMyBackendRating(null));
    return () => { active = false; };
  }, [selectedVideo?.id, user?.accessToken, role]);

  const submitComment = async (event) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    try {
      const comment = await addVideoComment(selectedVideo, text, user.accessToken);
      const name = user.name;
      const initials = name.split(/[.\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
      setComments((current) => [{ id: comment.id, initials, name, text: comment.conteudo }, ...current]);
      setCommentText("");
      setActionError("");
    } catch (error) { setActionError(error.message); }
  };

  const submitNewTrail = (event) => {
    event.preventDefault();
    const name = newTrailName.trim();
    if (!name) return;

    createCustomTrail(name, selectedVideo)
      .then(() => {
        setTrailNotice(`"${name}" criada com este vídeo.`);
        setNewTrailName("");
        setShowTrailDialog(false);
      })
      .catch((error) => setActionError(error.message));
  };

  const addVideoToTrail = (trail) => {
    if (trail.videos.some((savedVideo) => savedVideo[0] === selectedVideo[0])) {
      setTrailNotice(`Este vídeo já está na trilha "${trail.name}".`);
      return;
    }

    addVideoToCustomTrail(trail.id, selectedVideo)
      .then(() => {
        setTrailNotice(`Vídeo adicionado à trilha "${trail.name}".`);
        setShowTrailDialog(false);
      })
      .catch((error) => setActionError(error.message));
  };

  const chooseRating = async (liked) => {
    try {
      await rateVideo(selectedVideo, liked);
      setMyBackendRating(liked);
      setActionError("");
    } catch (error) { setActionError(error.message); }
  };

  if (loading) return <main className="wrap page"><p role="status">Carregando vídeo do backend…</p></main>;
  if (!selectedVideo) return <main className="wrap page"><p role="alert">{loadError || "Vídeo indisponível."}</p></main>;

  return (
    <main className="wrap page detail">
      <div className="detail-main">
        <div className="player" data-testid="video-player">
          {selectedVideo.mediaUrl ? <video src={selectedVideo.mediaUrl} poster={selectedVideo[3] || img.athlete} controls preload="metadata" /> : <img src={selectedVideo[3] || img.athlete} alt={selectedVideo[0]} />}
        </div>
        <span className="video-meta">{selectedVideo[1].toUpperCase()} · CONTEÚDO CERTIFICADO</span>
        <h1 data-testid="video-title">{selectedVideo[0]}</h1>
        <p>{selectedVideo.description || "Conteúdo publicado por um profissional WellFlix."}</p>
        <div className="coach-line">
          <img src={img.coach} alt="Caio Mendes" />
          <div>
            <strong>{selectedVideo.professional || "Profissional WellFlix"}</strong>
            <small>Profissional verificado</small>
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
              <p>Marque se gostou deste conteúdo. Sua escolha será salva no banco.</p>
            </div>
            <div
              className="video-rating-stars"
              role="group"
              aria-label="Sua avaliação"
            >
              <button type="button" className={myBackendRating === false ? "selected" : ""} aria-label="Não gostei" aria-pressed={myBackendRating === false} onClick={() => chooseRating(false)}><ThumbsDown size={22} /></button>
              <button type="button" className={myBackendRating === true ? "selected" : ""} aria-label="Gostei" aria-pressed={myBackendRating === true} onClick={() => chooseRating(true)}><ThumbsUp size={22} /></button>
            </div>
            <span className="video-rating-status" role="status">
              {myBackendRating === null ? "Ainda não avaliado" : myBackendRating ? "Você gostou deste conteúdo" : "Você não gostou deste conteúdo"}
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
        <h2>Comentários {comments.length}</h2>
        {user?.accessToken && role === "atleta" && (
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
        {actionError && <p role="alert">{actionError}</p>}
        {loadError && <p role="alert">{loadError}</p>}
        {comments.map(({ id, initials, name, text }, index) => (
          <div className="comment" key={id || `${name}-${index}`}>
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
        {relatedVideos.slice(0, 3).map((v) => (
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
