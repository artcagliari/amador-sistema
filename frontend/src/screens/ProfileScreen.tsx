import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../components/FadeInView';
import { GlassButton, GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';
import { PublicUser } from '../types';

type Props = {
  user: PublicUser;
  onLogout: () => void;
};

export function ProfileScreen({ user, onLogout }: Props) {
  const handle = user.name.toLowerCase().replace(/\s+/g, '');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FadeInView style={styles.hero}>
        <Image
          source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SEU PERFIL</Text>
      </FadeInView>

      <FadeInView delay={70} style={styles.avatar}>
        <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
      </FadeInView>

      <Text style={styles.handle}>@{handle}</Text>

      <GlassCard delay={120}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
      </GlassCard>
      <GlassCard delay={170}>
        <Text style={styles.label}>Telefone</Text>
        <Text style={styles.value}>{user.phone}</Text>
      </GlassCard>
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
  hero: {
    alignItems: 'center',
  },
  logo: {
    width: 86,
    height: 86,
  },
  title: {
    color: palette.textOnPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  avatar: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  avatarText: {
    color: palette.textOnPrimary,
    fontSize: 64,
    fontWeight: '700',
  },
  handle: {
    color: palette.textOnPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  label: {
    color: palette.textSoft,
    fontSize: 14,
  },
  value: {
    color: palette.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 3,
  },
});
