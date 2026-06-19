import MapView, { Marker } from 'react-native-maps';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { FadeInView } from '../components/FadeInView';
import { Feedback } from '../components/FormKit';
import { GlassButton, GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';
import { ApiClient, FeedbackType, Game, PublicUser } from '../types';

type Props = {
  api: ApiClient;
  user: PublicUser;
};

export function HomeScreen({ api }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');
  const [loading, setLoading] = useState(false);

  async function loadSlots() {
    setLoading(true);
    try {
      const result = await api.get<{ games: Game[] }>('/api/home/slots');
      setGames(result.games);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel carregar horarios.');
    } finally {
      setLoading(false);
    }
  }

  async function joinGame(game: Game) {
    try {
      const result = await api.post<{ message: string; game: Game }>(`/api/games/${game.id}/join`, {});
      setFeedbackType('success');
      setFeedback(result.message);
      setGames((prev) =>
        prev
          .map((entry) => (entry.id === game.id ? result.game : entry))
          .filter((entry) => entry.status === 'open' && entry.confirmedAthleteIds.length < entry.maxParticipants),
      );
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel candidatar voce.');
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FadeInView style={styles.hero}>
        <Image
          source={require('../../assets/app-logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>QUADRAS PROXIMAS A VOCE</Text>
        <Text style={styles.subtitle}>Encontre jogos e horarios perto de voce.</Text>
      </FadeInView>

      <FadeInView delay={80} style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: -22.9519,
            longitude: -43.2105,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        >
          <Marker coordinate={{ latitude: -22.9519, longitude: -43.2105 }} title="Voce" pinColor="#ff3b30" />
          <Marker coordinate={{ latitude: -22.9583, longitude: -43.2001 }} title="Quadra 1" pinColor="#34c759" />
          <Marker coordinate={{ latitude: -22.9464, longitude: -43.2198 }} title="Quadra 2" pinColor="#34c759" />
        </MapView>
      </FadeInView>

      <Text style={styles.section}>Horarios para voce</Text>
      <Feedback message={feedback} type={feedbackType} />
      <GlassButton label={loading ? 'CARREGANDO...' : 'ATUALIZAR HORARIOS'} onPress={loadSlots} disabled={loading} />
      {games.length === 0 && (
        <GlassCard>
          <Text style={styles.cardText}>Nenhum horario com vaga sobrando no momento.</Text>
        </GlassCard>
      )}
      {games.map((game, index) => {
        const openSpots = game.maxParticipants - game.confirmedAthleteIds.length;
        return (
        <GlassCard key={game.id} delay={120 + index * 70}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={styles.cardPill}>{openSpots} vaga(s)</Text>
          </View>
          <Text style={styles.cardText}>Local: {game.court?.name ?? 'Quadra'}</Text>
          <Text style={styles.cardText}>{game.date} das {game.startTime} as {game.endTime}</Text>
          <Text style={styles.cardText}>Confirmados: {game.confirmedAthleteIds.length}/{game.maxParticipants}</Text>
          <GlassButton label="CANDIDATAR" onPress={() => joinGame(game)} />
        </GlassCard>
        );
      })}
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
    gap: 6,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    color: palette.textOnPrimary,
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: palette.textSoft,
    fontSize: 15,
    textAlign: 'center',
  },
  mapWrap: {
    height: 238,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  section: {
    color: palette.textSoft,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  cardTitle: {
    color: palette.textOnPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardPill: {
    color: palette.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.glassStrong,
    overflow: 'hidden',
  },
  cardText: {
    color: palette.textSoft,
    fontSize: 15,
    marginTop: 4,
  },
});
