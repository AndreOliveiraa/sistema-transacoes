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
  Pagination,
} from "react-bootstrap";
import { logout } from "./store/authSlice";
import Login from "./Login";
import Register from "./Register";

function App() {
  const { token } = useSelector((state) => state.auth);
  const [authView, setAuthView] = useState("login");
  const dispatch = useDispatch();
  const { items: transactions } = useSelector((state) => state.transactions);
  const [limit, setLimit] = useState(10);
  const currentPage = useSelector((state) => state.transactions.currentPage);
  const totalPages = useSelector((state) => state.transactions.totalPages);

  const [formData, setFormData] = useState({
    pan: "",
    amount: "",
    transactionType: "Compra",
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(fetchTransactions({ page: 1, limit }));
  }, [dispatch, token, limit]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setValidationErrors({});

    const panCleaned = formData.pan.replace(/\D/g, "");
    const amountValue = formData.amount / 100;

    let hasError = false;
    let newErrors = {};

    if (!panCleaned) {
      newErrors.pan = true;
      hasError = true;
    }
    if (!amountValue || isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = true;
      hasError = true;
    }

    if (hasError) {
      setValidationErrors(newErrors);
      setTimeout(() => setValidationErrors({}), 3000);
      return;
    }

    const brandToSend = detectedBrand;

    dispatch(
      createTransaction({
        pan: panCleaned,
        brand: brandToSend || "Outras",
        amount: parseFloat(amountValue),
        transactionType: formData.transactionType,
      })
    );

    setFormData({ ...formData, pan: "", amount: "" });
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      dispatch(fetchTransactions({ page, limit }));
    }
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

  const formatAmount = (value) => {
    const cleanValue = String(value || "").replace(/\D/g, "");

    if (!cleanValue) {
      return "";
    }

    const amountInCents = parseInt(cleanValue, 10);

    return (amountInCents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: "currency",
      currency: "BRL",
    });
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const cleanValueInCents = rawValue.replace(/[^0-9]/g, "");

    if (cleanValueInCents.length > 9) return;

    setFormData({ ...formData, amount: cleanValueInCents });
  };

  const renderPaginationItems = () => {
    let items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  if (token) {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="m-0">Processamento de Transações</h1>

          <Button
            variant="outline-danger"
            onClick={handleLogout}
            className="d-flex align-items-center gap-2"
          >
            Sair
          </Button>
        </div>
        <Row>
          {/* Formulário de Transação */}
          <Col md={3}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="text-light-custom">
                Nova Transação
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light-custom">
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
                    <Form.Label className="text-light-custom">
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
                      isInvalid={validationErrors.pan}
                    />
                    {validationErrors.pan && (
                      <Form.Control.Feedback type="invalid">
                        Preencha o número do cartão
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-light-custom">
                      Deve ter 16 dígitos.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-light-custom">
                      Valor *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="R$ 0,00"
                      value={formatAmount(formData.amount)}
                      onChange={handleAmountChange}
                      isInvalid={validationErrors.amount}
                    />
                    {validationErrors.amount && (
                      <Form.Control.Feedback type="invalid">
                        O valor mínimo é R$ 0,01
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-light-custom">
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
                        <td
                          style={{ fontFamily: "monospace" }}
                          className="text-light-custom"
                        >
                          {t.pan}
                        </td>
                        <td className="text-light-custom">{t.brand}</td>
                        <td className="text-light-custom">
                          R$ {t.amount.toFixed(2)}
                        </td>
                        <td className="text-light-custom">
                          {t.transactionType || "Compra"}
                        </td>
                        <td
                          style={{ fontSize: "0.85rem" }}
                          className="text-light-custom"
                        >
                          {formatDate(t.timestamp)}
                        </td>
                        <td className="text-light-custom">
                          {t.authorizationCode || " "}
                        </td>
                        <td>
                          {t.status !== "approved" && (
                            <small className="text-danger">{t.reason}</small>
                          )}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td
                          colSpan="8"
                          className="text-center text-light-custom"
                        >
                          Nenhuma transação encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-3">
                    <Pagination>{renderPaginationItems()}</Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  if (authView === "login") {
    return <Login onSwitchToRegister={() => setAuthView("register")} />;
  } else {
    return <Register onSuccessfulRegistration={() => setAuthView("login")} />;
  }
}

export default App;
