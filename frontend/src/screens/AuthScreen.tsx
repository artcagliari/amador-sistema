import { useMemo } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FadeInView } from '../components/FadeInView';
import { GlassButton, GlassCard } from '../components/Glass';
import { FeedbackType, LoginForm, RegisterForm } from '../types';
import { palette, spacing } from '../theme';

type Props = {
  authTab: 'login' | 'register';
  submitting: boolean;
  feedback: string;
  feedbackType: FeedbackType;
  loginForm: LoginForm;
  registerForm: RegisterForm;
  onGoLogin: () => void;
  onGoRegister: () => void;
  onLoginChange: (field: keyof LoginForm, value: string) => void;
  onRegisterChange: (field: keyof RegisterForm, value: string) => void;
  onLoginSubmit: () => void;
  onRegisterSubmit: () => void;
};

export function AuthScreen(props: Props) {
  const feedbackStyle = useMemo(() => {
    if (props.feedbackType === 'error') return styles.feedbackError;
    if (props.feedbackType === 'success') return styles.feedbackSuccess;
    return null;
  }, [props.feedbackType]);

  const isLogin = props.authTab === 'login';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, isLogin ? styles.loginContent : undefined]}>
        <FadeInView style={styles.hero}>
          <Image
            source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{isLogin ? 'SEU JOGO COMECA AQUI' : 'CRIE SUA CONTA'}</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Entre para continuar' : 'Cadastro rapido e seguro'}</Text>
        </FadeInView>

        <GlassCard delay={90}>
          {isLogin ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#6b8373"
                autoCapitalize="none"
                keyboardType="email-address"
                value={props.loginForm.email}
                editable={!props.submitting}
                onChangeText={(value) => props.onLoginChange('email', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#6b8373"
                secureTextEntry
                value={props.loginForm.password}
                editable={!props.submitting}
                onChangeText={(value) => props.onLoginChange('password', value)}
              />
              <GlassButton
                label={props.submitting ? 'ENTRANDO...' : 'ENTRAR'}
                onPress={props.onLoginSubmit}
                disabled={props.submitting}
              />
              <View style={styles.switchBlock}>
                <Text style={styles.switchText}>NAO POSSUI UMA CONTA?</Text>
                <Pressable onPress={props.onGoRegister} disabled={props.submitting}>
                  <Text style={styles.switchLink}>CADASTRE-SE</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Nome"
                placeholderTextColor="#6b8373"
                value={props.registerForm.name}
                editable={!props.submitting}
                onChangeText={(value) => props.onRegisterChange('name', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#6b8373"
                autoCapitalize="none"
                keyboardType="email-address"
                value={props.registerForm.email}
                editable={!props.submitting}
                onChangeText={(value) => props.onRegisterChange('email', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Telefone"
                placeholderTextColor="#6b8373"
                keyboardType="phone-pad"
                value={props.registerForm.phone}
                editable={!props.submitting}
                onChangeText={(value) => props.onRegisterChange('phone', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#6b8373"
                secureTextEntry
                value={props.registerForm.password}
                editable={!props.submitting}
                onChangeText={(value) => props.onRegisterChange('password', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                placeholderTextColor="#6b8373"
                secureTextEntry
                value={props.registerForm.confirmPassword}
                editable={!props.submitting}
                onChangeText={(value) => props.onRegisterChange('confirmPassword', value)}
              />
              <GlassButton
                label={props.submitting ? 'CADASTRANDO...' : 'CRIAR CONTA'}
                onPress={props.onRegisterSubmit}
                disabled={props.submitting}
              />
              <View style={styles.switchBlock}>
                <Text style={styles.switchText}>JA POSSUI UMA CONTA?</Text>
                <Pressable onPress={props.onGoLogin} disabled={props.submitting}>
                  <Text style={styles.switchLink}>ENTRAR</Text>
                </Pressable>
              </View>
            </View>
          )}
        </GlassCard>

        <Text style={[styles.feedback, feedbackStyle]}>{props.feedback}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 64,
    paddingBottom: 26,
    gap: spacing.comfortableGap,
    width: '100%',
    maxWidth: spacing.contentMaxWidth,
    alignSelf: 'center',
  },
  loginContent: {
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 4,
  },
  title: {
    color: palette.textOnPrimary,
    fontSize: 29,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: palette.textSoft,
    fontSize: 16,
  },
  form: {
    gap: 10,
  },
  input: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 15,
    backgroundColor: palette.inputBackground,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.inputText,
    fontSize: 16,
  },
  switchBlock: {
    alignItems: 'center',
    marginTop: 4,
  },
  switchText: {
    color: palette.textSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  switchLink: {
    color: palette.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  feedback: {
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: palette.textOnPrimary,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    paddingHorizontal: 12,
  },
  feedbackError: {
    backgroundColor: 'rgba(216,34,34,0.34)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(15,140,55,0.34)',
  },
});
