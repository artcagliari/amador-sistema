import cors from 'cors';
import express from 'express';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const configuredOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim());
const allowedOrigins = configuredOrigins?.length
  ? configuredOrigins
  : [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/\d{1,3}(\.\d{1,3}){3}:\d+$/];

type UserRole = 'athlete' | 'admin';
type AdminPermission = 'general' | 'court' | 'financial' | 'limited';
type EntityStatus = 'active' | 'inactive';
type CourtStatus = 'active' | 'inactive' | 'maintenance';
type AthleteLevel = 'beginner' | 'intermediate' | 'advanced';
type GameStatus = 'open' | 'closed' | 'in_progress' | 'finished' | 'cancelled';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  permissionLevel?: AdminPermission;
  createdAt: string;
};

type Athlete = {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf?: string;
  city: string;
  position?: string;
  level: AthleteLevel;
  profilePhotoUrl?: string;
  status: EntityStatus;
  gameHistory: string[];
  createdAt: string;
  updatedAt: string;
};

type Admin = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  permissionLevel: AdminPermission;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
};

type Court = {
  id: string;
  name: string;
  sportType: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  imageUrl?: string;
  hourlyRate?: number;
  availableHours: string;
  status: CourtStatus;
  maxAthletes: number;
  rules: string;
  latitude?: number;
  longitude?: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

type Game = {
  id: string;
  title: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  maxParticipants: number;
  confirmedAthleteIds: string[];
  pendingAthleteIds: string[];
  status: GameStatus;
  description?: string;
  rules?: string;
  participantRate?: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
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
const athletes: Athlete[] = [];
const admins: Admin[] = [];
const courts: Court[] = [];
const games: Game[] = [];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed = allowedOrigins.some((allowedOrigin) =>
        typeof allowedOrigin === 'string' ? allowedOrigin === origin : allowedOrigin.test(origin),
      );

      callback(isAllowed ? null : new Error('Origem nao permitida pelo CORS.'), isAllowed);
    },
  }),
);
app.use(express.json({ limit: '2mb' }));

function now() {
  return new Date().toISOString();
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase();
}

function required(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
}

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

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissionLevel: user.permissionLevel,
    createdAt: user.createdAt,
  };
}

function currentUser(req: express.Request) {
  const userId = req.header('x-user-id');
  if (!userId) return undefined;
  return users.find((user) => user.id === userId);
}

function isAdmin(user?: User) {
  return user?.role === 'admin';
}

function canManageCourts(user?: User) {
  return user?.role === 'admin' && ['general', 'court'].includes(user.permissionLevel ?? 'limited');
}

function canManageFinancial(user?: User) {
  return user?.role === 'admin' && ['general', 'financial'].includes(user.permissionLevel ?? 'limited');
}

function canManageAdmins(user?: User) {
  return user?.role === 'admin' && user.permissionLevel === 'general';
}

function canManageAthletes(user?: User, athlete?: Athlete) {
  if (isAdmin(user)) return true;
  return Boolean(user && athlete?.userId === user.id);
}

function canManageGames(user?: User) {
  return user?.role === 'admin' && ['general', 'court'].includes(user.permissionLevel ?? 'limited');
}

function requirePermission(res: express.Response, allowed: boolean) {
  if (allowed) return false;
  res.status(403).json({ message: 'Voce nao possui permissao para executar esta acao.' });
  return true;
}

function parseNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function seed() {
  const adminPassword = hashPassword('admin123');
  const adminUser: User = {
    id: randomUUID(),
    name: 'Administrador Geral',
    email: 'admin@amador.com',
    phone: '(21) 99999-0000',
    passwordHash: adminPassword,
    role: 'admin',
    permissionLevel: 'general',
    createdAt: now(),
  };
  users.push(adminUser);
  admins.push({
    id: randomUUID(),
    userId: adminUser.id,
    fullName: adminUser.name,
    email: adminUser.email,
    phone: adminUser.phone,
    permissionLevel: 'general',
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  });

  const sampleCourt: Court = {
    id: randomUUID(),
    name: 'Quadra Infinity',
    sportType: 'Futebol society',
    address: 'Rua Sao Clemente, 150',
    neighborhood: 'Botafogo',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22260-001',
    description: 'Quadra sintetica iluminada com vestiario e area de espera.',
    imageUrl: 'https://images.unsplash.com/photo-1570498839593-e565b39455fc?auto=format&fit=crop&w=1200&q=80',
    hourlyRate: 180,
    availableHours: 'Seg a sab, 08:00 as 23:00',
    status: 'active',
    maxAthletes: 14,
    rules: 'Uso obrigatorio de chuteira society. Chegar 15 minutos antes.',
    latitude: -22.9519,
    longitude: -43.2105,
    createdBy: adminUser.id,
    updatedBy: adminUser.id,
    createdAt: now(),
    updatedAt: now(),
  };
  courts.push(sampleCourt);
}

seed();

function validateCourtPayload(body: Record<string, unknown>, partial = false) {
  const mandatory = ['name', 'sportType', 'address', 'neighborhood', 'city', 'state', 'zipCode', 'description', 'availableHours', 'status', 'maxAthletes', 'rules'];
  const missing = mandatory.filter((field) => !partial && !required(body[field]));
  if (missing.length) return `Preencha os campos obrigatorios: ${missing.join(', ')}.`;

  const status = body.status;
  if (required(status) && !['active', 'inactive', 'maintenance'].includes(String(status))) {
    return 'Informe um status valido para a quadra.';
  }

  const maxAthletes = parseNumber(body.maxAthletes);
  if (maxAthletes !== undefined && (!Number.isInteger(maxAthletes) || maxAthletes <= 0)) {
    return 'Informe uma capacidade maxima valida.';
  }

  const hourlyRate = parseNumber(body.hourlyRate);
  if (hourlyRate !== undefined && (Number.isNaN(hourlyRate) || hourlyRate < 0)) {
    return 'Informe um valor por hora valido.';
  }

  return '';
}

function validateAthletePayload(body: Record<string, unknown>, partial = false) {
  const mandatory = ['fullName', 'email', 'phone', 'birthDate', 'city', 'level', 'status'];
  const missing = mandatory.filter((field) => !partial && !required(body[field]));
  if (missing.length) return `Preencha os campos obrigatorios: ${missing.join(', ')}.`;

  const email = normalizeEmail(String(body.email ?? ''));
  if (required(body.email) && !isValidEmail(email ?? '')) return 'Informe um e-mail valido.';

  if (required(body.level) && !['beginner', 'intermediate', 'advanced'].includes(String(body.level))) {
    return 'Informe um nivel valido para o atleta.';
  }

  if (required(body.status) && !['active', 'inactive'].includes(String(body.status))) {
    return 'Informe um status valido para o atleta.';
  }

  return '';
}

function validateAdminPayload(body: Record<string, unknown>, partial = false) {
  const mandatory = ['fullName', 'email', 'phone', 'permissionLevel', 'status'];
  const missing = mandatory.filter((field) => !partial && !required(body[field]));
  if (missing.length) return `Preencha os campos obrigatorios: ${missing.join(', ')}.`;

  const email = normalizeEmail(String(body.email ?? ''));
  if (required(body.email) && !isValidEmail(email ?? '')) return 'Informe um e-mail valido.';

  if (!partial && !required(body.password)) return 'Informe uma senha para o administrador.';
  if (required(body.password) && String(body.password).length < 6) return 'A senha deve ter no minimo 6 caracteres.';

  if (required(body.permissionLevel) && !['general', 'court', 'financial', 'limited'].includes(String(body.permissionLevel))) {
    return 'Informe um nivel de permissao valido.';
  }

  if (required(body.status) && !['active', 'inactive'].includes(String(body.status))) {
    return 'Informe um status valido para o administrador.';
  }

  return '';
}

function gameStart(game: Pick<Game, 'date' | 'startTime'>) {
  return new Date(`${game.date}T${game.startTime}:00`);
}

function gameEnd(game: Pick<Game, 'date' | 'endTime'>) {
  return new Date(`${game.date}T${game.endTime}:00`);
}

