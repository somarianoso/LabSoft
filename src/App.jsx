import { useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { defaultPlan } from "./data/plans.js";

export default function App() {
  const [page, setPage] = useState("home");
  const [role, setRole] = useState("atleta");
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [exploreCategory, setExploreCategory] = useState("Todos");
  const [exploreType, setExploreType] = useState("videos");
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);

  const go = (next, payload) => {
    if (next === "detalhe" && payload) setSelectedVideo(payload);
    if (next === "explorar") {
      setExploreCategory(payload?.category || "Todos");
      setExploreType(payload?.type || "videos");
    }
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
        role={role}
        go={go}
        login={login}
        user={user}
        selectedVideo={selectedVideo}
        exploreCategory={exploreCategory}
        exploreType={exploreType}
        selectedPlan={selectedPlan}
      />
      {!['cadastro', 'login', 'checkout'].includes(page) && <Footer role={role} />}
    </div>
  );
}
