import Fastify from "fastify";
import cors from "@fastify/cors";
import mongoose from "mongoose";
import fastifyJwt from "@fastify/jwt";
import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import dotenv from "dotenv";
dotenv.config();

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

// Definição do Modelo de Transação
const transactionSchema = new mongoose.Schema({
  pan: { type: String, required: true },
  brand: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["approved", "declined"], required: true },
  reason: { type: String },
  authorizationCode: { type: String },
  transactionType: { type: String, default: "Compra" },
});
const Transaction = mongoose.model("Transaction", transactionSchema);

// Definição do Modelo de Usuário
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// Inicialização do App
const app = Fastify({ logger: true });
app.register(cors, { origin: true });
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "tamborine123",
});

app.decorate(
  "authenticate",
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }
);

interface PaginationQuery {
  page?: string;
  limit?: string;
}

// Engine de Autorização (Lógica de Negócio)
interface TransactionInput {
  pan: string;
  brand: string;
  amount: number;
  transactionType: string;
}

const authorizeTransaction = (data: TransactionInput) => {
  const { pan, brand, amount, transactionType } = data;

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

// Endpoints
// --- ROTAS PÚBLICAS (Login/Registro) ---

// Rota de Registro
app.post("/register", async (req, reply) => {
  const { email, password } = req.body as any;
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const user = new User({ email, password: hashedPassword });
    await user.save();
    return { message: "Usuário criado com sucesso!" };
  } catch (e) {
    return reply.code(400).send({ message: "Erro ao criar usuário", error: e });
  }
});

// Rota de Login (Gera o Token)
app.post("/login", async (req, reply) => {
  const { email, password } = req.body as any;
  const user = await User.findOne({ email });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return reply.code(401).send({ message: "Email ou senha inválidos" });
  }

  const token = app.jwt.sign({ id: user._id, email: user.email });
  return { token };
});

// --- ROTAS PROTEGIDAS ---

// GET: Listar transações
app.get<{ Querystring: PaginationQuery }>(
  "/transactions",
  {
    onRequest: [app.authenticate],
  },
  async (request, reply) => {
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "10");
    const skip = (page - 1) * limit;
    const totalTransactions = await Transaction.countDocuments();
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    return {
      transactions,
      totalPages: Math.ceil(totalTransactions / limit),
      currentPage: page,
      totalItems: totalTransactions,
    };
  }
);

// POST: Processar transação
app.post<{ Body: TransactionInput }>(
  "/transactions",
  {
    onRequest: [app.authenticate],
  },
  async (request, reply) => {
    const { pan, brand, amount, transactionType } = request.body;

    const result = authorizeTransaction({
      pan,
      brand,
      amount,
      transactionType,
    });

    const maskedPan = maskPAN(pan);

    const newTransaction = new Transaction({
      pan: maskedPan,
      brand,
      amount,
      status: result.status,
      reason: result.reason,
      authorizationCode: result.authorizationCode,
      transactionType,
    });

    await newTransaction.save();
    return newTransaction;
  }
);

// Start Server
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
