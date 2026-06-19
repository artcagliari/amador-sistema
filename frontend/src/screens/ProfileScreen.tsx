import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../components/FadeInView';
import { Field, Feedback, SelectPills } from '../components/FormKit';
import { GlassButton, GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';
import { ApiClient, Athlete, AthleteLevel, FeedbackType, PublicUser } from '../types';

type Props = {
  api: ApiClient;
  user: PublicUser;
  onUserChange: (user: PublicUser) => void;
  onLogout: () => void;
};

const levelOptions = [
  { label: 'Iniciante', value: 'beginner' as const },
  { label: 'Intermediario', value: 'intermediate' as const },
  { label: 'Avancado', value: 'advanced' as const },
];

export function ProfileScreen({ api, user, onUserChange, onLogout }: Props) {
  const handle = user.name.toLowerCase().replace(/\s+/g, '');
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [accountForm, setAccountForm] = useState({ name: user.name, email: user.email, phone: user.phone });
  const [form, setForm] = useState({ fullName: user.name, phone: user.phone, city: '', position: '', level: 'beginner' as AthleteLevel, profilePhotoUrl: '' });
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');

  useEffect(() => {
    if (user.role !== 'athlete') return;

    api
      .get<{ athlete: Athlete }>('/api/athletes/me')
      .then((result) => {
        setAthlete(result.athlete);
        setForm({
          fullName: result.athlete.fullName,
          phone: result.athlete.phone,
          city: result.athlete.city,
          position: result.athlete.position ?? '',
          level: result.athlete.level,
          profilePhotoUrl: result.athlete.profilePhotoUrl ?? '',
        });
      })
      .catch((error) => {
        setFeedbackType('error');
        setFeedback(error instanceof Error ? error.message : 'Nao foi possivel carregar o perfil.');
      });
  }, [user.id]);

  useEffect(() => {
    setAccountForm({ name: user.name, email: user.email, phone: user.phone });
  }, [user.id, user.name, user.email, user.phone]);

  async function saveAccount() {
    if (!accountForm.name || !accountForm.email || !accountForm.phone) {
      setFeedbackType('error');
      setFeedback('Preencha nome, e-mail e telefone.');
      return;
    }

    try {
      const result = await api.put<{ message: string; user: PublicUser }>('/api/users/me', accountForm);
      setFeedbackType('success');
      setFeedback(result.message);
      onUserChange(result.user);
      setForm((prev) => ({ ...prev, fullName: result.user.name, phone: result.user.phone }));
      if (athlete) {
        setAthlete({ ...athlete, fullName: result.user.name, email: result.user.email, phone: result.user.phone });
      }
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel atualizar o usuario.');
    }
  }

  async function saveProfile() {
    if (!athlete) return;
    if (!form.fullName || !form.phone) {
      setFeedbackType('error');
      setFeedback('Preencha nome e telefone.');
      return;
    }

    try {
      const result = await api.put<{ message: string; athlete: Athlete }>(`/api/athletes/${athlete.id}`, form);
      setFeedbackType('success');
      setFeedback(result.message);
      setAthlete(result.athlete);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel atualizar o perfil.');
    }
  }

  async function pickProfilePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFeedbackType('error');
      setFeedback('Permita acesso as fotos para escolher uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.45,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setFeedbackType('error');
      setFeedback('Nao foi possivel ler a foto escolhida.');
      return;
    }

    setForm((prev) => ({ ...prev, profilePhotoUrl: `data:image/jpeg;base64,${asset.base64}` }));
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FadeInView style={styles.hero}>
        <Image
          source={require('../../assets/app-logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SEU PERFIL</Text>
      </FadeInView>

      <FadeInView delay={70} style={styles.avatar}>
        {form.profilePhotoUrl ? (
          <Image source={{ uri: form.profilePhotoUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        )}
      </FadeInView>

      <Text style={styles.handle}>@{handle}</Text>
      <Feedback message={feedback} type={feedbackType} />

      <GlassCard delay={120}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
        <Text style={styles.label}>Tipo de conta</Text>
        <Text style={styles.value}>{user.role === 'admin' ? `Administrador ${user.permissionLevel ?? ''}` : 'Atleta'}</Text>
      </GlassCard>

      <GlassCard delay={145}>
        <View style={styles.form}>
          <Text style={styles.cardTitle}>Informacoes de usuario</Text>
          <Field label="Nome" value={accountForm.name} onChangeText={(name) => setAccountForm((prev) => ({ ...prev, name }))} />
          <Field label="Email" value={accountForm.email} keyboardType="email-address" onChangeText={(email) => setAccountForm((prev) => ({ ...prev, email }))} />
          <Field label="Telefone" value={accountForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setAccountForm((prev) => ({ ...prev, phone }))} />
          <GlassButton label="SALVAR USUARIO" onPress={saveAccount} />
        </View>
      </GlassCard>

      {user.role === 'athlete' && (
        <GlassCard delay={170}>
          <View style={styles.form}>
            <Text style={styles.cardTitle}>Dados do atleta</Text>
            <Field label="Nome completo" value={form.fullName} onChangeText={(fullName) => setForm((prev) => ({ ...prev, fullName }))} />
            <Field label="Telefone" value={form.phone} keyboardType="phone-pad" onChangeText={(phone) => setForm((prev) => ({ ...prev, phone }))} />
            <Field label="Cidade" value={form.city} onChangeText={(city) => setForm((prev) => ({ ...prev, city }))} />
            <Field label="Posicao ou funcao" value={form.position} onChangeText={(position) => setForm((prev) => ({ ...prev, position }))} />
            <GlassButton label={form.profilePhotoUrl ? 'TROCAR FOTO' : 'ESCOLHER FOTO'} onPress={pickProfilePhoto} />
            <SelectPills label="Nivel" value={form.level} options={levelOptions} onChange={(level) => setForm((prev) => ({ ...prev, level }))} />
            <Text style={styles.label}>Historico de jogos</Text>
            <Text style={styles.value}>{athlete?.gameHistory.length ? `${athlete.gameHistory.length} jogo(s)` : 'Nenhum jogo confirmado ainda'}</Text>
            <GlassButton label="SALVAR PERFIL" onPress={saveProfile} />
          </View>
        </GlassCard>
      )}

      <GlassCard delay={220}>
        <Text style={styles.label}>Conta criada</Text>
        <Text style={styles.value}>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</Text>
      </GlassCard>

      <GlassButton label="Sair da conta" onPress={onLogout} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.bottomSafeGap,
    gap: spacing.comfortableGap,
    width: '100%',
    maxWidth: spacing.contentMaxWidth,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center' },
  logo: { width: 86, height: 86 },
  title: { color: palette.textOnPrimary, fontSize: 28, fontWeight: '800' },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: palette.textOnPrimary, fontSize: 58, fontWeight: '700' },
  handle: { color: palette.textOnPrimary, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  form: { gap: 12 },
  cardTitle: { color: palette.textOnPrimary, fontSize: 20, fontWeight: '800' },
  label: { color: palette.textSoft, fontSize: 14, marginTop: 8 },
  value: { color: palette.textOnPrimary, fontSize: 17, fontWeight: '600', marginTop: 3 },
});
