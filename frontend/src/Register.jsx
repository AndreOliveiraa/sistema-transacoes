import React, { useState } from "react";
import axios from "axios";
import { Container, Form, Button, Alert, Card } from "react-bootstrap";
import useDocumentTitle from "./hooks/useDocumentTitle";

const API_URL = "http://localhost:3001";

function Register({ onSuccessfulRegistration }) {
  useDocumentTitle("Registro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/register`, {
        email,
        password,
      });

      setMessage(response.data.message || "Registro realizado com sucesso!");

      onSuccessfulRegistration();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erro desconhecido durante o registro."
      );
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <Card style={{ width: "400px", padding: "20px" }} className="shadow">
        <h2 className="text-center mb-4 text-light-custom">Criar Conta</h2>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3  text-light-custom">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3 text-light-custom">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            className="rounded-pill w-100"
          >
            Registrar
          </Button>
        </Form>
        <p className="mt-3 text-center">
          <a href="#" onClick={onSuccessfulRegistration}>
            Já tenho uma conta
          </a>
        </p>
      </Card>
    </Container>
  );
}

export default Register;
