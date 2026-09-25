import { videos } from "../data/content.js";

export default function Trails({ go }) {
  return (
    <main className="wrap page">
      <span className="eyebrow">SUA JORNADA CONTINUA</span>
      <h1>Trilhas de Conteúdo</h1>
      <p>
        Programas completos, organizados em partes e episódios sequenciais para
        você evoluir no seu ritmo.
      </p>
      <div className="trail-list">
        {[
          "Programa de Musculação 12 Semanas",
          "Yoga para Iniciantes",
          "Recuperação Pós-Lesão",
        ].map((x, i) => (
          <article className="trail" key={x}>
            <div>
              <span className="eyebrow">
                {i === 0 ? "MUSCULAÇÃO" : i === 1 ? "YOGA" : "RECUPERAÇÃO"}
              </span>
              <h2>{x}</h2>
              <p>
                Uma progressão completa com aulas guiadas e objetivos claros.
              </p>
            </div>
            <button className="green" onClick={() => go("detalhe")}>
              Continuar episódio
            </button>
            <div className="trail-images">
              {videos.slice(i, i + 4).map((v) => (
                <img key={v[0]} src={v[3]} alt="" />
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
