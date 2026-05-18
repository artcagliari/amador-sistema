import { Image, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlatList } from 'react-native';
import { suggestions } from '../data';
import { FadeInView } from '../components/FadeInView';
import { GlassCard } from '../components/Glass';
import { palette, spacing } from '../theme';

export function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.fixedSearchArea}>
        <FadeInView style={styles.searchShell}>
        <View style={styles.hero}>
          <Image
            source={require('../../assets/ChatGPT_Image_18_de_mai._de_2026__08_56_36-removebg-preview.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>BUSCA</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput style={styles.searchInput} placeholder="Buscar quadra" placeholderTextColor="#6f8577" />
          <Pressable style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}>
            <Text style={styles.searchButtonText}>Ir</Text>
          </Pressable>
        </View>
        <Text style={styles.filterText}>Filtrar</Text>
        </FadeInView>
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <GlassCard delay={70 + index * 70}>
            <ImageBackground source={{ uri: item.imageUrl }} style={styles.thumb} imageStyle={styles.thumbImage} />
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.itemSub}>{item.neighborhood}</Text>
          </GlassCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedSearchArea: {
    paddingTop: spacing.screenTop,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 10,
    backgroundColor: palette.primary,
    zIndex: 10,
  },
  searchShell: {
    width: '100%',
    maxWidth: spacing.contentMaxWidth,
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 78,
    height: 78,
  },
  title: {
    color: palette.textOnPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: palette.inputBackground,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.inputText,
    fontSize: 16,
  },
  searchButton: {
    width: 56,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchButtonPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  searchButtonText: {
    color: palette.textOnPrimary,
    fontWeight: '700',
  },
  filterText: {
    color: palette.textSoft,
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 8,
    paddingBottom: spacing.bottomSafeGap,
    gap: spacing.comfortableGap,
    width: '100%',
    maxWidth: spacing.contentMaxWidth,
    alignSelf: 'center',
  },
  thumb: {
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  thumbImage: {
    borderRadius: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    color: palette.textOnPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  rating: {
    color: palette.textOnPrimary,
    fontWeight: '800',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.glassStrong,
    overflow: 'hidden',
  },
  itemSub: {
    color: palette.textSoft,
    marginTop: 4,
    fontSize: 15,
  },
});
