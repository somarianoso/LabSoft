import { useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { img } from "../data/content.js";

export default function CreatorStudio() {
  const [fileName, setFileName] = useState("");
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
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="creator-section-title">
            <div>
              <span className="eyebrow">NOVO CONTEÚDO</span>
              <h2>Enviar vídeo</h2>
            </div>
            <span className="draft-status">Rascunho</span>
          </div>
          <label className="upload-drop">
            <input
              type="file"
              accept="video/*"
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
            <label>
              Título do vídeo
              <input placeholder="Ex.: Mobilidade para corredores" />
            </label>
            <label>
              Categoria
              <select defaultValue="">
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
            <label className="field-wide">
              Descrição
              <textarea
                placeholder="Conte o que o atleta vai aprender neste vídeo"
                rows="4"
              />
            </label>
          </div>
          <div className="upload-footer">
            <small>
              Após o envio, o vídeo será encaminhado para aprovação do
              moderador.
            </small>
            <button className="green" type="submit">
              Enviar para aprovação <ArrowUpRight size={14} />
            </button>
          </div>
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
