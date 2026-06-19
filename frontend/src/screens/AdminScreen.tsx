import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../components/FadeInView';
import { Field, Feedback, SelectPills } from '../components/FormKit';
import { GlassButton, GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';
import { AdminPermission, AdminUser, ApiClient, Athlete, AthleteLevel, EntityStatus, FeedbackType, PublicUser } from '../types';

type Props = {
  api: ApiClient;
  user: PublicUser;
};

type Section = 'athletes' | 'admins';

const athleteEmpty = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  cpf: '',
  city: '',
  position: '',
  level: 'beginner' as AthleteLevel,
  profilePhotoUrl: '',
  status: 'active' as EntityStatus,
  gameHistory: '',
};

const adminEmpty = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  permissionLevel: 'limited' as AdminPermission,
  status: 'active' as EntityStatus,
};

const levelOptions = [
  { label: 'Iniciante', value: 'beginner' as const },
  { label: 'Intermediario', value: 'intermediate' as const },
  { label: 'Avancado', value: 'advanced' as const },
];

const permissionOptions = [
  { label: 'Geral', value: 'general' as const },
  { label: 'Quadra', value: 'court' as const },
  { label: 'Financeiro', value: 'financial' as const },
  { label: 'Comum', value: 'limited' as const },
];

const statusOptions = [
  { label: 'Ativo', value: 'active' as const },
  { label: 'Inativo', value: 'inactive' as const },
];

const permissionLabels: Record<AdminPermission, string> = {
  general: 'Administrador geral',
  court: 'Administrador de quadra',
  financial: 'Administrador financeiro',
  limited: 'Administrador comum',
};

