import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Tab = 'login' | 'register';
type FeedbackType = 'success' | 'error' | '';

type RegisterForm = {
  name: string;
  cep: string;
  favoriteTime: string;
  birthDate: string;
  sports: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type LoginForm = {
  email: string;
  password: string;
};

type ApiMessage = { message: string };

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

export default function App() {
  const [tab, setTab] = useState<Tab>('login');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');
  const [submitting, setSubmitting] = useState(false);

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    cep: '',
    favoriteTime: '',
    birthDate: '',
    sports: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const feedbackStyle = useMemo(() => {
    if (feedbackType === 'error') return styles.feedbackError;
    if (feedbackType === 'success') return styles.feedbackSuccess;
    return styles.feedbackBase;
  }, [feedbackType]);

  function goToTab(nextTab: Tab): void {
    setTab(nextTab);
    setFeedback('');
    setFeedbackType('');
  }

  function buildUrl(path: string): string {
    return `${API_URL}${path}`;
  }

  async function parseMessage(response: Response): Promise<string> {
    const result = (await response.json()) as ApiMessage;
    return result.message;
  }

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
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword,
        }),
      });

      const message = await parseMessage(response);

      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(message);
        return;
      }

      setFeedbackType('success');
      setFeedback(message);
      setRegisterForm({
        name: '',
        cep: '',
        favoriteTime: '',
        birthDate: '',
        sports: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      setTab('login');
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

      const message = await parseMessage(response);

      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(message);
        return;
      }

      setFeedbackType('success');
      setFeedback(message);
    } catch {
      setFeedbackType('error');
      setFeedback('Nao foi possivel conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = tab === 'login';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            isLogin ? styles.scrollContainerLogin : styles.scrollContainerRegister,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.shell, isLogin && styles.shellLogin]}>
            <View style={styles.hero}>
              <View style={styles.heroMark}>
                <Text style={styles.heroMarkText}>A</Text>
              </View>
              <Text style={styles.heroTitle}>{isLogin ? 'SEU JOGO COMECA AQUI' : 'CRIE SUA CONTA'}</Text>
              {isLogin ? <Text style={styles.heroSubtitle}>Faca login em sua conta</Text> : null}
            </View>

            {isLogin ? (
              <View style={styles.formCard}>
                <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="E-mail / Usuario"
                  placeholderTextColor="#8b8b8b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={loginForm.email}
                  onChangeText={(value) => setLoginForm((prev) => ({ ...prev, email: value }))}
                  editable={!submitting}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#8b8b8b"
                  secureTextEntry
                  value={loginForm.password}
                  onChangeText={(value) => setLoginForm((prev) => ({ ...prev, password: value }))}
                  editable={!submitting}
                />

                <Pressable style={styles.linkButton} disabled={submitting}>
                  <Text style={styles.linkButtonText}>Esqueci minha senha</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryButton, submitting && styles.disabled]}
                  onPress={onLoginSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.primaryButtonText}>{submitting ? 'ENTRANDO...' : 'ENTRAR'}</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OU ENTRE COM</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable style={[styles.socialButton, submitting && styles.disabled]} disabled={submitting}>
                  <Text style={styles.socialText}>G</Text>
                </Pressable>

                <View style={styles.switchBlock}>
                  <Text style={styles.switchLabel}>NAO POSSUI UMA CONTA?</Text>
                  <Pressable onPress={() => goToTab('register')} disabled={submitting}>
                    <Text style={styles.switchLink}>CADASTRE-SE AGORA</Text>
                  </Pressable>
                </View>
                </View>
              </View>
            ) : (
              <View style={styles.formCard}>
                <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Nome"
                  placeholderTextColor="#8b8b8b"
                  value={registerForm.name}
                  onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, name: value }))}
                  editable={!submitting}
                />

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.compactInput]}
                    placeholder="CEP"
                    placeholderTextColor="#8b8b8b"
                    value={registerForm.cep}
                    onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, cep: value }))}
                    editable={!submitting}
                  />
                  <TextInput
                    style={[styles.input, styles.wideInput]}
                    placeholder="Selecione seus horarios favoritos"
                    placeholderTextColor="#8b8b8b"
                    value={registerForm.favoriteTime}
                    onChangeText={(value) =>
                      setRegisterForm((prev) => ({ ...prev, favoriteTime: value }))
                    }
                    editable={!submitting}
                  />
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.compactInput]}
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor="#8b8b8b"
                    value={registerForm.birthDate}
                    onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, birthDate: value }))}
                    editable={!submitting}
                  />
                  <TextInput
                    style={[styles.input, styles.wideInput]}
                    placeholder="Selecione seus esportes"
                    placeholderTextColor="#8b8b8b"
                    value={registerForm.sports}
                    onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, sports: value }))}
                    editable={!submitting}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nome de usuario"
                  placeholderTextColor="#8b8b8b"
                  autoCapitalize="none"
                  value={registerForm.username}
                  onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, username: value }))}
                  editable={!submitting}
                />

                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#8b8b8b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={registerForm.email}
                  onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, email: value }))}
                  editable={!submitting}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Telefone"
                  placeholderTextColor="#8b8b8b"
                  keyboardType="phone-pad"
                  value={registerForm.phone}
                  onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, phone: value }))}
                  editable={!submitting}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Criar senha"
                  placeholderTextColor="#8b8b8b"
                  secureTextEntry
                  value={registerForm.password}
                  onChangeText={(value) => setRegisterForm((prev) => ({ ...prev, password: value }))}
                  editable={!submitting}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirmar senha"
                  placeholderTextColor="#8b8b8b"
                  secureTextEntry
                  value={registerForm.confirmPassword}
                  onChangeText={(value) =>
                    setRegisterForm((prev) => ({ ...prev, confirmPassword: value }))
                  }
                  editable={!submitting}
                />

                <Pressable
                  style={[styles.primaryButton, submitting && styles.disabled]}
                  onPress={onRegisterSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.primaryButtonText}>
                    {submitting ? 'CADASTRANDO...' : 'CADASTRE-SE'}
                  </Text>
                </Pressable>

                <View style={styles.switchBlock}>
                  <Text style={styles.switchLabel}>JA POSSUI UMA CONTA?</Text>
                  <Pressable onPress={() => goToTab('login')} disabled={submitting}>
                    <Text style={styles.switchLink}>ENTRAR</Text>
                  </Pressable>
                </View>
                </View>
              </View>
            )}

            <Text style={[styles.feedbackBase, feedbackStyle]}>{feedback}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#19c93c',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  scrollContainerLogin: {
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 36,
  },
  scrollContainerRegister: {
    justifyContent: 'flex-start',
  },
  shell: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 14,
  },
  shellLogin: {
    minHeight: '100%',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 10,
  },
  heroMark: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#f7fff7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroMarkText: {
    color: '#13b431',
    fontSize: 30,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    marginTop: 8,
    color: '#ecffec',
    fontSize: 14,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 14,
  },
  form: {
    gap: 11,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    width: '100%',
    height: 46,
    borderRadius: 9,
    backgroundColor: '#f5f5f5',
    color: '#656565',
    fontSize: 14,
    paddingHorizontal: 14,
  },
  compactInput: {
    flex: 0.9,
  },
  wideInput: {
    flex: 2.1,
  },
  linkButton: {
    alignSelf: 'center',
    paddingVertical: 5,
  },
  linkButtonText: {
    color: '#eeffee',
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#7b7b7b',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    letterSpacing: 1.4,
  },
  socialButton: {
    marginTop: 2,
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    color: '#6f6f6f',
    fontSize: 24,
    fontWeight: '800',
  },
  switchBlock: {
    marginTop: 12,
    alignItems: 'center',
  },
  switchLabel: {
    color: '#eeffee',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  switchLink: {
    marginTop: 6,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackBase: {
    minHeight: 34,
    borderRadius: 9,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  feedbackError: {
    backgroundColor: 'rgba(216, 34, 34, 0.32)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(15, 140, 55, 0.34)',
  },
  disabled: {
    opacity: 0.7,
  },
});
