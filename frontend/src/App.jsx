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
    amount: "",
    transactionType: "Compra",
  });

  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const panCleaned = formData.pan.replace(/\D/g, "");

    if (!panCleaned || !formData.amount) {
      setAlertMessage("Preencha o Número do Cartão e o Valor.");
      setTimeout(() => setAlertMessage(null), 3000);

      return;
    }

    setAlertMessage(null);

    const brandToSend = detectedBrand;

    dispatch(
      createTransaction({
        pan: panCleaned,
        brand: brandToSend || "Outras",
        amount: parseFloat(formData.amount),
        transactionType: formData.transactionType,
      })
    );

    setFormData({ ...formData, pan: "", amount: "" });
  };

  const detectBrand = (pan) => {
    if (!pan) return null;

    const cleanPan = pan.replace(/\D/g, "");

    if (cleanPan.length < 1) return null;

    if (cleanPan.startsWith("4")) {
      return "Visa";
    }
    if (
      cleanPan.startsWith("51") ||
      cleanPan.startsWith("52") ||
      cleanPan.startsWith("53") ||
      cleanPan.startsWith("54") ||
      cleanPan.startsWith("55")
    ) {
      return "Mastercard";
    }
    if (
      cleanPan.startsWith("636368") ||
      cleanPan.startsWith("438935") ||
      cleanPan.startsWith("5067")
    ) {
      return "Elo";
    }

    return null;
  };

  const detectedBrand = detectBrand(formData.pan);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    const options = {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    return date.toLocaleTimeString("pt-BR", options).replace(",", " ");
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4 text-center">Processamento de Transações</h1>
      <Row>
        {/* Formulário de Transação */}
        <Col md={3}>
          {alertMessage && (
            <Alert
              className="rounded-3"
              variant="danger"
              onClose={() => setAlertMessage(null)}
              dismissible
            >
              {alertMessage}
            </Alert>
          )}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="text-white">Nova Transação</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-white">
                    Bandeiras Permitidas
                  </Form.Label>
                  <div className="mb-3">
                    <img
                      src="bandeira_visa.png"
                      className={`brand-image ${
                        detectedBrand === "Visa" ? "highlighted" : ""
                      }`}
                    />
                    <img
                      src="bandeira_mastercard.png"
                      className={`brand-image ${
                        detectedBrand === "Mastercard" ? "highlighted" : ""
                      }`}
                    />
                    <img
                      src="bandeira_elo.png"
                      className={`brand-image ${
                        detectedBrand === "Elo" ? "highlighted" : ""
                      }`}
                    />
                  </div>
                  <Form.Label className="text-white">
                    Número do Cartão *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={
                      formData.pan
                        .replace(/\D/g, "")
                        .match(/.{1,4}/g)
                        ?.join(" ") || ""
                    }
                    onChange={(e) => {
                      const cleanedValue = e.target.value
                        .replace(/\s/g, "")
                        .replace(/\D/g, "");
                      setFormData({
                        ...formData,
                        pan: cleanedValue.slice(0, 16),
                      });
                    }}
                    maxLength={19}
                  />
                  <Form.Text className="text-white">
                    Deve ter 16 dígitos.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-white">Valor (R$) *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/[^0-9.]/g, "");
                      setFormData({ ...formData, amount: cleanValue });
                    }}
                    inputMode="decimal"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="text-white">
                    Tipo de Transação
                  </Form.Label>
                  <Form.Select
                    value={formData.transactionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transactionType: e.target.value,
                      })
                    }
                  >
                    <option value="Compra">Compra</option>
                    <option value="Saque">Saque</option>
                    <option value="Reembolso">Reembolso</option>
                  </Form.Select>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="rounded-pill w-100"
                >
                  Processar Transação
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        {/* Lista de Transações */}
        <Col md={9}>
          <Card className="shadow-sm">
            <Card.Header>Histórico de Transações</Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>PAN</th>
                    <th>Bandeira</th>
                    <th>Valor</th>
                    <th>Tipo</th>
                    <th>Data/Hora</th>
                    <th>Código</th>
                    <th>Motivo</th>
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
                      <td style={{ fontFamily: "monospace" }}>{t.pan}</td>
                      <td>{t.brand}</td>
                      <td>R$ {t.amount.toFixed(2)}</td>
                      <td>{t.transactionType || "Compra"}</td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {formatDate(t.timestamp)}
                      </td>
                      <td>{t.authorizationCode || " "}</td>
                      <td>
                        {t.status !== "approved" && (
                          <small className="text-danger">{t.reason}</small>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center">
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