function hasScheduleConflict(candidate: Pick<Game, 'courtId' | 'date' | 'startTime' | 'endTime'>, ignoredGameId?: string) {
  const candidateStart = gameStart(candidate);
  const candidateEnd = gameEnd(candidate);

  return games.some((game) => {
    if (game.id === ignoredGameId || game.courtId !== candidate.courtId || game.date !== candidate.date || game.status === 'cancelled') {
      return false;
    }

    return candidateStart < gameEnd(game) && candidateEnd > gameStart(game);
  });
}

function validateGamePayload(body: Record<string, unknown>, partial = false, ignoredGameId?: string) {
  const mandatory = ['title', 'courtId', 'date', 'startTime', 'endTime', 'sportType', 'maxParticipants', 'status'];
  const missing = mandatory.filter((field) => !partial && !required(body[field]));
  if (missing.length) return `Preencha os campos obrigatorios: ${missing.join(', ')}.`;

  const court = courts.find((entry) => entry.id === body.courtId);
  if (required(body.courtId) && !court) return 'Selecione uma quadra valida.';
  if (court?.status !== 'active') return 'Nao e possivel criar jogo em quadra inativa ou em manutencao.';

  const maxParticipants = parseNumber(body.maxParticipants);
  if (maxParticipants !== undefined && (!Number.isInteger(maxParticipants) || maxParticipants <= 0)) {
    return 'Informe um numero maximo de participantes valido.';
  }

  const participantRate = parseNumber(body.participantRate);
  if (participantRate !== undefined && (Number.isNaN(participantRate) || participantRate < 0)) {
    return 'Informe um valor por participante valido.';
  }

  if (required(body.status) && !['open', 'closed', 'in_progress', 'finished', 'cancelled'].includes(String(body.status))) {
    return 'Informe um status valido para o jogo.';
  }

  if (required(body.date) && required(body.startTime) && required(body.endTime)) {
    const candidate = {
      courtId: String(body.courtId),
      date: String(body.date),
      startTime: String(body.startTime),
      endTime: String(body.endTime),
    };

    if (Number.isNaN(gameStart(candidate).getTime()) || Number.isNaN(gameEnd(candidate).getTime()) || gameStart(candidate) >= gameEnd(candidate)) {
      return 'Informe data e horarios validos para o jogo.';
    }

    if (hasScheduleConflict(candidate, ignoredGameId)) {
      return 'Ja existe um jogo nessa quadra no horario informado.';
    }
  }

  return '';
}

function hydrateGame(game: Game) {
  return {
    ...game,
    court: courts.find((court) => court.id === game.courtId),
    confirmedAthletes: game.confirmedAthleteIds.map((id) => athletes.find((athlete) => athlete.id === id)).filter(Boolean),
    pendingAthletes: game.pendingAthleteIds.map((id) => athletes.find((athlete) => athlete.id === id)).filter(Boolean),
  };
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, message: 'API de autenticacao online' });
});

app.post('/api/auth/register', (req, res) => {
  const body = req.body as RegisterBody;
  const name = body.name?.trim();
  const email = normalizeEmail(body.email);
  const phone = body.phone?.trim();
  const password = body.password;
  const confirmPassword = body.confirmPassword;

  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatorios.' });
  }

  if (!isValidEmail(email)) return res.status(400).json({ message: 'Informe um e-mail valido.' });
  if (password.length < 6) return res.status(400).json({ message: 'A senha deve ter no minimo 6 caracteres.' });
  if (password !== confirmPassword) return res.status(400).json({ message: 'As senhas nao coincidem.' });
  if (users.find((user) => user.email === email)) return res.status(409).json({ message: 'Ja existe uma conta com esse e-mail.' });

  const user: User = {
    id: randomUUID(),
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    role: 'athlete',
    createdAt: now(),
  };
  users.push(user);

  athletes.push({
    id: randomUUID(),
    userId: user.id,
    fullName: name,
    email,
    phone,
    birthDate: '',
    city: '',
    level: 'beginner',
    status: 'active',
    gameHistory: [],
    createdAt: now(),
    updatedAt: now(),
  });

  return res.status(201).json({ message: 'Conta criada com sucesso.', user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const body = req.body as LoginBody;
  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!email || !password) return res.status(400).json({ message: 'Informe e-mail e senha.' });

  const user = users.find((entry) => entry.email === email);
  const admin = user?.role === 'admin' ? admins.find((entry) => entry.userId === user.id) : undefined;

  if (!user || !verifyPassword(password, user.passwordHash) || admin?.status === 'inactive') {
    return res.status(401).json({ message: 'E-mail ou senha invalidos.' });
  }

  return res.status(200).json({
    message: `Login realizado com sucesso. Bem-vindo(a), ${user.name}!`,
    user: publicUser(user),
  });
});

