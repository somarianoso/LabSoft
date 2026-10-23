import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { defaultPlan } from "./data/plans.js";
import {
  addTrailVideo,
  clearSession,
  createTrail,
  getMyTrails,
  readSession,
  saveSession,
  saveVideoRating,
} from "./services/wellflix.js";

const pathsByPage = {
  home: "/inicio",
  explorar: "/explorar",
  planos: "/planos",
  profissionais: "/profissionais",
  estudio: "/estudio",
  trilhas: "/trilhas",
  detalhe: "/detalhe",
  moderador: "/moderador",
  cadastro: "/cadastro",
  login: "/entrar",
  checkout: "/checkout",
};
const pagesByPath = Object.fromEntries(
  Object.entries(pathsByPage).map(([page, path]) => [path, page]),
);

function pageFromLocation() {
  return pagesByPath[window.location.pathname] || "home";
}

function roleForPage(page) {
  if (page === "moderador") return "moderador";
  if (page === "estudio") return "profissional";
  return "atleta";
}

export default function App() {
  const initialPage = pageFromLocation();
  const initialHistoryState = window.history.state || {};
  const savedSession = readSession();
  const [page, setPage] = useState(initialPage);
  const [role, setRole] = useState(
    savedSession?.role || initialHistoryState.role || roleForPage(initialPage),
  );
  const [menu, setMenu] = useState(false);
  const [authSession, setAuthSession] = useState(savedSession);
  const user = authSession?.user
    ? { ...authSession.user, accessToken: authSession.accessToken }
    : null;
  const [selectedVideo, setSelectedVideo] = useState(
    initialHistoryState.selectedVideo || null,
  );
  const [exploreCategory, setExploreCategory] = useState(
    initialHistoryState.exploreCategory || "Todos",
  );
  const [exploreType, setExploreType] = useState(
    initialHistoryState.exploreType || "videos",
  );
  const [selectedPlan, setSelectedPlan] = useState(
    initialHistoryState.selectedPlan || defaultPlan,
  );
  const [customTrails, setCustomTrails] = useState([]);

  useEffect(() => {
    const restoreNavigation = (navigationState) => {
      const restoredPage = pageFromLocation();
      const state = navigationState || {};

      setPage(restoredPage);
      setRole(state.role || roleForPage(restoredPage));
      setSelectedVideo(state.selectedVideo || null);
      setExploreCategory(state.exploreCategory || "Todos");
      setExploreType(state.exploreType || "videos");
      setSelectedPlan(state.selectedPlan || defaultPlan);
      setMenu(false);
      window.scrollTo(0, 0);
    };

    const path = `${pathsByPage[page] || pathsByPage.home}${
      page === "trilhas" ? window.location.search : ""
    }`;
    window.history.replaceState(
      {
        ...initialHistoryState,
        page,
        role,
        selectedVideo,
        exploreCategory,
        exploreType,
        selectedPlan,
      },
      "",
      path,
    );
    const handlePopState = (event) => restoreNavigation(event.state);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!user?.accessToken) {
      setCustomTrails([]);
      return;
    }
    let active = true;
    getMyTrails(user.accessToken)
      .then((trails) => active && setCustomTrails(trails))
      .catch((error) => console.error("Não foi possível carregar suas trilhas do backend.", error));
    return () => { active = false; };
  }, [user?.accessToken]);

  const go = (next, payload, nextRole = role) => {
    const navigationState = {
      page: next,
      role: nextRole,
      selectedVideo:
        next === "detalhe" && payload ? payload : selectedVideo,
      exploreCategory:
        next === "explorar" ? payload?.category || "Todos" : exploreCategory,
      exploreType:
        next === "explorar" ? payload?.type || "videos" : exploreType,
      selectedPlan:
        next === "checkout" && payload ? payload : selectedPlan,
    };

    window.history.pushState(
      navigationState,
      "",
      pathsByPage[next] || pathsByPage.home,
    );
    setRole(nextRole);
    setSelectedVideo(navigationState.selectedVideo);
    setExploreCategory(navigationState.exploreCategory);
    setExploreType(navigationState.exploreType);
    setSelectedPlan(navigationState.selectedPlan);
    setPage(next);
    setMenu(false);
    window.scrollTo(0, 0);
  };
  const createCustomTrail = async (name, video) => {
    if (!user?.accessToken) throw new Error("Entre na sua conta de atleta para criar uma trilha.");
    const newTrail = await createTrail(name, video, user.accessToken);
    setCustomTrails((current) => [newTrail, ...current]);
    return newTrail;
  };
  const addVideoToCustomTrail = async (trailId, video) => {
    if (!user?.accessToken) throw new Error("Entre na sua conta de atleta para editar uma trilha.");
    await addTrailVideo(trailId, video, user.accessToken);
    setCustomTrails((current) =>
      current.map((trail) =>
        trail.id === trailId &&
        !trail.videos.some((savedVideo) => savedVideo[0] === video[0])
          ? { ...trail, videos: [...trail.videos, video] }
          : trail,
      ),
    );
  };
  const rateVideo = async (video, liked) => {
    if (!user?.accessToken) throw new Error("Entre na sua conta de atleta para avaliar vídeos.");
    await saveVideoRating(video, liked, user.accessToken);
  };
  const login = (session) => {
    saveSession(session);
    setAuthSession(session);
    setRole(session.role);
    go("home", undefined, session.role);
  };
  const switchRole = (nextRole) => {
    if (!user?.roles?.includes(nextRole)) return;
    go(
      nextRole === "moderador"
        ? "moderador"
        : nextRole === "profissional"
          ? "estudio"
          : "home",
      undefined,
      nextRole,
    );
  };
  const logout = () => {
    clearSession();
    setAuthSession(null);
    setRole("atleta");
    go("home", undefined, "atleta");
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
        logout={logout}
      />
      <AppRoutes
        page={page}
        role={role}
        go={go}
        login={login}
        user={user}
        customTrails={customTrails}
        createCustomTrail={createCustomTrail}
        addVideoToCustomTrail={addVideoToCustomTrail}
        rateVideo={rateVideo}
        selectedVideo={selectedVideo}
        exploreCategory={exploreCategory}
        exploreType={exploreType}
        selectedPlan={selectedPlan}
      />
      {!['cadastro', 'login', 'checkout'].includes(page) && <Footer role={role} />}
    </div>
  );
}
