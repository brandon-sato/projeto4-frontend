import { useState, type FormEvent } from "react";
import axios from "axios";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { api } from "../api/axion";

function Login() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);

    try {
      const response = await api.post<{ user: { name: string } }>("/users/login", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      window.sessionStorage.setItem("lotusUserName", response.data.user.name);
      window.location.assign("/home");
    } catch (error: unknown) {
      const responseMessage =
        axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : null;
      setErrorMessage(
        responseMessage ?? "Não foi possível efetuar o login. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <Container className="login-container">
        <Card className="login-card shadow">
          <Card.Header>
            <img
              src="/logolotus.png"
              alt="Logo Lotus Nature Spa"
              className="login-logo w-100"
            />
          </Card.Header>
          <Card.Body>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="loginEmail">
                <Form.Label>Digite o e-mail:</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              </Form.Group>

              <Form.Group controlId="loginPassword">
                <Form.Label>Digite sua senha:</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </Form.Group>

              <Button
                className="login-button w-100 mt-3"
                variant="success"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Validando..." : "Efetuar Login"}
              </Button>
            </Form>
            <a className="btn btn-outline-light w-100 mt-2" href="/cadastro">
              Novo usuário
            </a>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default Login;