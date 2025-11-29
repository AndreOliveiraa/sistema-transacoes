import { authorizeTransaction } from "../src/authEngine";

describe("Lógica de Autorização do Backend", () => {
  test("Deve APROVAR uma transação válida (Visa, < 1000, 16 digitos)", () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "Visa",
      amount: 100.0,
      transactionType: "Compra",
    });

    expect(result.status).toBe("approved");
    expect(result.authorizationCode).toBeDefined();
    expect(result.authorizationCode).toHaveLength(6);
    expect(result.reason).toBeUndefined();
  });

  test("Deve APROVAR bandeiras independente de Maiúsculas/Minúsculas", () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "viSA",
      amount: 50.0,
      transactionType: "Saque",
    });

    expect(result.status).toBe("approved");
    expect(result.authorizationCode).toBeDefined();
    expect(result.authorizationCode).toHaveLength(6);
    expect(result.reason).toBeUndefined();
  });

  test("Deve APROVAR independente do tipo de transação", () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "Mastercard",
      amount: 50.0,
      transactionType: "",
    });

    expect(result.status).toBe("approved");
    expect(result.authorizationCode).toBeDefined();
    expect(result.authorizationCode).toHaveLength(6);
    expect(result.reason).toBeUndefined();
  });

  test("Deve NEGAR se o valor for maior que R$ 1.000", () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "Mastercard",
      amount: 1000.01,
    });

    expect(result.status).toBe("declined");
    expect(result.reason).toBe("Excede limite permitido");
    expect(result.authorizationCode).toBeUndefined();
  });

  test("Deve NEGAR se o valor for menor que R$ 0.00", () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "Mastercard",
      amount: -0.01,
    });

    expect(result.status).toBe("declined");
    expect(result.reason).toBe("Excede limite permitido");
    expect(result.authorizationCode).toBeUndefined();
  });

  test("Deve NEGAR se o PAN tiver menos que 16 dígitos", () => {
    const result = authorizeTransaction({
      pan: "123",
      brand: "Elo",
      amount: 50.0,
    });

    expect(result.status).toBe("declined");
    expect(result.reason).toBe("PAN deve ter 16 dígitos");
    expect(result.authorizationCode).toBeUndefined();
  });

  test("Deve NEGAR se o PAN tiver mais que 16 dígitos", () => {
    const result = authorizeTransaction({
      pan: "12345678123456789",
      brand: "Elo",
      amount: 50.0,
    });

    expect(result.status).toBe("declined");
    expect(result.reason).toBe("PAN deve ter 16 dígitos");
    expect(result.authorizationCode).toBeUndefined();
  });

  test("Deve NEGAR se a bandeira não for permitida (Ex: Amex)", () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "Amex",
      amount: 50.0,
    });

    expect(result.status).toBe("declined");
    expect(result.reason).toBe("Bandeira não permitida");
    expect(result.authorizationCode).toBeUndefined();
  });

  test('Deve NEGAR se a bandeira for enviada como "Outras"', () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "Outras",
      amount: 50.0,
    });

    expect(result.status).toBe("declined");
    expect(result.reason).toBe("Bandeira não permitida");
    expect(result.authorizationCode).toBeUndefined();
  });

  test("Deve NEGAR se a bandeira for enviada como string vazia", () => {
    const result = authorizeTransaction({
      pan: "1234567812345678",
      brand: "",
      amount: 50.0,
    });

    expect(result.status).toBe("declined");
    expect(result.reason).toBe("Bandeira não permitida");
    expect(result.authorizationCode).toBeUndefined();
  });
});
