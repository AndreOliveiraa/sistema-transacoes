import Fastify from "fastify";
import cors from "@fastify/cors";
import mongoose from "mongoose";
import fastifyJwt from "@fastify/jwt";
import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import { authorizeTransaction, TransactionInput } from "./authEngine";
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
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

  try {
    await mongoose.connect(MONGO_URI);

    if (process.env.MONGO_URI) {
      console.log("MongoDB (Nuvem/Customizado) Conectado.");
    } else {
      console.log("MongoDB (Local) Conectado.");
    }

    const port = parseInt(process.env.PORT || "3001");
    await app.listen({ port });

    console.log(`Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    app.log.error(
      "Falha ao iniciar o servidor ou conectar ao DB." + String(err)
    );
    process.exit(1);
  }
};

start();
