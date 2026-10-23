import {
  ArrowUpRight,
  BriefcaseBusiness,
  CirclePlay,
  ChevronDown,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { img } from "../data/content.js";

export default function Header({ page, role, go, switchRole, menu, setMenu, user, logout }) {
  const availableRoles = user?.roles || [];
  const roleName =
    role === "moderador"
      ? "Moderador"
      : role === "profissional"
        ? "Profissional"
        : "Atleta";
  const navItems =
    role === "moderador"
      ? [["moderador", "Painel Moderador"]]
      : role === "profissional"
        ? [
            ["home", "Início"],
            ["explorar", "Explorar"],
            ["planos", "Planos"],
            ["trilhas", "Minhas trilhas"],
            ["estudio", "Estúdio do criador"],
            ["profissionais", "Meu perfil"],
          ]
        : [
            ["home", "Início"],
            ["explorar", "Explorar"],
            ["planos", "Planos"],
            ["trilhas", "Minhas trilhas"],
          ];
  return (
    <header className={`header header-${role}`}>
      <button className="mobile-menu" onClick={() => setMenu(!menu)}>
        {menu ? <X /> : <Menu />}
      </button>
      <button
        className="logo"
        onClick={() =>
          go(
            role === "moderador"
              ? "moderador"
              : role === "profissional"
                ? "estudio"
                : "home",
          )
        }
      >
        <span>
          <CirclePlay size={16} />
        </span>
        WellFlix
      </button>
      <nav className={menu ? "nav open" : "nav"}>
        {navItems.map(([target, label]) => (
          <button
            className={page === target ? "active" : ""}
            onClick={() => go(target)}
            key={target}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        {availableRoles.length > 1 && <div className="role-switcher">
          <button
            className={`role-trigger${role === "moderador" ? " moderator-trigger" : ""}`}
            aria-label="Selecionar tipo de usuário"
          >
            {role === "moderador" ? (
              <img src={img.coach} alt="" />
            ) : (
              <UserRound size={14} />
            )}
            {role === "moderador" ? "Alexandre S." : roleName}
            <ChevronDown size={13} />
          </button>
          <div className="role-menu">
            <span>Visualizar como</span>
            {availableRoles.includes("atleta") && (
              <button className={role === "atleta" ? "selected" : ""} onClick={() => switchRole("atleta")}>
                <UserRound size={14} /> Atleta comum
              </button>
            )}
            {availableRoles.includes("profissional") && (
              <button className={role === "profissional" ? "selected" : ""} onClick={() => switchRole("profissional")}>
                <BriefcaseBusiness size={14} /> Profissional
              </button>
            )}
            {availableRoles.includes("moderador") && (
              <button className={role === "moderador" ? "selected" : ""} onClick={() => switchRole("moderador")}>
                <ShieldCheck size={14} /> Moderador
              </button>
            )}
          </div>
        </div>}
        <button
          className="login"
          data-testid="header-login"
          onClick={() => user ? logout() : go("login")}
        >
          {user ? "Sair" : "Entrar"}
        </button>
        {role === "atleta" && !user && (
          <button className="green small" onClick={() => go("cadastro")}>
            Começar grátis <ArrowUpRight size={13} />
          </button>
        )}
      </div>
    </header>
  );
}
