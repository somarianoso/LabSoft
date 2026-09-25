import Home from "../pages/Home.jsx";
import Explore from "../pages/Explore.jsx";
import Plans from "../pages/Plans.jsx";
import Professional from "../pages/Professional.jsx";
import CreatorStudio from "../pages/CreatorStudio.jsx";
import Trails from "../pages/Trails.jsx";
import Detail from "../pages/Detail.jsx";
import Moderator from "../pages/Moderator.jsx";
import Signup from "../pages/Signup.jsx";
import Checkout from "../pages/Checkout.jsx";

const routes = {
  home: Home,
  explorar: Explore,
  planos: Plans,
  profissionais: Professional,
  estudio: CreatorStudio,
  trilhas: Trails,
  detalhe: Detail,
  moderador: Moderator,
  cadastro: Signup,
};
const routesWithNavigation = new Set([
  "home",
  "explorar",
  "planos",
  "profissionais",
  "trilhas",
  "detalhe",
]);

export default function AppRoutes({ page, go, login, selectedVideo, selectedPlan }) {
  if (page === "login") {
    return <Signup mode="login" go={go} onSuccess={login} />;
  }
  if (page === "cadastro") {
    return <Signup go={go} />;
  }
  if (page === "checkout") {
    return <Checkout plan={selectedPlan} go={go} />;
  }
  if (page === "detalhe") {
    return <Detail go={go} video={selectedVideo} />;
  }
  const Page = routes[page] || Home;
  return <Page {...(routesWithNavigation.has(page) ? { go } : {})} />;
}
