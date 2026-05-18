import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, shadow } from '../theme';
import { AppTab } from '../types';

const labels: Record<AppTab, string> = {
  home: 'Inicio',
  search: 'Buscar',
  notifications: 'Avisos',
  profile: 'Perfil',
};

const icons: Record<AppTab, string> = {
  home: 'H',
  search: 'B',
  notifications: 'N',
  profile: 'P',
};

type Props = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

export function BottomTabBar({ activeTab, onChange }: Props) {
  return (
    <BlurView intensity={30} tint="light" style={styles.tabBar}>
      {(Object.keys(labels) as AppTab[]).map((tab) => {
        const active = activeTab === tab;
        return (
          <Pressable
            key={tab}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => onChange(tab)}
          >
            <View style={[styles.iconBubble, active && styles.iconBubbleActive]}>
              <Text style={[styles.iconText, active && styles.iconTextActive]}>{icons[tab]}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{labels[tab]}</Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    height: 78,
    borderRadius: 26,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow,
  },
  item: {
    width: 68,
    alignItems: 'center',
    gap: 3,
  },
  itemPressed: {
    opacity: 0.78,
    transform: [{ translateY: 1 }],
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconBubbleActive: {
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  iconText: {
    color: palette.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  iconTextActive: {
    color: '#17892d',
  },
  label: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 10,
    fontWeight: '600',
  },
  labelActive: {
    color: palette.textOnPrimary,
  },
});