app.get('/api/courts', (req, res) => {
  const name = String(req.query.name ?? '').toLowerCase();
  const city = String(req.query.city ?? '').toLowerCase();
  const sportType = String(req.query.sportType ?? '').toLowerCase();
  const status = String(req.query.status ?? '');

  const filtered = courts.filter((court) => {
    return (
      (!name || court.name.toLowerCase().includes(name)) &&
      (!city || court.city.toLowerCase().includes(city)) &&
      (!sportType || court.sportType.toLowerCase().includes(sportType)) &&
      (!status || court.status === status)
    );
  });

  res.json({ courts: filtered });
});

app.get('/api/courts/map', (_req, res) => {
  res.json({ courts: courts.map((court) => ({ ...court, geocodingPending: !court.latitude || !court.longitude })) });
});

app.get('/api/courts/:id', (req, res) => {
  const court = courts.find((entry) => entry.id === req.params.id);
  if (!court) return res.status(404).json({ message: 'Quadra nao encontrada.' });
  res.json({ court, games: games.filter((game) => game.courtId === court.id).map(hydrateGame) });
});

app.post('/api/courts', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageCourts(user))) return;

  const error = validateCourtPayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const court: Court = {
    id: randomUUID(),
    name: String(req.body.name).trim(),
    sportType: String(req.body.sportType).trim(),
    address: String(req.body.address).trim(),
    neighborhood: String(req.body.neighborhood).trim(),
    city: String(req.body.city).trim(),
    state: String(req.body.state).trim().toUpperCase(),
    zipCode: String(req.body.zipCode).trim(),
    description: String(req.body.description).trim(),
    imageUrl: String(req.body.imageUrl ?? '').trim() || undefined,
    hourlyRate: parseNumber(req.body.hourlyRate),
    availableHours: String(req.body.availableHours).trim(),
    status: req.body.status,
    maxAthletes: Number(req.body.maxAthletes),
    rules: String(req.body.rules).trim(),
    latitude: parseNumber(req.body.latitude),
    longitude: parseNumber(req.body.longitude),
    createdBy: user?.id ?? 'system',
    updatedBy: user?.id ?? 'system',
    createdAt: now(),
    updatedAt: now(),
  };
  courts.push(court);
  res.status(201).json({ message: 'Quadra cadastrada com sucesso.', court });
});

app.put('/api/courts/:id', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageCourts(user))) return;

  const court = courts.find((entry) => entry.id === req.params.id);
  if (!court) return res.status(404).json({ message: 'Quadra nao encontrada.' });

  const error = validateCourtPayload(req.body, true);
  if (error) return res.status(400).json({ message: error });

  Object.assign(court, {
    ...req.body,
    hourlyRate: parseNumber(req.body.hourlyRate),
    maxAthletes: req.body.maxAthletes !== undefined ? Number(req.body.maxAthletes) : court.maxAthletes,
    latitude: parseNumber(req.body.latitude),
    longitude: parseNumber(req.body.longitude),
    updatedBy: user?.id ?? court.updatedBy,
    updatedAt: now(),
  });
  res.json({ message: 'Quadra atualizada com sucesso.', court });
});

