import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../components/FadeInView';
import { Field, Feedback, SelectPills } from '../components/FormKit';
import { GlassButton, GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';
import { ApiClient, Court, FeedbackType, Game, GameStatus, PublicUser } from '../types';

type Props = {
  api: ApiClient;
  user: PublicUser;
};

type Mode = 'list' | 'form' | 'detail';

const emptyGame = {
  title: '',
  courtId: '',
  date: '',
  startTime: '',
  endTime: '',
  sportType: '',
  maxParticipants: '',
  status: 'open' as GameStatus,
  description: '',
  rules: '',
  participantRate: '',
};

const statusOptions = [
  { label: 'Aberto', value: 'open' as const },
  { label: 'Fechado', value: 'closed' as const },
  { label: 'Em andamento', value: 'in_progress' as const },
  { label: 'Finalizado', value: 'finished' as const },
  { label: 'Cancelado', value: 'cancelled' as const },
];

const statusLabels: Record<GameStatus, string> = {
  open: 'Aberto',
  closed: 'Fechado',
  in_progress: 'Em andamento',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

export function GamesScreen({ api, user }: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const [games, setGames] = useState<Game[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [form, setForm] = useState(emptyGame);
  const [filters, setFilters] = useState({ sportType: '', status: '' });
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');
  const [loading, setLoading] = useState(false);

  const canManage = user.role === 'admin' && ['general', 'court'].includes(user.permissionLevel ?? 'limited');

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const [gameResult, courtResult] = await Promise.all([
        api.get<{ games: Game[] }>(`/api/games${params ? `?${params}` : ''}`),
        api.get<{ courts: Court[] }>('/api/courts'),
      ]);
      setGames(gameResult.games);
      setCourts(courtResult.courts);
      if (!form.courtId && courtResult.courts[0]) {
        setForm((prev) => ({ ...prev, courtId: courtResult.courts[0].id, sportType: courtResult.courts[0].sportType }));
      }
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel carregar os jogos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function startCreate() {
    const firstCourt = courts[0];
    setSelectedGame(null);
    setForm({ ...emptyGame, courtId: firstCourt?.id ?? '', sportType: firstCourt?.sportType ?? '' });
    setMode('form');
  }

  function editGame(game: Game) {
    setSelectedGame(game);
    setForm({
      title: game.title,
      courtId: game.courtId,
      date: game.date,
      startTime: game.startTime,
      endTime: game.endTime,
      sportType: game.sportType,
      maxParticipants: String(game.maxParticipants),
      status: game.status,
      description: game.description ?? '',
      rules: game.rules ?? '',
      participantRate: game.participantRate ? String(game.participantRate) : '',
    });
    setMode('form');
  }

  function validate() {
    if (!form.title || !form.courtId || !form.date || !form.startTime || !form.endTime || !form.sportType || !form.maxParticipants) {
      return 'Preencha todos os campos obrigatorios do jogo.';
    }
    if (Number(form.maxParticipants) <= 0) return 'Informe um limite valido de participantes.';
    if (form.startTime >= form.endTime) return 'Horario final deve ser maior que o inicial.';
    return '';
  }

  async function saveGame() {
    const error = validate();
    if (error) {
      setFeedbackType('error');
      setFeedback(error);
      return;
    }

    const payload = {
      ...form,
      maxParticipants: Number(form.maxParticipants),
      participantRate: form.participantRate ? Number(form.participantRate) : undefined,
    };

    try {
      const result = selectedGame
        ? await api.put<{ message: string; game: Game }>(`/api/games/${selectedGame.id}`, payload)
        : await api.post<{ message: string; game: Game }>('/api/games', payload);
      setFeedbackType('success');
      setFeedback(result.message);
      setSelectedGame(result.game);
      setMode('list');
      await loadData();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel salvar o jogo.');
    }
  }

  async function joinGame(game: Game) {
    try {
      const result = await api.post<{ message: string; game: Game }>(`/api/games/${game.id}/join`, {});
      setFeedbackType('success');
      setFeedback(result.message);
      setSelectedGame(result.game);
      await loadData();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel participar do jogo.');
    }
  }

  async function cancelGame(game: Game) {
    try {
      const result = await api.post<{ message: string; game: Game }>(`/api/games/${game.id}/cancel`, {});
      setFeedbackType('success');
      setFeedback(result.message);
      setSelectedGame(result.game);
      await loadData();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel cancelar o jogo.');
    }
  }

  async function removeAthlete(gameId: string, athleteId: string) {
    try {
      const result = await api.delete<{ message: string; game: Game }>(`/api/games/${gameId}/athletes/${athleteId}`);
      setFeedbackType('success');
      setFeedback(result.message);
      setSelectedGame(result.game);
      await loadData();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel remover o atleta.');
    }
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actions}>
          <Pressable style={[styles.switchButton, mode === 'list' && styles.switchButtonActive]} onPress={() => setMode('list')}>
            <Text style={styles.switchText}>Lista</Text>
          </Pressable>
          {canManage && (
            <Pressable style={styles.switchButton} onPress={startCreate}>
              <Text style={styles.switchText}>Novo jogo</Text>
            </Pressable>
          )}
        </View>

        <Feedback message={feedback} type={feedbackType} />

        {mode === 'list' && (
          <>
            <GlassCard>
              <View style={styles.form}>
                <Field label="Esporte" value={filters.sportType} onChangeText={(sportType) => setFilters((prev) => ({ ...prev, sportType }))} />
                <SelectPills
                  label="Status"
                  value={(filters.status || 'all') as 'all' | GameStatus}
                  options={[{ label: 'Todos', value: 'all' }, ...statusOptions]}
                  onChange={(status) => setFilters((prev) => ({ ...prev, status: status === 'all' ? '' : status }))}
                />
                <GlassButton label={loading ? 'CARREGANDO...' : 'APLICAR FILTROS'} onPress={loadData} disabled={loading} />
              </View>
            </GlassCard>

            {games.map((game, index) => (
              <GlassCard key={game.id} delay={60 + index * 40}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.badge}>{statusLabels[game.status]}</Text>
                </View>
                <Text style={styles.text}>{game.court?.name ?? 'Quadra'} • {game.sportType}</Text>
                <Text style={styles.text}>{game.date} das {game.startTime} as {game.endTime}</Text>
                <Text style={styles.text}>{game.confirmedAthleteIds.length}/{game.maxParticipants} atletas confirmados</Text>
                <View style={styles.buttonRow}>
                  <GlassButton label="DETALHES" onPress={() => { setSelectedGame(game); setMode('detail'); }} />
                  {game.status === 'open' && <GlassButton label="PARTICIPAR" onPress={() => joinGame(game)} />}
                </View>
              </GlassCard>
            ))}
          </>
        )}

        {mode === 'form' && canManage && (
          <GlassCard>
            <View style={styles.form}>
              <Text style={styles.cardTitle}>{selectedGame ? 'Editar jogo' : 'Criar jogo'}</Text>
              <Field label="Titulo do jogo" value={form.title} onChangeText={(title) => setForm((prev) => ({ ...prev, title }))} />
              <SelectPills
                label="Quadra"
                value={form.courtId}
                options={courts.map((court) => ({ label: court.name, value: court.id }))}
                onChange={(courtId) => {
                  const court = courts.find((entry) => entry.id === courtId);
                  setForm((prev) => ({ ...prev, courtId, sportType: court?.sportType ?? prev.sportType }));
                }}
              />
              <View style={styles.grid}>
                <Field label="Data" value={form.date} placeholder="AAAA-MM-DD" onChangeText={(date) => setForm((prev) => ({ ...prev, date }))} />
                <Field label="Inicio" value={form.startTime} placeholder="19:00" onChangeText={(startTime) => setForm((prev) => ({ ...prev, startTime }))} />
              </View>
              <View style={styles.grid}>
                <Field label="Termino" value={form.endTime} placeholder="20:00" onChangeText={(endTime) => setForm((prev) => ({ ...prev, endTime }))} />
                <Field label="Maximo" value={form.maxParticipants} keyboardType="numeric" onChangeText={(maxParticipants) => setForm((prev) => ({ ...prev, maxParticipants }))} />
              </View>
              <Field label="Tipo de esporte" value={form.sportType} onChangeText={(sportType) => setForm((prev) => ({ ...prev, sportType }))} />
              <SelectPills label="Status" value={form.status} options={statusOptions} onChange={(status) => setForm((prev) => ({ ...prev, status }))} />
              <Field label="Observacoes" value={form.description} multiline onChangeText={(description) => setForm((prev) => ({ ...prev, description }))} />
              <Field label="Regras especificas" value={form.rules} multiline onChangeText={(rules) => setForm((prev) => ({ ...prev, rules }))} />
              <Field label="Valor por participante" value={form.participantRate} keyboardType="numeric" onChangeText={(participantRate) => setForm((prev) => ({ ...prev, participantRate }))} />
              <GlassButton label="SALVAR JOGO" onPress={saveGame} />
              <GlassButton label="CANCELAR" onPress={() => setMode('list')} />
            </View>
          </GlassCard>
        )}

        {mode === 'detail' && selectedGame && (
          <GlassCard>
            <Text style={styles.cardTitle}>{selectedGame.title}</Text>
            <Text style={styles.text}>{selectedGame.court?.name ?? 'Quadra'} • {statusLabels[selectedGame.status]}</Text>
            <Text style={styles.text}>{selectedGame.date} das {selectedGame.startTime} as {selectedGame.endTime}</Text>
            <Text style={styles.text}>Esporte: {selectedGame.sportType}</Text>
            <Text style={styles.text}>Vagas: {selectedGame.confirmedAthleteIds.length}/{selectedGame.maxParticipants}</Text>
            <Text style={styles.text}>Valor: {selectedGame.participantRate ? `R$ ${selectedGame.participantRate}` : 'Nao informado'}</Text>
            <Text style={styles.text}>Observacoes: {selectedGame.description || 'Sem observacoes'}</Text>
            <Text style={styles.text}>Regras: {selectedGame.rules || 'Sem regras especificas'}</Text>
            <Text style={styles.section}>Atletas confirmados</Text>
            {(selectedGame.confirmedAthletes ?? []).map((athlete) => (
              <View key={athlete.id} style={styles.athleteRow}>
                <Text style={styles.text}>{athlete.fullName}</Text>
                {canManage && <Pressable onPress={() => removeAthlete(selectedGame.id, athlete.id)}><Text style={styles.remove}>Remover</Text></Pressable>}
              </View>
            ))}
            <View style={styles.buttonRow}>
              {selectedGame.status === 'open' && <GlassButton label="PARTICIPAR" onPress={() => joinGame(selectedGame)} />}
              {canManage && <GlassButton label="EDITAR" onPress={() => editGame(selectedGame)} />}
            </View>
            {canManage && selectedGame.status !== 'cancelled' && <GlassButton label="CANCELAR JOGO" variant="danger" onPress={() => cancelGame(selectedGame)} />}
            <GlassButton label="VOLTAR" onPress={() => setMode('list')} />
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

function Header() {
  return (
    <FadeInView style={styles.header}>
      <Image source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>JOGOS</Text>
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
  title: {
    color: palette.textOnPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
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
  grid: { flexDirection: 'row', gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { color: palette.textOnPrimary, fontSize: 20, fontWeight: '800' },
  text: { color: palette.textSoft, fontSize: 14, marginTop: 5 },
  section: { color: palette.textOnPrimary, fontSize: 16, fontWeight: '800', marginTop: 14 },
  badge: {
    color: palette.textOnPrimary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.glassStrong,
    overflow: 'hidden',
  },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  athleteRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  remove: { color: palette.textOnPrimary, fontWeight: '800', fontSize: 12 },
});
