import { useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [role, setRole] = useState("atleta");
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState({ name: "Pro", price: "R$ 59 /mês" });

  const go = (next, payload) => {
    if (next === "detalhe" && payload) setSelectedVideo(payload);
    if (next === "checkout" && payload) setSelectedPlan(payload);
    setPage(next);
    setMenu(false);
    window.scrollTo(0, 0);
  };
  const login = (account) => {
    setUser(account);
    go("home");
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
        user={user}
      />
      <AppRoutes
        page={page}
        go={go}
        login={login}
        selectedVideo={selectedVideo}
        selectedPlan={selectedPlan}
      />
      {!['cadastro', 'login', 'checkout'].includes(page) && <Footer role={role} />}
    </div>
  );
}
