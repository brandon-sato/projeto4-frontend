import { useState, type FormEvent } from "react";
import axios from "axios";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { api } from "../api/axion";

function isCpfValid(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = [...cpf].map(Number);
  const calculateDigit = (length: number): number => {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === digits[9] && calculateDigit(10) === digits[10];
}

function Cadastro() {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [cpf, setCpf] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordsDoNotMatch =
    passwordConfirmation.length > 0 && password !== passwordConfirmation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isCpfValid(cpf)) {
      setErrorMessage("Informe um CPF válido.");
      return;
    }

    if (passwordsDoNotMatch) {
      setErrorMessage("A senha e a confirmação de senha não coincidem.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);

    try {
      const userData = {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        cpf,
        password,
      };

      await api.post("/users", JSON.stringify(userData), {
        headers: { "Content-Type": "application/json" },
      });
      setSuccessMessage("Usuário cadastrado com sucesso.");
      form.reset();
      setPassword("");
      setPasswordConfirmation("");
      setCpf("");
      window.setTimeout(() => window.location.assign("/"), 1500);
    } catch (error: unknown) {
      const responseMessage =
        axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : null;
      setErrorMessage(
        responseMessage ?? "Não foi possível cadastrar o usuário. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <Container className="register-container">
        <Card className="login-card shadow">
          <Card.Header>
            <img
              src="/logolotus.png"
              alt="Logo Lotus Nature Spa"
              className="login-logo w-100"
            />
          </Card.Header>
          <Card.Body>
            <h1 className="register-title">Novo usuário</h1>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="registerName">
                <Form.Label>Nome:</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={150}
                  required
                />
              </Form.Group>

              <Form.Group controlId="registerEmail">
                <Form.Label>E-mail:</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={150}
                  pattern="[^@ ]+@[^@ ]+\.[^@ ]+"
                  title="Digite um e-mail válido, como teste@teste.com."
                  required
                />
              </Form.Group>

              <Form.Group controlId="registerCpf">
                <Form.Label>CPF:</Form.Label>
                <Form.Control
                  type="text"
                  name="cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  pattern="[0-9]{11}"
                  title="Digite os 11 números do CPF, sem pontos ou traço."
                  value={cpf}
                  isInvalid={cpf.length === 11 && !isCpfValid(cpf)}
                  onChange={(event) =>
                    setCpf(event.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Digite um CPF válido.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="registerPassword">
                <Form.Label>Senha:</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="registerPasswordConfirmation">
                <Form.Label>Confirme a senha:</Form.Label>
                <Form.Control
                  type="password"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  isInvalid={passwordsDoNotMatch}
                  required
                />
                {passwordsDoNotMatch && (
                  <Form.Control.Feedback type="invalid">
                    A confirmação deve ser igual à senha digitada.
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Button
                className="login-button w-100 mt-3"
                variant="success"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </Form>

            <a className="btn btn-outline-light w-100 mt-2" href="/">
              Voltar ao login
            </a>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}

export default Cadastro;