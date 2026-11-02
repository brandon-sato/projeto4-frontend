import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Cadastro from "./pages/cadastro";
import Home from "./pages/home";
import Login from "./pages/login";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/cadastro") {
    return <Cadastro />;
  }

  if (path === "/home") {
    const userName = window.sessionStorage.getItem("lotusUserName");
    if (userName) {
      return <Home userName={userName} />;
    }
  }

  return <Login />;
}

export default App;
