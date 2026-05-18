export type AuthTab = 'login' | 'register';
export type AppTab = 'home' | 'search' | 'notifications' | 'profile';

export type FeedbackType = 'success' | 'error' | '';

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
  createdAt: string;
};

export type ApiMessage = { message: string };
export type AuthResponse = ApiMessage & { user?: PublicUser };

export type CourtSuggestion = {
  id: string;
  name: string;
  neighborhood: string;
  rating: number;
  imageUrl: string;
};
