import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { notifications } from '../data';
import { GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';

export function NotificationsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>NOTIFICACOES</Text>
      </View>

      <Text style={styles.sortText}>Ordenar por: recentes</Text>
      {notifications.map((message) => (
        <GlassCard key={message}>
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
    gap: 12,
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
