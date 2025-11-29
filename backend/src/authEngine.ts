export interface TransactionInput {
  pan: string;
  brand: string;
  amount: number;
  transactionType?: string;
}

export interface TransactionResult {
  status: "approved" | "declined";
  reason?: string;
  authorizationCode?: string;
}

export const authorizeTransaction = (data: TransactionInput) => {
  const { pan, brand, amount } = data;

  // Regra 1: Validade do PAN (apenas números e tamanho 16)
  const cleanPan = pan.replace(/\D/g, "");
  if (cleanPan.length !== 16) {
    return { status: "declined", reason: "PAN deve ter 16 dígitos" };
  }

  // Regra 2: Bandeiras aceitas
  const allowedBrands = ["visa", "mastercard", "elo"];
  if (!allowedBrands.includes(brand.toLowerCase())) {
    return { status: "declined", reason: "Bandeira não permitida" };
  }

  // Regra 3: Limite de valor
  if (amount > 1000 || amount < 0) {
    return { status: "declined", reason: "Excede limite permitido" };
  }

  // Aprovado: Gerar código
  const authCode = Math.floor(100000 + Math.random() * 900000).toString();
  return { status: "approved", authorizationCode: authCode };
};
