import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { notifications } from '../data';
import { FadeInView } from '../components/FadeInView';
import { GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';

export function NotificationsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FadeInView style={styles.hero}>
        <Image
          source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>NOTIFICACOES</Text>
      </FadeInView>

      <Text style={styles.sortText}>Ordenar por: recentes</Text>
      {notifications.map((message, index) => (
        <GlassCard key={message} delay={80 + index * 45}>
          <Text style={styles.message}>{message}</Text>
        </GlassCard>
      ))}
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
    marginBottom: 4,
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
  sortText: {
    color: palette.textSoft,
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: palette.textSoft,
    fontSize: 16,
  },
});
