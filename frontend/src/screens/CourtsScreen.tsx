import { useEffect, useMemo, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../components/FadeInView';
import { Field, Feedback, SelectPills } from '../components/FormKit';
import { GlassButton, GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';
import { ApiClient, Court, CourtStatus, FeedbackType, PublicUser } from '../types';

type Props = {
  api: ApiClient;
  user: PublicUser;
};

type Mode = 'list' | 'map' | 'form' | 'detail';

const emptyCourt = {
  name: '',
  sportType: '',
  address: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  description: '',
  imageUrl: '',
  hourlyRate: '',
  availableHours: '',
  status: 'active' as CourtStatus,
  maxAthletes: '',
  rules: '',
  latitude: '',
  longitude: '',
};

const statusOptions = [
  { label: 'Ativa', value: 'active' as const },
  { label: 'Inativa', value: 'inactive' as const },
  { label: 'Manutencao', value: 'maintenance' as const },
];

const statusLabels: Record<CourtStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  maintenance: 'Manutencao',
};

export function CourtsScreen({ api, user }: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [form, setForm] = useState(emptyCourt);
  const [filters, setFilters] = useState({ name: '', city: '', sportType: '', status: '' });
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');
  const [loading, setLoading] = useState(false);

  const canManage = user.role === 'admin' && ['general', 'court'].includes(user.permissionLevel ?? 'limited');

  async function loadCourts() {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const result = await api.get<{ courts: Court[] }>(`/api/courts${params ? `?${params}` : ''}`);
      setCourts(result.courts);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel carregar as quadras.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourts();
  }, []);

  const mapCourts = useMemo(() => courts.filter((court) => court.latitude && court.longitude), [courts]);

  function editCourt(court: Court) {
    setSelectedCourt(court);
    setForm({
      name: court.name,
      sportType: court.sportType,
      address: court.address,
      neighborhood: court.neighborhood,
      city: court.city,
      state: court.state,
      zipCode: court.zipCode,
      description: court.description,
      imageUrl: court.imageUrl ?? '',
      hourlyRate: court.hourlyRate ? String(court.hourlyRate) : '',
      availableHours: court.availableHours,
      status: court.status,
      maxAthletes: String(court.maxAthletes),
      rules: court.rules,
      latitude: court.latitude ? String(court.latitude) : '',
      longitude: court.longitude ? String(court.longitude) : '',
    });
    setMode('form');
  }

  function validate() {
    const requiredFields = ['name', 'sportType', 'address', 'neighborhood', 'city', 'state', 'zipCode', 'description', 'availableHours', 'maxAthletes', 'rules'] as const;
    const missing = requiredFields.find((field) => !form[field].trim());
    if (missing) return 'Preencha todos os campos obrigatorios da quadra.';
    if (Number(form.maxAthletes) <= 0) return 'Informe uma capacidade maxima valida.';
    return '';
  }

  async function saveCourt() {
    const error = validate();
    if (error) {
      setFeedbackType('error');
      setFeedback(error);
      return;
    }

    const payload = {
      ...form,
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      maxAthletes: Number(form.maxAthletes),
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
    };

    try {
      const result = selectedCourt
        ? await api.put<{ message: string; court: Court }>(`/api/courts/${selectedCourt.id}`, payload)
        : await api.post<{ message: string; court: Court }>('/api/courts', payload);
      setFeedbackType('success');
      setFeedback(result.message);
      setSelectedCourt(result.court);
      setForm(emptyCourt);
      setMode('list');
      await loadCourts();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel salvar a quadra.');
    }
  }

  async function deleteCourt(court: Court) {
    try {
      const result = await api.delete<{ message: string }>(`/api/courts/${court.id}`);
      setFeedbackType('success');
      setFeedback(result.message);
      setSelectedCourt(null);
      setMode('list');
      await loadCourts();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel excluir a quadra.');
    }
  }

  function openCreate() {
    setSelectedCourt(null);
    setForm(emptyCourt);
    setMode('form');
  }

  return (
    <View style={styles.container}>
      <Header title="QUADRAS" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actions}>
          <Pressable style={[styles.switchButton, mode === 'list' && styles.switchButtonActive]} onPress={() => setMode('list')}>
            <Text style={styles.switchText}>Lista</Text>
          </Pressable>
          <Pressable style={[styles.switchButton, mode === 'map' && styles.switchButtonActive]} onPress={() => setMode('map')}>
            <Text style={styles.switchText}>Mapa</Text>
          </Pressable>
          {canManage && (
            <Pressable style={styles.switchButton} onPress={openCreate}>
              <Text style={styles.switchText}>Nova</Text>
            </Pressable>
          )}
        </View>

        <Feedback message={feedback} type={feedbackType} />

        {mode === 'list' && (
          <>
            <GlassCard>
              <View style={styles.form}>
                <Field label="Nome" value={filters.name} onChangeText={(name) => setFilters((prev) => ({ ...prev, name }))} />
                <Field label="Cidade" value={filters.city} onChangeText={(city) => setFilters((prev) => ({ ...prev, city }))} />
                <Field label="Esporte" value={filters.sportType} onChangeText={(sportType) => setFilters((prev) => ({ ...prev, sportType }))} />
                <SelectPills
                  label="Status"
                  value={(filters.status || 'all') as 'all' | CourtStatus}
                  options={[{ label: 'Todos', value: 'all' }, ...statusOptions]}
                  onChange={(status) => setFilters((prev) => ({ ...prev, status: status === 'all' ? '' : status }))}
                />
                <GlassButton label={loading ? 'CARREGANDO...' : 'APLICAR FILTROS'} onPress={loadCourts} disabled={loading} />
              </View>
            </GlassCard>

            {courts.map((court, index) => (
              <GlassCard key={court.id} delay={60 + index * 40}>
                {court.imageUrl ? <Image source={{ uri: court.imageUrl }} style={styles.image} /> : null}
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{court.name}</Text>
                  <Text style={styles.badge}>{statusLabels[court.status]}</Text>
                </View>
                <Text style={styles.text}>{court.sportType} • {court.city}</Text>
                <Text style={styles.text}>{court.address}, {court.neighborhood}</Text>
                <View style={styles.buttonRow}>
                  <GlassButton label="DETALHES" onPress={() => { setSelectedCourt(court); setMode('detail'); }} />
                  {canManage && <GlassButton label="EDITAR" onPress={() => editCourt(court)} />}
                </View>
              </GlassCard>
            ))}
          </>
        )}

        {mode === 'map' && (
          <GlassCard>
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: mapCourts[0]?.latitude ?? -22.9519,
                  longitude: mapCourts[0]?.longitude ?? -43.2105,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
              >
                {mapCourts.map((court) => (
                  <Marker
                    key={court.id}
                    coordinate={{ latitude: court.latitude ?? 0, longitude: court.longitude ?? 0 }}
                    title={court.name}
                    description={`${court.sportType} • ${statusLabels[court.status]}`}
                    onCalloutPress={() => { setSelectedCourt(court); setMode('detail'); }}
                  />
                ))}
              </MapView>
            </View>
            <Text style={styles.text}>Toque em um marcador para ver nome, endereco, esporte, status e detalhes.</Text>
          </GlassCard>
        )}

        {mode === 'form' && canManage && (
          <GlassCard>
            <View style={styles.form}>
              <Text style={styles.cardTitle}>{selectedCourt ? 'Editar quadra' : 'Cadastrar quadra'}</Text>
              <Field label="Nome da quadra" value={form.name} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} />
              <Field label="Tipo de esporte" value={form.sportType} onChangeText={(sportType) => setForm((prev) => ({ ...prev, sportType }))} />
              <Field label="Endereco completo" value={form.address} onChangeText={(address) => setForm((prev) => ({ ...prev, address }))} />
              <View style={styles.grid}>
                <Field label="Bairro" value={form.neighborhood} onChangeText={(neighborhood) => setForm((prev) => ({ ...prev, neighborhood }))} />
                <Field label="Cidade" value={form.city} onChangeText={(city) => setForm((prev) => ({ ...prev, city }))} />
              </View>
              <View style={styles.grid}>
                <Field label="Estado" value={form.state} onChangeText={(state) => setForm((prev) => ({ ...prev, state }))} />
                <Field label="CEP" value={form.zipCode} onChangeText={(zipCode) => setForm((prev) => ({ ...prev, zipCode }))} />
              </View>
              <Field label="Descricao" value={form.description} multiline onChangeText={(description) => setForm((prev) => ({ ...prev, description }))} />
              <Field label="Imagem da quadra" value={form.imageUrl} onChangeText={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))} />
              <View style={styles.grid}>
                <Field label="Valor por hora" value={form.hourlyRate} keyboardType="numeric" onChangeText={(hourlyRate) => setForm((prev) => ({ ...prev, hourlyRate }))} />
                <Field label="Capacidade" value={form.maxAthletes} keyboardType="numeric" onChangeText={(maxAthletes) => setForm((prev) => ({ ...prev, maxAthletes }))} />
              </View>
              <Field label="Horarios disponiveis" value={form.availableHours} onChangeText={(availableHours) => setForm((prev) => ({ ...prev, availableHours }))} />
              <SelectPills label="Status" value={form.status} options={statusOptions} onChange={(status) => setForm((prev) => ({ ...prev, status }))} />
              <Field label="Regras de uso" value={form.rules} multiline onChangeText={(rules) => setForm((prev) => ({ ...prev, rules }))} />
              <View style={styles.grid}>
                <Field label="Latitude" value={form.latitude} keyboardType="numeric" onChangeText={(latitude) => setForm((prev) => ({ ...prev, latitude }))} />
                <Field label="Longitude" value={form.longitude} keyboardType="numeric" onChangeText={(longitude) => setForm((prev) => ({ ...prev, longitude }))} />
              </View>
              <Text style={styles.note}>Sem coordenadas, a quadra fica pronta para geocodificacao futura pelo endereco.</Text>
              <GlassButton label="SALVAR QUADRA" onPress={saveCourt} />
              <GlassButton label="CANCELAR" onPress={() => setMode('list')} />
            </View>
          </GlassCard>
        )}

        {mode === 'detail' && selectedCourt && (
          <GlassCard>
            {selectedCourt.imageUrl ? <Image source={{ uri: selectedCourt.imageUrl }} style={styles.image} /> : null}
            <Text style={styles.cardTitle}>{selectedCourt.name}</Text>
            <Text style={styles.text}>{selectedCourt.sportType} • {statusLabels[selectedCourt.status]}</Text>
            <Text style={styles.text}>{selectedCourt.address}, {selectedCourt.neighborhood}</Text>
            <Text style={styles.text}>{selectedCourt.city}/{selectedCourt.state} • CEP {selectedCourt.zipCode}</Text>
            <Text style={styles.text}>{selectedCourt.description}</Text>
            <Text style={styles.text}>Horarios: {selectedCourt.availableHours}</Text>
            <Text style={styles.text}>Capacidade: {selectedCourt.maxAthletes} atletas</Text>
            <Text style={styles.text}>Valor/hora: {selectedCourt.hourlyRate ? `R$ ${selectedCourt.hourlyRate}` : 'Nao informado'}</Text>
            <Text style={styles.text}>Regras: {selectedCourt.rules}</Text>
            <View style={styles.buttonRow}>
              {canManage && <GlassButton label="EDITAR" onPress={() => editCourt(selectedCourt)} />}
              {canManage && <GlassButton label="EXCLUIR" variant="danger" onPress={() => deleteCourt(selectedCourt)} />}
            </View>
            <GlassButton label="VOLTAR" onPress={() => setMode('list')} />
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

function Header({ title }: { title: string }) {
  return (
    <FadeInView style={styles.header}>
      <Image source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
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
  switchButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.46)',
  },
  switchText: {
    color: palette.textOnPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  form: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    color: palette.textOnPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  text: {
    color: palette.textSoft,
    fontSize: 14,
    marginTop: 5,
  },
  note: {
    color: palette.textSoft,
    fontSize: 12,
  },
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
  image: {
    height: 148,
    borderRadius: 16,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  mapWrap: {
    height: 360,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