export function AdminScreen({ api, user }: Props) {
  const [section, setSection] = useState<Section>('athletes');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [athleteForm, setAthleteForm] = useState(athleteEmpty);
  const [adminForm, setAdminForm] = useState(adminEmpty);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [showAthleteForm, setShowAthleteForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [filters, setFilters] = useState({ name: '', city: '', status: '' });
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('');

  const canSeeAdmin = user.role === 'admin';
  const canManageAdmins = user.role === 'admin' && user.permissionLevel === 'general';

  async function loadAthletes() {
    const params = new URLSearchParams(filters).toString();
    const result = await api.get<{ athletes: Athlete[] }>(`/api/athletes${params ? `?${params}` : ''}`);
    setAthletes(result.athletes);
  }

  async function loadAdmins() {
    if (!canManageAdmins) return;
    const result = await api.get<{ admins: AdminUser[] }>('/api/admins');
    setAdmins(result.admins);
  }

  async function loadAll() {
    try {
      await loadAthletes();
      await loadAdmins();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel carregar os cadastros.');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (!canSeeAdmin) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Header />
        <GlassCard>
          <Text style={styles.cardTitle}>Area administrativa</Text>
          <Text style={styles.text}>Seu perfil de atleta pode editar dados basicos no Perfil e participar dos jogos disponiveis.</Text>
        </GlassCard>
      </ScrollView>
    );
  }

  function validateAthlete() {
    if (!athleteForm.fullName || !athleteForm.email || !athleteForm.phone || !athleteForm.birthDate || !athleteForm.city) {
      return 'Preencha os campos obrigatorios do atleta.';
    }
    return '';
  }

  async function saveAthlete() {
    const error = validateAthlete();
    if (error) {
      setFeedbackType('error');
      setFeedback(error);
      return;
    }

    const payload = {
      ...athleteForm,
      gameHistory: athleteForm.gameHistory,
    };

    try {
      const result = editingAthlete
        ? await api.put<{ message: string; athlete: Athlete }>(`/api/athletes/${editingAthlete.id}`, payload)
        : await api.post<{ message: string; athlete: Athlete }>('/api/athletes', payload);
      setFeedbackType('success');
      setFeedback(result.message);
      setAthleteForm(athleteEmpty);
      setEditingAthlete(null);
      setShowAthleteForm(false);
      await loadAthletes();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel salvar o atleta.');
    }
  }

  function editAthlete(athlete: Athlete) {
    setEditingAthlete(athlete);
    setAthleteForm({
      fullName: athlete.fullName,
      email: athlete.email,
      phone: athlete.phone,
      birthDate: athlete.birthDate,
      cpf: athlete.cpf ?? '',
      city: athlete.city,
      position: athlete.position ?? '',
      level: athlete.level,
      profilePhotoUrl: athlete.profilePhotoUrl ?? '',
      status: athlete.status,
      gameHistory: athlete.gameHistory.join(', '),
    });
    setShowAthleteForm(true);
  }

  async function deactivateAthlete(athlete: Athlete) {
    try {
      const result = await api.put<{ message: string; athlete: Athlete }>(`/api/athletes/${athlete.id}`, { status: 'inactive' });
      setFeedbackType('success');
      setFeedback(result.message);
      await loadAthletes();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel desativar o atleta.');
    }
  }

  function validateAdmin() {
    if (!adminForm.fullName || !adminForm.email || !adminForm.phone || (!editingAdmin && !adminForm.password)) {
      return 'Preencha os campos obrigatorios do administrador.';
    }
    return '';
  }

  async function saveAdmin() {
    const error = validateAdmin();
    if (error) {
      setFeedbackType('error');
      setFeedback(error);
      return;
    }

    try {
      const result = editingAdmin
        ? await api.put<{ message: string; admin: AdminUser }>(`/api/admins/${editingAdmin.id}`, adminForm)
        : await api.post<{ message: string; admin: AdminUser }>('/api/admins', adminForm);
      setFeedbackType('success');
      setFeedback(result.message);
      setAdminForm(adminEmpty);
      setEditingAdmin(null);
      setShowAdminForm(false);
      await loadAdmins();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel salvar o administrador.');
    }
  }

  function editAdmin(admin: AdminUser) {
    setEditingAdmin(admin);
    setAdminForm({
      fullName: admin.fullName,
      email: admin.email,
      phone: admin.phone,
      password: '',
      permissionLevel: admin.permissionLevel,
      status: admin.status,
    });
    setShowAdminForm(true);
  }

  async function deactivateAdmin(admin: AdminUser) {
    try {
      const result = await api.delete<{ message: string }>(`/api/admins/${admin.id}`);
      setFeedbackType('success');
      setFeedback(result.message);
      await loadAdmins();
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel desativar o administrador.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header />
      <View style={styles.actions}>
        <Pressable style={[styles.switchButton, section === 'athletes' && styles.switchButtonActive]} onPress={() => setSection('athletes')}>
          <Text style={styles.switchText}>Atletas</Text>
        </Pressable>
        <Pressable style={[styles.switchButton, section === 'admins' && styles.switchButtonActive]} onPress={() => setSection('admins')}>
          <Text style={styles.switchText}>Admins</Text>
        </Pressable>
      </View>

      <Feedback message={feedback} type={feedbackType} />

      {section === 'athletes' && (
        <>
          <GlassCard>
            <View style={styles.form}>
              <Field label="Buscar por nome" value={filters.name} onChangeText={(name) => setFilters((prev) => ({ ...prev, name }))} />
              <Field label="Cidade" value={filters.city} onChangeText={(city) => setFilters((prev) => ({ ...prev, city }))} />
              <SelectPills
                label="Status"
                value={(filters.status || 'all') as 'all' | EntityStatus}
                options={[{ label: 'Todos', value: 'all' }, ...statusOptions]}
                onChange={(status) => setFilters((prev) => ({ ...prev, status: status === 'all' ? '' : status }))}
              />
              <View style={styles.buttonRow}>
                <GlassButton label="FILTRAR" onPress={loadAthletes} />
                <GlassButton label="NOVO" onPress={() => { setEditingAthlete(null); setAthleteForm(athleteEmpty); setShowAthleteForm(true); }} />
              </View>
            </View>
          </GlassCard>

          {showAthleteForm && (
            <GlassCard>
              <View style={styles.form}>
                <Text style={styles.cardTitle}>{editingAthlete ? 'Editar atleta' : 'Cadastrar atleta'}</Text>
                <Field label="Nome completo" value={athleteForm.fullName} onChangeText={(fullName) => setAthleteForm((prev) => ({ ...prev, fullName }))} />
                <Field label="E-mail" value={athleteForm.email} keyboardType="email-address" onChangeText={(email) => setAthleteForm((prev) => ({ ...prev, email }))} />
                <Field label="Telefone" value={athleteForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setAthleteForm((prev) => ({ ...prev, phone }))} />
                <View style={styles.grid}>
                  <Field label="Nascimento" value={athleteForm.birthDate} placeholder="AAAA-MM-DD" onChangeText={(birthDate) => setAthleteForm((prev) => ({ ...prev, birthDate }))} />
                  <Field label="CPF" value={athleteForm.cpf} onChangeText={(cpf) => setAthleteForm((prev) => ({ ...prev, cpf }))} />
                </View>
                <View style={styles.grid}>
                  <Field label="Cidade" value={athleteForm.city} onChangeText={(city) => setAthleteForm((prev) => ({ ...prev, city }))} />
                  <Field label="Posicao" value={athleteForm.position} onChangeText={(position) => setAthleteForm((prev) => ({ ...prev, position }))} />
                </View>
                <Field label="Foto de perfil" value={athleteForm.profilePhotoUrl} onChangeText={(profilePhotoUrl) => setAthleteForm((prev) => ({ ...prev, profilePhotoUrl }))} />
                <Field label="Historico de jogos" value={athleteForm.gameHistory} onChangeText={(gameHistory) => setAthleteForm((prev) => ({ ...prev, gameHistory }))} />
                <SelectPills label="Nivel" value={athleteForm.level} options={levelOptions} onChange={(level) => setAthleteForm((prev) => ({ ...prev, level }))} />
                <SelectPills label="Status" value={athleteForm.status} options={statusOptions} onChange={(status) => setAthleteForm((prev) => ({ ...prev, status }))} />
                <GlassButton label="SALVAR ATLETA" onPress={saveAthlete} />
                <GlassButton label="CANCELAR" onPress={() => setShowAthleteForm(false)} />
              </View>
            </GlassCard>
          )}

          {athletes.map((athlete, index) => (
            <GlassCard key={athlete.id} delay={60 + index * 35}>
              <Text style={styles.cardTitle}>{athlete.fullName}</Text>
              <Text style={styles.text}>{athlete.email} • {athlete.phone}</Text>
              <Text style={styles.text}>{athlete.city || 'Cidade nao informada'} • {athlete.level}</Text>
              <Text style={styles.text}>Status: {athlete.status === 'active' ? 'ativo' : 'inativo'}</Text>
              <View style={styles.buttonRow}>
                <GlassButton label="EDITAR" onPress={() => editAthlete(athlete)} />
                <GlassButton label="DESATIVAR" variant="danger" onPress={() => deactivateAthlete(athlete)} />
              </View>
            </GlassCard>
          ))}
        </>
      )}

      {section === 'admins' && (
        <>
          {!canManageAdmins && (
            <GlassCard>
              <Text style={styles.cardTitle}>Permissao limitada</Text>
              <Text style={styles.text}>Apenas administradores gerais podem cadastrar, editar ou excluir administradores.</Text>
            </GlassCard>
          )}

          {canManageAdmins && (
            <>
              <GlassButton label="NOVO ADMINISTRADOR" onPress={() => { setEditingAdmin(null); setAdminForm(adminEmpty); setShowAdminForm(true); }} />
              {showAdminForm && (
                <GlassCard>
                  <View style={styles.form}>
                    <Text style={styles.cardTitle}>{editingAdmin ? 'Editar administrador' : 'Cadastrar administrador'}</Text>
                    <Field label="Nome completo" value={adminForm.fullName} onChangeText={(fullName) => setAdminForm((prev) => ({ ...prev, fullName }))} />
                    <Field label="E-mail" value={adminForm.email} keyboardType="email-address" onChangeText={(email) => setAdminForm((prev) => ({ ...prev, email }))} />
                    <Field label="Telefone" value={adminForm.phone} keyboardType="phone-pad" onChangeText={(phone) => setAdminForm((prev) => ({ ...prev, phone }))} />
                    <Field label="Senha" value={adminForm.password} secureTextEntry onChangeText={(password) => setAdminForm((prev) => ({ ...prev, password }))} />
                    <SelectPills label="Permissao" value={adminForm.permissionLevel} options={permissionOptions} onChange={(permissionLevel) => setAdminForm((prev) => ({ ...prev, permissionLevel }))} />
                    <SelectPills label="Status" value={adminForm.status} options={statusOptions} onChange={(status) => setAdminForm((prev) => ({ ...prev, status }))} />
                    <GlassButton label="SALVAR ADMINISTRADOR" onPress={saveAdmin} />
                    <GlassButton label="CANCELAR" onPress={() => setShowAdminForm(false)} />
                  </View>
                </GlassCard>
              )}

              {admins.map((admin, index) => (
                <GlassCard key={admin.id} delay={60 + index * 35}>
                  <Text style={styles.cardTitle}>{admin.fullName}</Text>
                  <Text style={styles.text}>{admin.email} • {admin.phone}</Text>
                  <Text style={styles.text}>{permissionLabels[admin.permissionLevel]}</Text>
                  <Text style={styles.text}>Status: {admin.status === 'active' ? 'ativo' : 'inativo'}</Text>
                  <View style={styles.buttonRow}>
                    <GlassButton label="EDITAR" onPress={() => editAdmin(admin)} />
                    <GlassButton label="DESATIVAR" variant="danger" onPress={() => deactivateAdmin(admin)} />
                  </View>
                </GlassCard>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Header() {
  return (
    <FadeInView style={styles.header}>
      <Image source={require('../../assets/app-logo.jpeg')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>ADMIN</Text>
    </FadeInView>
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
  header: { alignItems: 'center' },
  logo: { width: 76, height: 76 },
  title: { color: palette.textOnPrimary, fontSize: 28, fontWeight: '800' },
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
  cardTitle: { color: palette.textOnPrimary, fontSize: 20, fontWeight: '800' },
  text: { color: palette.textSoft, fontSize: 14, marginTop: 5 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
