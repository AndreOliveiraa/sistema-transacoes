import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTransactions,
  createTransaction,
} from "./store/transactionsSlice";
import {
  Container,
  Form,
  Button,
  Table,
  Alert,
  Badge,
  Card,
  Row,
  Col,
} from "react-bootstrap";

function App() {
  const dispatch = useDispatch();
  const { items: transactions } = useSelector((state) => state.transactions);

  const [formData, setFormData] = useState({
    pan: "",
    brand: "Visa",
    amount: "",
  });

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.pan || !formData.amount) return;

    dispatch(
      createTransaction({
        pan: formData.pan,
        brand: formData.brand,
        amount: parseFloat(formData.amount),
      })
    );

    // Resetar apenas campos de texto
    setFormData({ ...formData, pan: "", amount: "" });
  };

  // Função utilitária para mascarar PAN
  const maskPAN = (pan) => {
    if (!pan || pan.length < 4) return pan;
    return `**** **** **** ${pan.slice(-4)}`;
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4 text-center">Autorizador de Pagamentos</h1>

      <Row>
        {/* Formulário de Transação */}
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              Nova Transação
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>PAN (Cartão)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: 1234567812345678"
                    value={formData.pan}
                    onChange={(e) =>
                      setFormData({ ...formData, pan: e.target.value })
                    }
                    maxLength={16}
                  />
                  <Form.Text className="text-muted">
                    Deve ter 16 dígitos.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Bandeira</Form.Label>
                  <Form.Select
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Elo">Elo</option>
                    <option value="Amex">Amex (Teste Negada)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Valor (R$)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                  Processar Transação
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Lista de Transações */}
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>Histórico de Transações</Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>PAN Mascarado</th>
                    <th>Bandeira</th>
                    <th>Valor</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td>
                        {t.status === "approved" ? (
                          <Badge bg="success">Aprovado</Badge>
                        ) : (
                          <Badge bg="danger">Negado</Badge>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace" }}>
                        {maskPAN(t.pan)}
                      </td>
                      <td>{t.brand}</td>
                      <td>R$ {t.amount.toFixed(2)}</td>
                      <td>
                        {t.status === "approved" ? (
                          <small>Auth: {t.authorizationCode}</small>
                        ) : (
                          <small className="text-danger">{t.reason}</small>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
