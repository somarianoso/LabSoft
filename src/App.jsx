import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { defaultPlan } from "./data/plans.js";

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

function loadCustomTrails() {
  try {
    const savedTrails = window.localStorage.getItem("wellflix-custom-trails");
    const parsedTrails = savedTrails ? JSON.parse(savedTrails) : [];
    return Array.isArray(parsedTrails) ? parsedTrails : [];
  } catch (error) {
    console.error("Não foi possível carregar suas trilhas salvas.", error);
    return [];
  }
}

function loadVideoRatings() {
  try {
    const savedRatings = window.localStorage.getItem("wellflix-video-ratings");
    const parsedRatings = savedRatings ? JSON.parse(savedRatings) : {};

    if (!parsedRatings || typeof parsedRatings !== "object" || Array.isArray(parsedRatings)) {
      throw new Error("Formato das avaliações salvas inválido.");
    }

    return Object.fromEntries(
      Object.entries(parsedRatings).filter(
        ([, rating]) =>
          Number.isInteger(rating) && rating >= 1 && rating <= 5,
      ),
    );
  } catch (error) {
    console.error("Não foi possível carregar suas avaliações.", error);
    return {};
  }
}

export default function App() {
  const initialPage = pageFromLocation();
  const initialHistoryState = window.history.state || {};
  const [page, setPage] = useState(initialPage);
  const [role, setRole] = useState(
    initialHistoryState.role || roleForPage(initialPage),
  );
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState(null);
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
  const [customTrails, setCustomTrails] = useState(loadCustomTrails);
  const [videoRatings, setVideoRatings] = useState(loadVideoRatings);

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
    try {
      window.localStorage.setItem(
        "wellflix-custom-trails",
        JSON.stringify(customTrails),
      );
    } catch (error) {
      console.error("Não foi possível salvar suas trilhas.", error);
    }
  }, [customTrails]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "wellflix-video-ratings",
        JSON.stringify(videoRatings),
      );
    } catch (error) {
      console.error("Não foi possível salvar suas avaliações.", error);
    }
  }, [videoRatings]);

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
  const createCustomTrail = (name, video) => {
    const newTrail = {
      id: window.crypto.randomUUID(),
      name,
      videos: [video],
    };
    setCustomTrails((current) => [...current, newTrail]);
    return newTrail;
  };
  const addVideoToCustomTrail = (trailId, video) => {
    setCustomTrails((current) =>
      current.map((trail) =>
        trail.id === trailId &&
        !trail.videos.some((savedVideo) => savedVideo[0] === video[0])
          ? { ...trail, videos: [...trail.videos, video] }
          : trail,
      ),
    );
  };
  const rateVideo = (videoTitle, rating) => {
    setVideoRatings((current) => ({ ...current, [videoTitle]: rating }));
  };
  const login = (account) => {
    setUser(account);
    go("home");
  };
  const switchRole = (nextRole) => {
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
        customTrails={customTrails}
        createCustomTrail={createCustomTrail}
        addVideoToCustomTrail={addVideoToCustomTrail}
        videoRatings={videoRatings}
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
