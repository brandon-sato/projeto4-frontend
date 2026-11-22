import AppButton from "../components/appButton";

function NotFound() {
  function returnToHome() {
    const token = window.localStorage.getItem("token");
    const userName = window.sessionStorage.getItem("lotusUserName");
    window.location.assign(token && userName ? "/home" : "/");
  }

  return (
    <main className="login-page d-flex align-items-center justify-content-center">
      <section className="login-card shadow p-4 text-center">
        <h1 className="register-title">Página não encontrada</h1>
        <p>A página que você tentou acessar não existe.</p>
        <AppButton variant="primary" onClick={returnToHome}>
          Voltar ao início
        </AppButton>
      </section>
    </main>
  );
}

export default NotFound;
