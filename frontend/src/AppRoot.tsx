import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { BottomTabBar } from './components/BottomTabBar';
import { AdminScreen } from './screens/AdminScreen';
import { AuthScreen } from './screens/AuthScreen';
import { CourtsScreen } from './screens/CourtsScreen';
import { GamesScreen } from './screens/GamesScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SocialScreen } from './screens/SocialScreen';
import { palette } from './theme';
import { ApiClient, AppTab, AuthResponse, AuthTab, FeedbackType, LoginForm, PublicUser, RegisterForm } from './types';

function getDefaultApiUrl(): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3001`;
  }

  return Platform.select({
    android: 'http://10.0.2.2:3001',
    default: 'http://localhost:3001',
  });
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();

function buildUrl(path: string): string {
  return `${API_URL}${path}`;
}

async function parseApiMessage(response: Response): Promise<AuthResponse> {
  return (await response.json()) as AuthResponse;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? 'Nao foi possivel concluir a operacao.');
  }
  return data;
}

export default function AppRoot() {
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');

  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const api: ApiClient = {
    get: <T,>(path: string) =>
      fetch(buildUrl(path), {
        headers: currentUser ? { 'x-user-id': currentUser.id } : undefined,
      }).then((response) => parseResponse<T>(response)),
    post: <T,>(path: string, body?: unknown) =>
      fetch(buildUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(currentUser ? { 'x-user-id': currentUser.id } : {}) },
        body: JSON.stringify(body ?? {}),
      }).then((response) => parseResponse<T>(response)),
    put: <T,>(path: string, body?: unknown) =>
      fetch(buildUrl(path), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(currentUser ? { 'x-user-id': currentUser.id } : {}) },
        body: JSON.stringify(body ?? {}),
      }).then((response) => parseResponse<T>(response)),
    delete: <T,>(path: string) =>
      fetch(buildUrl(path), {
        method: 'DELETE',
        headers: currentUser ? { 'x-user-id': currentUser.id } : undefined,
      }).then((response) => parseResponse<T>(response)),
  };

  async function onRegisterSubmit() {
    if (registerForm.password !== registerForm.confirmPassword) {
      setFeedbackType('error');
      setFeedback('As senhas nao coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(buildUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const result = await parseApiMessage(response);

      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(result.message);
        return;
      }

      setFeedbackType('success');
      setFeedback(result.message);
      setAuthTab('login');
      setRegisterForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    } catch {
      setFeedbackType('error');
      setFeedback('Nao foi possivel conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onLoginSubmit() {
    setSubmitting(true);
    try {
      const response = await fetch(buildUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const result = await parseApiMessage(response);

      if (!response.ok || !result.user) {
        setFeedbackType('error');
        setFeedback(result.message);
        return;
      }

      setCurrentUser(result.user);
      setFeedback('');
      setFeedbackType('');
      setActiveTab('home');
    } catch {
      setFeedbackType('error');
      setFeedback('Nao foi possivel conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  }

  function onLogout() {
    setCurrentUser(null);
    setAuthTab('login');
    setLoginForm({ email: '', password: '' });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {currentUser ? (
        <View style={styles.appContainer}>
          <View style={styles.screenContainer}>
            {activeTab === 'home' && <HomeScreen api={api} user={currentUser} />}
            {activeTab === 'courts' && <CourtsScreen api={api} user={currentUser} />}
            {activeTab === 'games' && <GamesScreen api={api} user={currentUser} />}
            {activeTab === 'social' && <SocialScreen api={api} user={currentUser} />}
            {activeTab === 'admin' && <AdminScreen api={api} user={currentUser} />}
            {activeTab === 'profile' && <ProfileScreen api={api} user={currentUser} onUserChange={setCurrentUser} onLogout={onLogout} />}
          </View>
          <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
        </View>
      ) : (
        <AuthScreen
          authTab={authTab}
          submitting={submitting}
          feedback={feedback}
          feedbackType={feedbackType}
          loginForm={loginForm}
          registerForm={registerForm}
          onGoLogin={() => {
            setAuthTab('login');
            setFeedback('');
            setFeedbackType('');
          }}
          onGoRegister={() => {
            setAuthTab('register');
            setFeedback('');
            setFeedbackType('');
          }}
          onLoginChange={(field, value) => setLoginForm((prev) => ({ ...prev, [field]: value }))}
          onRegisterChange={(field, value) => setRegisterForm((prev) => ({ ...prev, [field]: value }))}
          onLoginSubmit={onLoginSubmit}
          onRegisterSubmit={onRegisterSubmit}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primary,
  },
  appContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
