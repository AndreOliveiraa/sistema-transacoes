// src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// 1. Definição do Modelo
const transactionSchema = new mongoose.Schema({
  pan: { type: String, required: true },
  brand: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["approved", "declined"], required: true },
  reason: { type: String },
  authorizationCode: { type: String },
  transactionType: { type: String, default: "Purchase" },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

// 2. Inicialização do App
const app = Fastify({ logger: true });
app.register(cors, { origin: true });

// 3. Engine de Autorização (Lógica de Negócio)
interface TransactionInput {
  pan: string;
  brand: string;
  amount: number;
}

const authorizeTransaction = (data: TransactionInput) => {
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

const maskPAN = (pan: string | any[]) => {
  if (!pan || pan.length < 4) return pan;
  return `**** **** **** ${pan.slice(-4)}`;
};

// 4. Endpoints

// GET: Listar transações
app.get("/transactions", async () => {
  const transactions = await Transaction.find().sort({ timestamp: -1 });
  return transactions;
});

// POST: Processar transação
app.post<{ Body: TransactionInput }>(
  "/transactions",
  async (request, reply) => {
    const { pan, brand, amount } = request.body;

    const result = authorizeTransaction({ pan, brand, amount });

    const maskedPan = maskPAN(pan);

    const newTransaction = new Transaction({
      pan: maskedPan,
      brand,
      amount,
      status: result.status,
      reason: result.reason,
      authorizationCode: result.authorizationCode,
    });

    await newTransaction.save();
    return newTransaction;
  }
);

// 5. Start Server
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB Conectado");

    await app.listen({ port: 3001 });
    console.log("Servidor rodando na porta 3001");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
