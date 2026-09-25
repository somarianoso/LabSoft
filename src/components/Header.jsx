import {
  ArrowUpRight,
  BriefcaseBusiness,
  CirclePlay,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { img } from "../data/content.js";

export default function Header({ page, role, go, switchRole, menu, setMenu }) {
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
        <div className="role-switcher">
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
            <button
              className={role === "atleta" ? "selected" : ""}
              onClick={() => switchRole("atleta")}
            >
              <UserRound size={14} /> Atleta comum
            </button>
            <button
              className={role === "profissional" ? "selected" : ""}
              onClick={() => switchRole("profissional")}
            >
              <BriefcaseBusiness size={14} /> Profissional
            </button>
            <button
              className={role === "moderador" ? "selected" : ""}
              onClick={() => switchRole("moderador")}
            >
              <ShieldCheck size={14} /> Moderador
            </button>
          </div>
        </div>
        {role !== "moderador" && (
          <div className="header-search">
            <Search size={14} />
            <input placeholder="Buscar treinos, atletas..." />
          </div>
        )}
        {role !== "moderador" && <button className="login">Entrar</button>}
        {role === "atleta" && (
          <button className="green small" onClick={() => go("cadastro")}>
            Começar grátis <ArrowUpRight size={13} />
          </button>
        )}
      </div>
    </header>
  );
}
