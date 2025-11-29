import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "./store/authSlice";
import { Container, Form, Button, Alert, Card } from "react-bootstrap";
import useDocumentTitle from "./hooks/useDocumentTitle";

function Login({ onSwitchToRegister }) {
  useDocumentTitle("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <Card style={{ width: "400px", padding: "20px" }} className="shadow">
        <h2 className="text-center mb-4 text-white">Login</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3 text-white">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3 text-white">
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
            Entrar
          </Button>
          <p className="mt-3 text-center">
            <a href="#" onClick={onSwitchToRegister}>
              Não tem uma conta? Crie uma aqui.
            </a>
          </p>
        </Form>
      </Card>
    </Container>
  );
}

export default Login;
