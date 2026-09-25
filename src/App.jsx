import { useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [role, setRole] = useState("atleta");
  const [menu, setMenu] = useState(false);

  const go = (next) => {
    setPage(next);
    setMenu(false);
    window.scrollTo(0, 0);
  };
  const switchRole = (nextRole) => {
    setRole(nextRole);
    go(
      nextRole === "moderador"
        ? "moderador"
        : nextRole === "profissional"
          ? "estudio"
          : "home",
    );
  };
  return (
    <div className="site">
      <Header
        page={page}
        role={role}
        go={go}
        switchRole={switchRole}
        menu={menu}
        setMenu={setMenu}
      />
      <AppRoutes page={page} go={go} />
      {page !== "cadastro" && <Footer role={role} />}
    </div>
  );
}
