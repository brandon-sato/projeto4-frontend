import { Button, Card, Container } from "react-bootstrap";

type HomeProps = {
  userName: string;
};

function Home({ userName }: HomeProps) {
  function handleLogout() {
    window.sessionStorage.removeItem("lotusUserName");
    window.location.assign("/");
  }

  return (
    <main className="login-page">
      <Container className="home-container">
        <Card className="login-card shadow">
          <Card.Header>
            <img
              src="/logolotus.png"
              alt="Logo Lotus Nature Spa"
              className="login-logo w-100"
            />
          </Card.Header>
          <Card.Body className="text-center">
            <h1 className="register-title">Bem-vindo(a), {userName}!</h1>
            <Button
              className="login-button w-100 mt-3"
              variant="success"
              onClick={handleLogout}
            >
              Deslogar
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}

export default Home;
