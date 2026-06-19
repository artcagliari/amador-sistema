import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../components/FadeInView';
import { Field, Feedback, SelectPills } from '../components/FormKit';
import { GlassButton, GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';
import { ApiClient, ChatContact, ChatMessage, FeedbackType, Game, PlayerRating, PublicUser, RankingEntry } from '../types';

type Props = {
  api: ApiClient;
  user: PublicUser;
};

type Section = 'ranking' | 'chat' | 'ratings';

const scoreOptions = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
];

export function SocialScreen({ api, user }: Props) {
  const [section, setSection] = useState<Section>('ranking');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [message, setMessage] = useState('');
  const [ratingForm, setRatingForm] = useState({ gameId: '', ratedAthleteId: '', score: '5', comment: '' });
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');
  const [loading, setLoading] = useState(false);

  const selectedGame = useMemo(() => games.find((game) => game.id === ratingForm.gameId), [games, ratingForm.gameId]);
  const finishedGames = games.filter((game) => game.status === 'finished');
  const participantOptions = (selectedGame?.confirmedAthletes ?? []).map((athlete) => ({ label: athlete.fullName, value: athlete.id }));

  async function loadSocialData() {
    setLoading(true);
    try {
      const [rankingResult, contactResult, gameResult, ratingResult] = await Promise.all([
        api.get<{ ranking: RankingEntry[] }>('/api/ranking'),
        api.get<{ contacts: ChatContact[] }>('/api/chat/contacts'),
        api.get<{ games: Game[] }>('/api/games'),
        api.get<{ ratings: PlayerRating[] }>('/api/ratings'),
      ]);

      setRanking(rankingResult.ranking);
      setContacts(contactResult.contacts);
      if (!selectedContact && contactResult.contacts[0]) {
        setSelectedContact(contactResult.contacts[0]);
        const chatResult = await api.get<{ messages: ChatMessage[] }>(`/api/chat/messages?withUserId=${contactResult.contacts[0].id}`);
        setMessages(chatResult.messages);
      } else if (selectedContact) {
        const chatResult = await api.get<{ messages: ChatMessage[] }>(`/api/chat/messages?withUserId=${selectedContact.id}`);
        setMessages(chatResult.messages);
      }
      setGames(gameResult.games);
      setRatings(ratingResult.ratings);

      const firstFinished = gameResult.games.find((game) => game.status === 'finished');
      const firstAthlete = firstFinished?.confirmedAthletes?.[0];
      if (!ratingForm.gameId && firstFinished && firstAthlete) {
        setRatingForm((prev) => ({ ...prev, gameId: firstFinished.id, ratedAthleteId: firstAthlete.id }));
      }
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel carregar as funcionalidades sociais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSocialData();
  }, []);

  async function openConversation(contact: ChatContact) {
    setSelectedContact(contact);
    setSection('chat');
    try {
      const result = await api.get<{ messages: ChatMessage[] }>(`/api/chat/messages?withUserId=${contact.id}`);
      setMessages(result.messages);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel abrir a conversa.');
    }
  }

  async function sendMessage() {
    if (!message.trim()) {
      setFeedbackType('error');
      setFeedback('Digite uma mensagem.');
      return;
    }

    try {
      if (!selectedContact) {
        setFeedbackType('error');
        setFeedback('Selecione um contato.');
        return;
      }
      const result = await api.post<{ message: string; chatMessage: ChatMessage }>('/api/chat/messages', { message, recipientUserId: selectedContact.id });
      setFeedbackType('success');
      setFeedback(result.message);
      setMessage('');
      setMessages((prev) => [...prev, result.chatMessage]);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel enviar a mensagem.');
    }
  }

  async function saveRating() {
    if (!ratingForm.gameId || !ratingForm.ratedAthleteId) {
      setFeedbackType('error');
      setFeedback('Selecione um jogo finalizado e um atleta.');
      return;
    }

    try {
      const result = await api.post<{ message: string; rating: PlayerRating }>('/api/ratings', {
        ...ratingForm,
        score: Number(ratingForm.score),
      });
      setFeedbackType('success');
      setFeedback(result.message);
      setRatingForm((prev) => ({ ...prev, comment: '' }));
      await loadSocialData();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel registrar a avaliacao.');
    }
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actions}>
          <Pressable style={[styles.switchButton, section === 'ranking' && styles.switchButtonActive]} onPress={() => setSection('ranking')}>
            <Text style={styles.switchText}>Ranking</Text>
          </Pressable>
          <Pressable style={[styles.switchButton, section === 'chat' && styles.switchButtonActive]} onPress={() => setSection('chat')}>
            <Text style={styles.switchText}>Chat</Text>
          </Pressable>
          <Pressable style={[styles.switchButton, section === 'ratings' && styles.switchButtonActive]} onPress={() => setSection('ratings')}>
            <Text style={styles.switchText}>Avaliacoes</Text>
          </Pressable>
        </View>

        <Feedback message={feedback} type={feedbackType} />

        {section === 'ranking' && (
          <>
            <GlassButton label={loading ? 'CARREGANDO...' : 'ATUALIZAR RANKING'} onPress={loadSocialData} disabled={loading} />
            {ranking.map((entry, index) => (
              <GlassCard key={entry.athlete.id} delay={40 + index * 40}>
                <View style={styles.rowBetween}>
                  <View style={styles.rankBubble}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{entry.athlete.fullName}</Text>
                    <Text style={styles.text}>{entry.athlete.position || entry.athlete.level} • {entry.gamesPlayed} jogo(s)</Text>
                  </View>
                  <Text style={styles.score}>{entry.score}</Text>
                </View>
                <Text style={styles.text}>Media: {entry.ratingAverage || '-'} em {entry.ratingCount} avaliacao(oes)</Text>
              </GlassCard>
            ))}
          </>
        )}

        {section === 'chat' && (
          <>
            <GlassCard>
              <View style={styles.form}>
                <Text style={styles.cardTitle}>Direct</Text>
                <View style={styles.contactList}>
                  {contacts.map((contact) => {
                    const active = selectedContact?.id === contact.id;
                    return (
                      <Pressable key={contact.id} style={[styles.contactPill, active && styles.contactPillActive]} onPress={() => openConversation(contact)}>
                        {contact.athlete?.profilePhotoUrl ? (
                          <Image source={{ uri: contact.athlete.profilePhotoUrl }} style={styles.contactAvatar} />
                        ) : (
                          <View style={styles.contactAvatar}>
                            <Text style={styles.contactInitial}>{contact.name.charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={[styles.contactName, active && styles.contactNameActive]}>{contact.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.text}>{selectedContact ? `Conversa com ${selectedContact.name}` : 'Selecione um perfil para conversar.'}</Text>
                <Field label="Mensagem" value={message} multiline onChangeText={setMessage} />
                <GlassButton label="ENVIAR DIRECT" onPress={sendMessage} disabled={!selectedContact} />
              </View>
            </GlassCard>
            {messages.map((chatMessage, index) => {
              const mine = chatMessage.userId === user.id;
              return (
                <GlassCard key={chatMessage.id} delay={40 + index * 20} style={mine && styles.mineCard}>
                  <Text style={styles.cardTitle}>{mine ? 'Voce' : chatMessage.userName}</Text>
                  <Text style={styles.text}>{chatMessage.message}</Text>
                  <Text style={styles.meta}>{new Date(chatMessage.createdAt).toLocaleString('pt-BR')}</Text>
                </GlassCard>
              );
            })}
          </>
        )}

        {section === 'ratings' && (
          <>
            <GlassCard>
              <View style={styles.form}>
                <Text style={styles.cardTitle}>Avaliacao pos-jogo</Text>
                {finishedGames.length ? (
                  <>
                    <SelectPills
                      label="Jogo finalizado"
                      value={ratingForm.gameId}
                      options={finishedGames.map((game) => ({ label: game.title, value: game.id }))}
                      onChange={(gameId) => {
                        const game = games.find((entry) => entry.id === gameId);
                        setRatingForm((prev) => ({ ...prev, gameId, ratedAthleteId: game?.confirmedAthletes?.[0]?.id ?? '' }));
                      }}
                    />
                    <SelectPills label="Atleta" value={ratingForm.ratedAthleteId} options={participantOptions} onChange={(ratedAthleteId) => setRatingForm((prev) => ({ ...prev, ratedAthleteId }))} />
                    <SelectPills label="Nota" value={ratingForm.score} options={scoreOptions} onChange={(score) => setRatingForm((prev) => ({ ...prev, score }))} />
                    <Field label="Comentario" value={ratingForm.comment} multiline onChangeText={(comment) => setRatingForm((prev) => ({ ...prev, comment }))} />
                    <GlassButton label="SALVAR AVALIACAO" onPress={saveRating} />
                  </>
                ) : (
                  <Text style={styles.text}>Finalize um jogo com atletas confirmados para liberar avaliacoes.</Text>
                )}
              </View>
            </GlassCard>

            {ratings.slice(-10).reverse().map((rating) => {
              const ratedAthlete = ranking.find((entry) => entry.athlete.id === rating.ratedAthleteId)?.athlete;
              const ratedGame = games.find((game) => game.id === rating.gameId);
              return (
                <GlassCard key={rating.id}>
                  <Text style={styles.cardTitle}>{ratedAthlete?.fullName ?? 'Atleta'}</Text>
                  <Text style={styles.text}>{ratedGame?.title ?? 'Jogo'} • Nota {rating.score}/5</Text>
                  <Text style={styles.text}>{rating.comment || 'Sem comentario'}</Text>
                </GlassCard>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Header() {
  return (
    <FadeInView style={styles.header}>
      <Image source={require('../../assets/app-logo.jpeg')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>SOCIAL</Text>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: spacing.screenTop,
  },
  logo: { width: 76, height: 76 },
  title: { color: palette.textOnPrimary, fontSize: 28, fontWeight: '800' },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 10,
    paddingBottom: spacing.bottomSafeGap,
    gap: spacing.comfortableGap,
    width: '100%',
    maxWidth: spacing.contentMaxWidth,
    alignSelf: 'center',
  },
  actions: { flexDirection: 'row', gap: 8 },
  switchButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonActive: { backgroundColor: 'rgba(255,255,255,0.46)' },
  switchText: { color: palette.textOnPrimary, fontWeight: '700', fontSize: 12 },
  form: { gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  flex: { flex: 1 },
  cardTitle: { color: palette.textOnPrimary, fontSize: 18, fontWeight: '800' },
  text: { color: palette.textSoft, fontSize: 14, marginTop: 5 },
  meta: { color: palette.textSoft, fontSize: 11, marginTop: 10 },
  rankBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  rankText: { color: palette.textOnPrimary, fontSize: 16, fontWeight: '900' },
  score: { color: palette.textOnPrimary, fontSize: 22, fontWeight: '900' },
  mineCard: { backgroundColor: 'rgba(255,255,255,0.28)' },
  contactList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactPill: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  contactPillActive: {
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  contactAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.glassStrong,
  },
  contactInitial: {
    color: palette.textOnPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  contactName: {
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  contactNameActive: {
    color: '#17892d',
  },
});