app.delete('/api/courts/:id', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageCourts(user))) return;

  const index = courts.findIndex((entry) => entry.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Quadra nao encontrada.' });
  if (games.some((game) => game.courtId === req.params.id && game.status !== 'cancelled')) {
    return res.status(409).json({ message: 'Nao e possivel excluir quadra com jogos ativos.' });
  }

  courts.splice(index, 1);
  res.json({ message: 'Quadra excluida com sucesso.' });
});

app.get('/api/athletes', (req, res) => {
  const name = String(req.query.name ?? '').toLowerCase();
  const city = String(req.query.city ?? '').toLowerCase();
  const status = String(req.query.status ?? '');

  res.json({
    athletes: athletes.filter(
      (athlete) =>
        (!name || athlete.fullName.toLowerCase().includes(name)) &&
        (!city || athlete.city.toLowerCase().includes(city)) &&
        (!status || athlete.status === status),
    ),
  });
});

app.get('/api/athletes/me', (req, res) => {
  const user = currentUser(req);
  const athlete = athletes.find((entry) => entry.userId === user?.id);
  if (!athlete) return res.status(404).json({ message: 'Atleta nao encontrado.' });
  res.json({ athlete });
});

app.post('/api/athletes', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, isAdmin(user))) return;

  const error = validateAthletePayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const email = normalizeEmail(req.body.email);
  if (athletes.some((athlete) => athlete.email === email)) return res.status(409).json({ message: 'Ja existe atleta com esse e-mail.' });

  const athlete: Athlete = {
    id: randomUUID(),
    fullName: String(req.body.fullName).trim(),
    email: email ?? '',
    phone: String(req.body.phone).trim(),
    birthDate: String(req.body.birthDate).trim(),
    cpf: String(req.body.cpf ?? '').trim() || undefined,
    city: String(req.body.city).trim(),
    position: String(req.body.position ?? '').trim() || undefined,
    level: req.body.level,
    profilePhotoUrl: String(req.body.profilePhotoUrl ?? '').trim() || undefined,
    status: req.body.status,
    gameHistory: parseStringArray(req.body.gameHistory),
    createdAt: now(),
    updatedAt: now(),
  };
  athletes.push(athlete);
  res.status(201).json({ message: 'Atleta cadastrado com sucesso.', athlete });
});

app.put('/api/athletes/:id', (req, res) => {
  const user = currentUser(req);
  const athlete = athletes.find((entry) => entry.id === req.params.id);
  if (!athlete) return res.status(404).json({ message: 'Atleta nao encontrado.' });
  if (requirePermission(res, canManageAthletes(user, athlete))) return;

  const error = validateAthletePayload(req.body, true);
  if (error) return res.status(400).json({ message: error });

  Object.assign(athlete, {
    ...req.body,
    email: req.body.email ? normalizeEmail(req.body.email) : athlete.email,
    gameHistory: req.body.gameHistory ? parseStringArray(req.body.gameHistory) : athlete.gameHistory,
    updatedAt: now(),
  });
  res.json({ message: 'Atleta atualizado com sucesso.', athlete });
});

app.get('/api/admins', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageAdmins(user))) return;
  res.json({ admins });
});

app.post('/api/admins', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageAdmins(user))) return;

  const error = validateAdminPayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const email = normalizeEmail(req.body.email);
  if (users.some((entry) => entry.email === email)) return res.status(409).json({ message: 'Ja existe usuario com esse e-mail.' });

  const adminUser: User = {
    id: randomUUID(),
    name: String(req.body.fullName).trim(),
    email: email ?? '',
    phone: String(req.body.phone).trim(),
    passwordHash: hashPassword(String(req.body.password)),
    role: 'admin',
    permissionLevel: req.body.permissionLevel,
    createdAt: now(),
  };
  const admin: Admin = {
    id: randomUUID(),
    userId: adminUser.id,
    fullName: adminUser.name,
    email: adminUser.email,
    phone: adminUser.phone,
    permissionLevel: req.body.permissionLevel,
    status: req.body.status,
    createdAt: now(),
    updatedAt: now(),
  };
  users.push(adminUser);
  admins.push(admin);
  res.status(201).json({ message: 'Administrador cadastrado com sucesso.', admin });
});

