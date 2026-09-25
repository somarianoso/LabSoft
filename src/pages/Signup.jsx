import { ArrowUpRight } from "lucide-react";
import { img } from "../data/content.js";

export default function Signup() {
  return (
    <main className="signup">
      <div
        className="signup-art"
        style={{ backgroundImage: `url(${img.athlete})` }}
      >
        <button className="logo">◉ WellFlix</button>
        <div>
          <h1>
            Consistência ganha
            <br />
            quando direção e<br />
            movimento jogam juntos.
          </h1>
          <span>Conteúdo certificado para resultados reais.</span>
        </div>
      </div>
      <form className="signup-form">
        <div className="tabs">
          <button>Entrar</button>
          <button className="selected">Criar conta</button>
        </div>
        <h2>Que bom ter você aqui</h2>
        <p>Entre para continuar sua evolução.</p>
        {["Nome completo", "E-mail", "Senha"].map((x, i) => (
          <label key={x}>
            {x}
            <input
              placeholder={
                i === 0 ? "Seu nome" : i === 1 ? "voce@email.com" : "••••••••"
              }
            />
          </label>
        ))}
        <label className="creator-check">
          <input type="checkbox" /> Quero me cadastrar como profissional
        </label>
        <button className="green">
          Cadastrar <ArrowUpRight size={13} />
        </button>
      </form>
    </main>
  );
}
