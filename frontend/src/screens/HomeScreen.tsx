import MapView, { Marker } from 'react-native-maps';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nearbySlots } from '../data';
import { GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';

export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>QUADRAS PROXIMAS A VOCE</Text>
      </View>

      <View style={styles.mapWrap}>
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
      </View>

      <Text style={styles.section}>Horarios para voce</Text>
      {nearbySlots.map((slot) => (
        <GlassCard key={slot.id}>
          <Text style={styles.cardTitle}>{slot.title}</Text>
          <Text style={styles.cardText}>Local: {slot.place}</Text>
          <Text style={styles.cardText}>Posicoes disponiveis: {slot.available}</Text>
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
    gap: 8,
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
  mapWrap: {
    height: 230,
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
  cardText: {
    color: palette.textSoft,
    fontSize: 15,
    marginTop: 4,
  },
});