app.put('/api/admins/:id', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageAdmins(user))) return;

  const admin = admins.find((entry) => entry.id === req.params.id);
  if (!admin) return res.status(404).json({ message: 'Administrador nao encontrado.' });

  const error = validateAdminPayload(req.body, true);
  if (error) return res.status(400).json({ message: error });

  Object.assign(admin, {
    ...req.body,
    email: req.body.email ? normalizeEmail(req.body.email) : admin.email,
    updatedAt: now(),
  });

  const adminUser = users.find((entry) => entry.id === admin.userId);
  if (adminUser) {
    adminUser.name = admin.fullName;
    adminUser.email = admin.email;
    adminUser.phone = admin.phone;
    adminUser.permissionLevel = admin.permissionLevel;
    if (req.body.password) adminUser.passwordHash = hashPassword(String(req.body.password));
  }

  res.json({ message: 'Administrador atualizado com sucesso.', admin });
});

app.delete('/api/admins/:id', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageAdmins(user))) return;

  const admin = admins.find((entry) => entry.id === req.params.id);
  if (!admin) return res.status(404).json({ message: 'Administrador nao encontrado.' });
  admin.status = 'inactive';
  admin.updatedAt = now();
  res.json({ message: 'Administrador desativado com sucesso.', admin });
});

app.get('/api/games', (req, res) => {
  const status = String(req.query.status ?? '');
  const sportType = String(req.query.sportType ?? '').toLowerCase();
  const courtId = String(req.query.courtId ?? '');

  res.json({
    games: games
      .filter(
        (game) =>
          (!status || game.status === status) &&
          (!sportType || game.sportType.toLowerCase().includes(sportType)) &&
          (!courtId || game.courtId === courtId),
      )
      .map(hydrateGame),
  });
});

app.get('/api/games/:id', (req, res) => {
  const game = games.find((entry) => entry.id === req.params.id);
  if (!game) return res.status(404).json({ message: 'Jogo nao encontrado.' });
  res.json({ game: hydrateGame(game) });
});

app.post('/api/games', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageGames(user))) return;

  const error = validateGamePayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const game: Game = {
    id: randomUUID(),
    title: String(req.body.title).trim(),
    courtId: String(req.body.courtId),
    date: String(req.body.date),
    startTime: String(req.body.startTime),
    endTime: String(req.body.endTime),
    sportType: String(req.body.sportType).trim(),
    maxParticipants: Number(req.body.maxParticipants),
    confirmedAthleteIds: parseStringArray(req.body.confirmedAthleteIds),
    pendingAthleteIds: parseStringArray(req.body.pendingAthleteIds),
    status: req.body.status,
    description: String(req.body.description ?? '').trim() || undefined,
    rules: String(req.body.rules ?? '').trim() || undefined,
    participantRate: parseNumber(req.body.participantRate),
    createdBy: user?.id ?? 'system',
    updatedBy: user?.id ?? 'system',
    createdAt: now(),
    updatedAt: now(),
  };

  if (game.confirmedAthleteIds.length > game.maxParticipants) {
    return res.status(400).json({ message: 'Numero de atletas acima do limite do jogo.' });
  }
  if (new Set(game.confirmedAthleteIds).size !== game.confirmedAthleteIds.length) {
    return res.status(400).json({ message: 'Nao e permitido duplicar atletas no jogo.' });
  }
  if (game.confirmedAthleteIds.length >= game.maxParticipants) game.status = 'closed';

  games.push(game);
  res.status(201).json({ message: 'Jogo criado com sucesso.', game: hydrateGame(game) });
});

