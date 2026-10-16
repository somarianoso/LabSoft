import { useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { img } from "../data/content.js";

export default function CreatorStudio() {
  const [fileName, setFileName] = useState("");
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const missingFields = ["video-title", "video-category", "video-description"]
      .some((field) => !form.get(field)?.toString().trim());

    if (!fileName || missingFields) {
      setFeedback({
        type: "error",
        message: "Selecione um vídeo e preencha os campos obrigatórios.",
      });
      return;
    }

    setFeedback({
      type: "success",
      message: `${form.get("video-title")} enviado para aprovação.`,
    });
  };

  return (
    <main className="creator-page">
      <section className="creator-hero">
        <div>
          <span className="eyebrow blue">ÁREA DO PROFISSIONAL</span>
          <h1>Estúdio do criador</h1>
          <p>
            Publique seus conteúdos, organize suas categorias e acompanhe o que
            está aguardando aprovação.
          </p>
        </div>
        <div className="creator-profile">
          <img src={img.coach} alt="Caio Mendes" />
          <span>
            <strong>Caio Mendes</strong>
            <small>Preparador físico verificado</small>
          </span>
          <ShieldCheck size={15} />
        </div>
      </section>
      <section className="creator-layout">
        <form
          className="upload-panel"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="creator-section-title">
            <div>
              <span className="eyebrow">NOVO CONTEÚDO</span>
              <h2>Enviar vídeo</h2>
            </div>
            <span className="draft-status" data-testid="upload-state">
              {feedback?.type === "success" ? "Em análise" : "Rascunho"}
            </span>
          </div>
          <label className="upload-drop">
            <input
              type="file"
              accept="video/*"
              id="video-file"
              name="video-file"
              data-testid="video-file"
              aria-label="Selecionar arquivo de vídeo"
              onChange={(event) =>
                setFileName(event.target.files?.[0]?.name || "")
              }
            />
            <span className="upload-icon">↑</span>
            <strong>{fileName || "Arraste seu vídeo aqui"}</strong>
            <small>
              {fileName
                ? "Arquivo selecionado"
                : "ou clique para selecionar um arquivo MP4 ou MOV"}
            </small>
          </label>
          <div className="creator-fields">
            <label htmlFor="video-title">
              Título do vídeo
              <input
                id="video-title"
                name="video-title"
                placeholder="Ex.: Mobilidade para corredores"
                required
              />
            </label>
            <label htmlFor="video-category">
              Categoria
              <select id="video-category" name="video-category" defaultValue="" required>
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                <option>Musculação</option>
                <option>Yoga</option>
                <option>Basquete</option>
                <option>Nutrição</option>
                <option>Prevenção</option>
              </select>
            </label>
            <label className="field-wide" htmlFor="video-description">
              Descrição
              <textarea
                id="video-description"
                name="video-description"
                placeholder="Conte o que o atleta vai aprender neste vídeo"
                rows="4"
                required
              />
            </label>
          </div>
          <div className="upload-footer">
            <small>
              Após o envio, o vídeo será encaminhado para aprovação do
              moderador.
            </small>
            <button
              className="green"
              type="submit"
              data-testid="upload-submit"
            >
              Enviar para aprovação <ArrowUpRight size={14} />
            </button>
          </div>
          {feedback && (
            <p
              id="upload-feedback"
              role={feedback.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {feedback.message}
            </p>
          )}
        </form>
        <aside className="creator-side">
          <div className="creator-stat">
            <span>CONTEÚDOS PUBLICADOS</span>
            <strong>42</strong>
            <small>+ 6 neste mês</small>
          </div>
          <div className="creator-stat">
            <span>EM ANÁLISE</span>
            <strong>3</strong>
            <small>Aguardando moderador</small>
          </div>
          <div className="creator-list">
            <span className="eyebrow">ÚLTIMOS ENVIOs</span>
            {[
              "Mobilidade de tornozelo",
              "Core forte para qualquer esporte",
              "Técnica de agachamento",
            ].map((title, index) => (
              <div className="creator-item" key={title}>
                <span className={`creator-dot dot-${index}`} />
                <div>
                  <strong>{title}</strong>
                  <small>
                    {index === 0
                      ? "Em análise · enviado hoje"
                      : "Publicado · 4,9"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
