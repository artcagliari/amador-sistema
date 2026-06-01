export type AuthTab = 'login' | 'register';
export type AppTab = 'home' | 'courts' | 'games' | 'admin' | 'profile';
export type FeedbackType = 'success' | 'error' | '';

export type UserRole = 'athlete' | 'admin';
export type AdminPermission = 'general' | 'court' | 'financial' | 'limited';
export type EntityStatus = 'active' | 'inactive';
export type CourtStatus = 'active' | 'inactive' | 'maintenance';
export type AthleteLevel = 'beginner' | 'intermediate' | 'advanced';
export type GameStatus = 'open' | 'closed' | 'in_progress' | 'finished' | 'cancelled';

export type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type LoginForm = {
  email: string;
  password: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  permissionLevel?: AdminPermission;
  createdAt: string;
};

export type Court = {
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
  geocodingPending?: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Athlete = {
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

export type AdminUser = {
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

export type Game = {
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
  court?: Court;
  confirmedAthletes?: Athlete[];
  pendingAthletes?: Athlete[];
};

export type ApiMessage = { message: string };
export type AuthResponse = ApiMessage & { user?: PublicUser };

export type ApiClient = {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  put: <T>(path: string, body?: unknown) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
};

export type CourtSuggestion = {
  id: string;
  name: string;
  neighborhood: string;
  rating: number;
  imageUrl: string;
};
