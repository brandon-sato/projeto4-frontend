import AppButton from "./appButton";

const navigationItems = [
  { path: "/home", label: "Dashboard" },
  { path: "/categorias", label: "Categoria" },
  { path: "/procedimentos", label: "Procedimento" },
  { path: "/clientes", label: "Cliente" },
  { path: "/profissionais", label: "Profissional" },
  { path: "/usuarios", label: "Usuário" },
  { path: "/atendimentos", label: "Atendimento" },
];

type NavbarProps = {
  userName: string;
  activePath: string;
};

function Navbar({ userName, activePath }: NavbarProps) {
  function handleLogout() {
    window.localStorage.removeItem("token");
    window.sessionStorage.removeItem("lotusUserName");
    window.location.assign("/");
  }

  return (
    <header className="navbar navbar-expand-lg admin-navbar">
      <div className="container-fluid">
        <a className="navbar-brand admin-brand" href="/home" aria-label="Lotus Nature Spa - início">
          <img src="/logolotus.png" alt="Lotus Nature Spa" />
        </a>
        <nav className="navbar-nav me-auto mb-2 mb-lg-0 flex-row flex-wrap" aria-label="Cadastros">
          {navigationItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`nav-link${activePath === item.path ? " active" : ""}`}
              aria-current={activePath === item.path ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="d-flex align-items-center gap-2 admin-account">
          <span>Olá, {userName}</span>
          <AppButton variant="link" className="admin-logout" onClick={handleLogout}>
            Sair
          </AppButton>
        </div>
      </div>
    </header>
  );
}

export default Navbar;