import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, CirclePlay, Search, ShieldCheck, X } from "lucide-react";
import { archiveModeratedVideo, decideModeration, getModerationVideos } from "../services/wellflix.js";

export default function Moderator({ go, user }) {
  const [queue, setQueue] = useState([]);
  const [published, setPublished] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas as categorias");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.accessToken) throw new Error("Entre como moderador para acessar a fila.");
    const [pendingRows, publishedRows, rejectedRows] = await Promise.all([
      getModerationVideos("aguardando_revisao", user.accessToken),
      getModerationVideos("publicado", user.accessToken),
      getModerationVideos("rejeitado", user.accessToken),
    ]);
    setQueue(pendingRows);
    setPublished(publishedRows);
    setRejected(rejectedRows);
  };

  useEffect(() => {
    let active = true;
    if (!user?.accessToken) {
      setError("Entre como moderador para acessar a fila.");
      setLoading(false);
      return undefined;
    }
    Promise.all([
      getModerationVideos("aguardando_revisao", user.accessToken),
      getModerationVideos("publicado", user.accessToken),
      getModerationVideos("rejeitado", user.accessToken),
    ]).then(([pendingRows, publishedRows, rejectedRows]) => {
      if (!active) return;
      setQueue(pendingRows);
      setPublished(publishedRows);
      setRejected(rejectedRows);
    }).catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user?.accessToken]);

  const decide = async (video, decision) => {
    try {
      await decideModeration(video.id, decision, user.accessToken);
      await refresh();
      setNotice(decision === "aprovado" ? "Vídeo aprovado e publicado." : "Vídeo rejeitado.");
      setError("");
    } catch (requestError) { setError(requestError.message); }
  };

  const archive = async (video) => {
    try {
      await archiveModeratedVideo(video.id, user.accessToken);
      await refresh();
      setNotice("Vídeo arquivado.");
    } catch (requestError) { setError(requestError.message); }
  };

  const sourceItems = activeTab === "pending" ? queue : activeTab === "rejected" ? rejected : published;
  const visibleItems = useMemo(() => sourceItems.filter((item) => {
    const matchesSearch = `${item.title} ${item.professional}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    const matchesCategory = category === "Todas as categorias" || item.categories.includes(category);
    return matchesSearch && matchesCategory;
  }), [sourceItems, search, category]);
  const allCategories = [...new Set([...queue, ...published, ...rejected].flatMap((item) => item.categories))];

  return (
    <main className="moderator-page">
      <div className="moderator-heading">
        <div><span className="eyebrow">PAINEL MODERADOR · APROVAÇÃO DE CONTEÚDOS</span><h2>Aprovação de Vídeos</h2></div>
        <span className="pending-count"><i /><span><small>PENDENTES</small><strong>{queue.length} vídeos</strong></span></span>
      </div>
      <div className="moderator-toolbar">
        <div className="moderator-tabs" role="tablist" aria-label="Status dos vídeos">
          {[ ["pending", "Pendentes", queue.length], ["published", "Publicados", published.length], ["rejected", "Rejeitados", rejected.length] ].map(([id, label, count]) => (
            <button className={activeTab === id ? "active" : ""} key={id} onClick={() => setActiveTab(id)} role="tab" aria-selected={activeTab === id}>{label} <span>{count}</span></button>
          ))}
        </div>
        <div className="moderator-tools">
          <label className="moderator-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar vídeo ou profissional..." /></label>
          <label className="moderator-category"><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria"><option>Todas as categorias</option>{allCategories.map((name) => <option key={name}>{name}</option>)}</select><ChevronDown size={13} /></label>
        </div>
      </div>
      {notice && <p role="status" className="moderator-notice">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Carregando dados de moderação…</p>}
      {!loading && !error && (
        <section className="moderator-section">
          <div className="moderator-section-head"><div><span className="eyebrow">CONTEÚDOS {activeTab === "pending" ? "AGUARDANDO DECISÃO" : activeTab === "published" ? "PUBLICADOS" : "REJEITADOS"}</span><h2>{activeTab === "pending" ? "Fila de análise" : activeTab === "published" ? "Conteúdos publicados" : "Conteúdos rejeitados"}</h2></div></div>
          <div className="review-list">
            {visibleItems.map((item) => (
              <article className="review-card" key={item.id}>
                <img src={item.image} alt="" />
                <div className="review-content">
                  <div className="review-title"><h3>{item.title}</h3><span>{item.duration}</span></div>
                  <p><strong>{item.professional}</strong><ShieldCheck size={12} /><i>•</i><b>{item.category}</b><i>•</i> {item.date}</p>
                  <div className="review-actions">
                    <button className="preview" aria-label={`Pré-visualizar ${item.title}`} onClick={() => go("detalhe", { id: item.id })}><CirclePlay size={16} /></button>
                    {activeTab === "pending" && <>
                      <button className="reject" onClick={() => decide(item, "rejeitado")}><X size={13} /> Rejeitar</button>
                      <button className="approve" onClick={() => decide(item, "aprovado")}><Check size={13} /> Aprovar</button>
                    </>}
                    {activeTab === "published" && <button className="reject" onClick={() => archive(item)}>Arquivar</button>}
                  </div>
                </div>
              </article>
            ))}
            {visibleItems.length === 0 && <div className="empty-review">Nenhum conteúdo encontrado nesta lista.</div>}
          </div>
        </section>
      )}
    </main>
  );
}
