import { useEffect, useState } from "react";
import { Play, Share2 } from "lucide-react";
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

export default function Trails({ go, customTrails = [] }) {
  const [shareNotice, setShareNotice] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [sharedPlaylist, setSharedPlaylist] = useState(readSharedIds);

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
        await navigator.clipboard?.writeText(shareData.url);
        setShareNotice(`Link de "${trail.name}" copiado.`);
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
        <p>{sharedPlaylist ? "Vídeos desta trilha carregados do catálogo WellFlix." : "Suas trilhas ficam salvas na sua conta e sincronizadas com o backend."}</p>
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
          {customTrails.length ? (
            <div className="custom-trail-list">
              {customTrails.map((trail) => <article className="custom-trail-card" key={trail.id}>
                <div className="custom-trail-heading"><div><span className="eyebrow">TRILHA {trail.privacidade === "publica" ? "PÚBLICA" : "PRIVADA"}</span><h3>{trail.name}</h3><p>{trail.videos.length} {trail.videos.length === 1 ? "vídeo" : "vídeos"}</p></div><button className="dark-button" type="button" onClick={() => shareTrail(trail)}><Share2 size={15} /> Compartilhar</button></div>
                <div className="custom-trail-videos">{trail.videos.map((video, index) => <button className="trail-episode" key={video.id || index} onClick={() => go("detalhe", video)}><span className="trail-episode-image"><img src={video[3]} alt="" /><b>{video[2]}</b><i>{index + 1}</i></span><strong>{video[0]}</strong></button>)}</div>
              </article>)}
            </div>
          ) : <p className="custom-trails-empty">Você ainda não criou trilhas. Abra um vídeo publicado e escolha <strong>Adicionar à minha trilha</strong>.</p>}
          <button className="green" type="button" onClick={() => go("explorar")}>Explorar vídeos <Play size={15} /></button>
        </section>
      )}
    </main>
  );
}
