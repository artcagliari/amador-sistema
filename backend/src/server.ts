import cors from 'cors';
import express from 'express';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
};

type RegisterBody = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

const users: User[] = [];

app.use(
  cors({
    origin: allowedOrigin,
  }),
);
app.use(express.json());

function hashPassword(password: string): string {
  const salt = randomUUID();
  const hashed = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hashed}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(':');
  if (!salt || !storedHash) return false;

  const hashedBuffer = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(storedHash, 'hex');

  if (hashedBuffer.length !== storedHashBuffer.length) return false;

  return timingSafeEqual(hashedBuffer, storedHashBuffer);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizePublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, message: 'API de autenticação online' });
});

app.post('/api/auth/register', (req, res) => {
  const body = req.body as RegisterBody;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const password = body.password;
  const confirmPassword = body.confirmPassword;

  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Informe um e-mail válido.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'As senhas não coincidem.' });
  }

  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'Já existe uma conta com esse e-mail.' });
  }

  const user: User = {
    id: randomUUID(),
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  return res.status(201).json({
    message: 'Conta criada com sucesso.',
    user: sanitizePublicUser(user),
  });
});

app.post('/api/auth/login', (req, res) => {
  const body = req.body as LoginBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  const user = users.find((entry) => entry.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
  }

  return res.status(200).json({
    message: `Login realizado com sucesso. Bem-vindo(a), ${user.name}!`,
    user: sanitizePublicUser(user),
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
