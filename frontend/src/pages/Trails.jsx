import { useEffect, useState } from "react";
import { Play, Share2, Trash2 } from "lucide-react";
import { getVideo } from "../services/wellflix.js";

function readSharedIds() {
  const raw = new URLSearchParams(window.location.search).get("playlist");
  if (!raw) return null;
  try {
    const playlist = JSON.parse(raw);
    if (typeof playlist.name !== "string" || !Array.isArray(playlist.videoIds) || playlist.videoIds.length === 0) return { name: "", videos: [], invalid: true };
    return { name: playlist.name, videoIds: playlist.videoIds };
  } catch {
    return { name: "", videos: [], invalid: true };
  }
}

export default function Trails({ go, user, customTrails = [], trailsLoading, trailsError, deleteCustomTrail, removeVideoFromCustomTrail }) {
  const [shareNotice, setShareNotice] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [sharedPlaylist, setSharedPlaylist] = useState(readSharedIds);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState("");

  const confirmDeletion = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setActionError("");
    try {
      if (pendingDeletion.video) {
        await removeVideoFromCustomTrail(pendingDeletion.trail.id, pendingDeletion.video.id);
        setShareNotice("Vídeo removido da trilha.");
      } else {
        await deleteCustomTrail(pendingDeletion.trail.id);
        setShareNotice("Trilha excluída.");
      }
      setShareLink("");
      setPendingDeletion(null);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!sharedPlaylist?.videoIds?.length) return;
    let active = true;
    Promise.all(sharedPlaylist.videoIds.map((id) => getVideo(id)))
      .then((videos) => active && setSharedPlaylist((current) => ({ ...current, videos })))
      .catch(() => active && setSharedPlaylist((current) => ({ ...current, invalid: true })));
    return () => { active = false; };
  }, []);

  const shareTrail = async (trail) => {
    const shareUrl = new URL("/trilhas", window.location.origin);
    shareUrl.searchParams.set("playlist", JSON.stringify({ name: trail.name, videoIds: trail.videos.map((video) => video.id) }));
    const shareData = { title: trail.name, text: `Confira minha trilha "${trail.name}" no WellFlix.`, url: shareUrl.toString() };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareNotice(`Link de "${trail.name}" compartilhado.`);
      } else {
        setShareLink(shareData.url);
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareData.url);
          setShareNotice(`Link de "${trail.name}" copiado.`);
        } else {
          setShareNotice("Copie o link exibido para compartilhar a trilha.");
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setShareLink(shareData.url);
        setShareNotice("Não foi possível copiar automaticamente. Copie o link exibido.");
      }
    }
  };

  return (
    <main className="wrap page trails-page">
      <header className="trails-intro">
        <span className="eyebrow">SUA JORNADA CONTINUA</span>
        <h1>{sharedPlaylist ? sharedPlaylist.name || "Trilha compartilhada" : "Minhas trilhas"}</h1>
        <p>{sharedPlaylist ? "Uma seleção de vídeos do WellFlix para você assistir em sequência." : "Monte sequências de vídeos e acompanhe seu progresso."}</p>
      </header>

      {sharedPlaylist ? (
        sharedPlaylist.invalid ? <p role="alert">Este link de trilha é inválido ou os vídeos não estão disponíveis.</p> :
          !sharedPlaylist.videos ? <p role="status">Carregando trilha compartilhada…</p> :
            <section className="custom-trail-videos">
              {sharedPlaylist.videos.map((video) => <button className="trail-episode" key={video.id} onClick={() => go("detalhe", video)}><span className="trail-episode-image"><img src={video[3]} alt="" /><b>{video[2]}</b></span><strong>{video[0]}</strong></button>)}
            </section>
      ) : (
        <section className="custom-trails-section" aria-labelledby="my-trails-title">
          <div className="custom-trails-heading">
            <div><h2 id="my-trails-title">Suas trilhas</h2><p>Crie e organize suas trilhas a partir dos vídeos publicados.</p></div>
            {shareNotice && <span role="status">{shareNotice}</span>}
          </div>
          {shareLink && <div className="custom-trail-share"><label htmlFor="custom-trail-share-link">Link compartilhável</label><div><input id="custom-trail-share-link" value={shareLink} readOnly onFocus={(event) => event.target.select()} /><button className="dark-button" onClick={() => navigator.clipboard?.writeText(shareLink)}>Copiar link</button></div></div>}
          {!user ? (
            <div className="custom-trails-empty"><p>Entre na sua conta de atleta para ver e criar suas trilhas.</p><button className="green" type="button" onClick={() => go("login")}>Entrar</button></div>
          ) : !user.roles?.includes("atleta") ? (
            <p className="custom-trails-empty">As trilhas são para contas de atleta. Entre com uma conta de atleta para montar as suas.</p>
          ) : trailsLoading ? <p role="status">Carregando suas trilhas…</p> : trailsError ? <p role="alert" className="custom-trails-empty">{trailsError}</p> : customTrails.length ? (
            <div className="custom-trail-list">
              {customTrails.map((trail) => <article className="custom-trail-card" key={trail.id}>
                <div className="custom-trail-heading">
                  <div><span className="eyebrow">TRILHA {trail.privacidade === "publica" ? "PÚBLICA" : "PRIVADA"}</span><h3>{trail.name}</h3><p>{trail.videos.length} {trail.videos.length === 1 ? "vídeo" : "vídeos"}</p></div>
                  <div className="custom-trail-actions">
                    <button className="dark-button" type="button" disabled={!trail.videos.length} onClick={() => shareTrail(trail)}><Share2 size={15} /> Compartilhar</button>
                    <button className="dark-button" type="button" aria-label={`Excluir trilha ${trail.name}`} onClick={() => { setActionError(""); setPendingDeletion({ trail }); }}><Trash2 size={15} /> Excluir trilha</button>
                  </div>
                </div>
                {trail.videos.length ? <div className="custom-trail-videos">{trail.videos.map((video, index) => <div className="custom-trail-video" key={video.id}>
                  <button type="button" className="trail-episode" onClick={() => go("detalhe", video)}><span className="trail-episode-image"><img src={video[3]} alt="" /><b>{video[2]}</b><i>{index + 1}</i></span><strong>{video[0]}</strong></button>
                  <button className="dark-button" type="button" aria-label={`Remover ${video[0]} da trilha ${trail.name}`} onClick={() => { setActionError(""); setPendingDeletion({ trail, video }); }}><Trash2 size={14} /> Remover vídeo</button>
                </div>)}</div> : <p>Esta trilha está vazia. Adicione vídeos pelo catálogo.</p>}
              </article>)}
            </div>
          ) : <p className="custom-trails-empty">Você ainda não criou trilhas. Abra um vídeo publicado e escolha <strong>Adicionar à minha trilha</strong>.</p>}
          <button className="green custom-trails-explore" type="button" onClick={() => go("explorar")}>Explorar vídeos <Play size={15} /></button>
        </section>
      )}
      {pendingDeletion && <div className="trail-dialog-backdrop">
        <section className="trail-dialog" role="dialog" aria-modal="true" aria-labelledby="trail-delete-title" aria-describedby="trail-delete-description">
          <h2 id="trail-delete-title">{pendingDeletion.video ? "Remover vídeo da trilha?" : "Excluir trilha?"}</h2>
          <p id="trail-delete-description">{pendingDeletion.video
            ? `O vídeo "${pendingDeletion.video[0]}" será retirado de "${pendingDeletion.trail.name}". Seu progresso nesta trilha será apagado.`
            : `A trilha "${pendingDeletion.trail.name}" e seu progresso serão apagados. Os vídeos do catálogo serão mantidos.`}</p>
          {actionError && <p role="alert">{actionError}</p>}
          <div className="custom-trail-actions">
            <button className="dark-button" type="button" autoFocus disabled={isUpdating} onClick={() => setPendingDeletion(null)}>Cancelar</button>
            <button className="green" type="button" disabled={isUpdating} onClick={confirmDeletion}>{isUpdating ? "Aguarde…" : "Confirmar"}</button>
          </div>
        </section>
      </div>}
    </main>
  );
}
