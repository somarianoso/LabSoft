export default function Footer({ role }) {
  return (
    <footer>
      <strong>WellFlix</strong>
      <span>Conteúdos · Profissionais · Planos · Suporte · Termos</span>
      <small>
        © 2026 WellFlix{role === "moderador" && " · Painel do Moderador"}
      </small>
    </footer>
  );
}
