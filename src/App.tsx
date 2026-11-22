import { useEffect, type ComponentType } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { redirectUnauthorizedUser, hasValidTokenExpiration } from "./utils/auth";
import Cadastro from "./pages/userSignup";
import AppointmentsPage from "./pages/atendimento";
import CategoriesPage from "./pages/categoria";
import ClientsPage from "./pages/cliente";
import ProfessionalsPage from "./pages/profissional";
import ProceduresPage from "./pages/procedimento";
import UsersPage from "./pages/usuario";
import Login from "./pages/login";
import DashboardPage from "./pages/dashboard";
import NotFound from "./pages/notFound";

type ProtectedPageProps = {
  userName: string;
};

const adminPages: Record<string, ComponentType<ProtectedPageProps>> = {
  "/home": DashboardPage,
  "/categorias": CategoriesPage,
  "/procedimentos": ProceduresPage,
  "/clientes": ClientsPage,
  "/profissionais": ProfessionalsPage,
  "/usuarios": UsersPage,
  "/atendimentos": AppointmentsPage,
};

function UnauthorizedAccess() {
  useEffect(() => {
    redirectUnauthorizedUser();
  }, []);

  return null;
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const routePath = path.endsWith("/listar") ? path.slice(0, -7) : path;

  if (path === "/") {
    return <Login />;
  }

  if (path === "/cadastro") {
    return <Cadastro />;
  }

  const AdminPage = adminPages[routePath];
  if (!AdminPage) {
    return <NotFound />;
  }

  const userName = window.sessionStorage.getItem("lotusUserName");

  const token = window.localStorage.getItem("token");
  if (!token || !hasValidTokenExpiration(token)) {
    return <UnauthorizedAccess />;
  }

  if (userName) {
    return <AdminPage userName={userName} />;
  }

  return <Login />;
}

export default App;
