import { useEffect, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { img } from "../data/content.js";
import { getCategoryRecords, getMyProfessionalRecord, getMySubmissions, submitVideo } from "../services/wellflix.js";

export default function CreatorStudio({ user }) {
  const [categories, setCategories] = useState([]);
  const [allowedCategories, setAllowedCategories] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.accessToken) return;
    Promise.all([
      getCategoryRecords(),
      getMyProfessionalRecord(user.accessToken),
      getMySubmissions(user.accessToken),
    ]).then(([allCategories, profile, videos]) => {
      setCategories(allCategories);
      setAllowedCategories(profile.categorias || []);
      setSubmissions(videos);
    }).catch((error) => setFeedback({ type: "error", message: error.message }));
  }, [user?.accessToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.accessToken) {
      setFeedback({ type: "error", message: "Entre como profissional para enviar conteúdo." });
      return;
    }
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    setIsSubmitting(true);
    try {
      const created = await submitVideo({
        titulo: form.get("video-title").toString().trim(),
        categorias: [form.get("video-category").toString()],
        descricao: form.get("video-description").toString().trim(),
        duracao_segundos: Number(form.get("video-duration")),
        url_conteudo: form.get("video-url").toString().trim(),
      }, user.accessToken);
      setSubmissions((current) => [{
        id: created.id,
        0: created.titulo,
        status: created.situacao,
        createdAt: created.data_criacao,
      }, ...current]);
      formElement.reset();
      setFeedback({ type: "success", message: `${created.titulo} enviado para análise.` });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally { setIsSubmitting(false); }
  };

  return (
    <main className="creator-page">
      <section className="creator-hero">
        <div>
          <span className="eyebrow blue">ÁREA DO PROFISSIONAL</span>
          <h1>Estúdio do criador</h1>
          <p>Publique metadados de conteúdo hospedado e acompanhe a revisão no backend.</p>
        </div>
        <div className="creator-profile">
          <img src={img.coach} alt={user?.name || "Profissional"} />
          <span><strong>{user?.name || "Profissional"}</strong><small>Conta autenticada</small></span>
          <ShieldCheck size={15} />
        </div>
      </section>
      <section className="creator-layout">
        <form className="upload-panel" onSubmit={handleSubmit} noValidate>
          <div className="creator-section-title">
            <div><span className="eyebrow">NOVO CONTEÚDO</span><h2>Enviar vídeo</h2></div>
            <span className="draft-status" data-testid="upload-state">{feedback?.type === "success" ? "Em análise" : "Rascunho"}</span>
          </div>
          <div className="creator-fields">
            <label className="field-wide" htmlFor="video-url">URL pública do vídeo<input id="video-url" name="video-url" type="url" placeholder="https://.../video.mp4" required /></label>
          </div>
          <div className="creator-fields">
            <label htmlFor="video-title">Título do vídeo<input id="video-title" name="video-title" placeholder="Ex.: Mobilidade para corredores" required /></label>
            <label htmlFor="video-category">Categoria
              <select id="video-category" name="video-category" defaultValue="" required>
                <option value="" disabled>Selecione uma categoria</option>
                {categories.filter((category) => allowedCategories.some((allowed) => allowed.id === category.id)).map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
              </select>
            </label>
            <label htmlFor="video-duration">Duração em segundos<input id="video-duration" name="video-duration" type="number" min="1" defaultValue="600" required /></label>
            <label className="field-wide" htmlFor="video-description">Descrição<textarea id="video-description" name="video-description" placeholder="Conte o que o atleta vai aprender neste vídeo" rows="4" required /></label>
          </div>
          <div className="upload-footer">
            <small>O arquivo deve estar hospedado em uma URL acessível. O banco guarda apenas essa URL; o serviço de upload de arquivos ainda não está configurado.</small>
            <button className="green" type="submit" data-testid="upload-submit" disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar para aprovação"} <ArrowUpRight size={14} /></button>
          </div>
          {feedback && <p role={feedback.type === "error" ? "alert" : "status"}>{feedback.message}</p>}
        </form>
        <aside className="creator-side">
          <div className="creator-stat"><span>CONTEÚDOS</span><strong>{submissions.length}</strong><small>Carregados do backend</small></div>
          <div className="creator-list">
            <span className="eyebrow">SEUS ENVIOS</span>
            {submissions.map((video) => <div className="creator-item" key={video.id}><span className="creator-dot dot-0" /><div><strong>{video[0]}</strong><small>{video.status} · {new Date(video.createdAt).toLocaleDateString("pt-BR")}</small></div></div>)}
            {submissions.length === 0 && <p>Nenhum envio cadastrado.</p>}
          </div>
        </aside>
      </section>
    </main>
  );
}