app.put('/api/games/:id', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageGames(user))) return;

  const game = games.find((entry) => entry.id === req.params.id);
  if (!game) return res.status(404).json({ message: 'Jogo nao encontrado.' });

  const nextPayload = { ...game, ...req.body };
  const error = validateGamePayload(nextPayload, true, game.id);
  if (error) return res.status(400).json({ message: error });

  Object.assign(game, {
    ...req.body,
    maxParticipants: req.body.maxParticipants !== undefined ? Number(req.body.maxParticipants) : game.maxParticipants,
    confirmedAthleteIds: req.body.confirmedAthleteIds ? parseStringArray(req.body.confirmedAthleteIds) : game.confirmedAthleteIds,
    pendingAthleteIds: req.body.pendingAthleteIds ? parseStringArray(req.body.pendingAthleteIds) : game.pendingAthleteIds,
    participantRate: req.body.participantRate !== undefined ? parseNumber(req.body.participantRate) : game.participantRate,
    updatedBy: user?.id ?? game.updatedBy,
    updatedAt: now(),
  });

  if (game.confirmedAthleteIds.length > game.maxParticipants) {
    return res.status(400).json({ message: 'Numero de atletas acima do limite do jogo.' });
  }
  if (game.confirmedAthleteIds.length >= game.maxParticipants && game.status === 'open') game.status = 'closed';

  res.json({ message: 'Jogo atualizado com sucesso.', game: hydrateGame(game) });
});

app.post('/api/games/:id/join', (req, res) => {
  const user = currentUser(req);
  const athlete = athletes.find((entry) => entry.userId === user?.id || entry.id === req.body.athleteId);
  const game = games.find((entry) => entry.id === req.params.id);

  if (!game) return res.status(404).json({ message: 'Jogo nao encontrado.' });
  if (!athlete || athlete.status !== 'active') return res.status(403).json({ message: 'Atleta ativo nao encontrado para inscricao.' });
  if (!['open'].includes(game.status)) return res.status(409).json({ message: 'Este jogo nao esta aberto para inscricoes.' });
  if (game.confirmedAthleteIds.includes(athlete.id) || game.pendingAthleteIds.includes(athlete.id)) {
    return res.status(409).json({ message: 'Atleta ja inscrito neste jogo.' });
  }
  if (game.confirmedAthleteIds.length >= game.maxParticipants) {
    game.status = 'closed';
    return res.status(409).json({ message: 'O limite de participantes foi atingido.' });
  }

  game.confirmedAthleteIds.push(athlete.id);
  athlete.gameHistory = Array.from(new Set([...athlete.gameHistory, game.id]));
  if (game.confirmedAthleteIds.length >= game.maxParticipants) game.status = 'closed';
  game.updatedBy = user?.id ?? game.updatedBy;
  game.updatedAt = now();

  res.json({ message: 'Participacao confirmada com sucesso.', game: hydrateGame(game) });
});

app.delete('/api/games/:id/athletes/:athleteId', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageGames(user))) return;

  const game = games.find((entry) => entry.id === req.params.id);
  if (!game) return res.status(404).json({ message: 'Jogo nao encontrado.' });

  game.confirmedAthleteIds = game.confirmedAthleteIds.filter((id) => id !== req.params.athleteId);
  game.pendingAthleteIds = game.pendingAthleteIds.filter((id) => id !== req.params.athleteId);
  if (game.status === 'closed' && game.confirmedAthleteIds.length < game.maxParticipants) game.status = 'open';
  game.updatedBy = user?.id ?? game.updatedBy;
  game.updatedAt = now();

  res.json({ message: 'Atleta removido do jogo.', game: hydrateGame(game) });
});

app.post('/api/games/:id/cancel', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageGames(user))) return;

  const game = games.find((entry) => entry.id === req.params.id);
  if (!game) return res.status(404).json({ message: 'Jogo nao encontrado.' });
  game.status = 'cancelled';
  game.updatedBy = user?.id ?? game.updatedBy;
  game.updatedAt = now();
  res.json({ message: 'Jogo cancelado com sucesso.', game: hydrateGame(game) });
});

app.get('/api/financial/summary', (req, res) => {
  const user = currentUser(req);
  if (requirePermission(res, canManageFinancial(user))) return;

  const totalGames = games.length;
  const estimatedRevenue = games.reduce((total, game) => total + (game.participantRate ?? 0) * game.confirmedAthleteIds.length, 0);
  res.json({ summary: { totalGames, estimatedRevenue } });
});

const server = app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`A porta ${port} ja esta em uso. Feche o outro servidor ou rode com PORT=outra_porta.`);
    process.exit(1);
  }

  throw error;
});
