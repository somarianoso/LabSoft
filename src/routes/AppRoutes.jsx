import Home from "../pages/Home.jsx";
import Explore from "../pages/Explore.jsx";
import Plans from "../pages/Plans.jsx";
import Professional from "../pages/Professional.jsx";
import CreatorStudio from "../pages/CreatorStudio.jsx";
import Trails from "../pages/Trails.jsx";
import Detail from "../pages/Detail.jsx";
import Moderator from "../pages/Moderator.jsx";
import Signup from "../pages/Signup.jsx";

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

export default function AppRoutes({ page, go }) {
  const Page = routes[page] || Home;
  return <Page {...(routesWithNavigation.has(page) ? { go } : {})} />;
}
