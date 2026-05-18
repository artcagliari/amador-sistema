import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTab } from '../types';
import { palette } from '../theme';

const labels: Record<AppTab, string> = {
  home: 'Inicio',
  search: 'Busca',
  notifications: 'Notificacoes',
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
    <View style={styles.tabBar}>
      {(Object.keys(labels) as AppTab[]).map((tab) => {
        const active = activeTab === tab;
        return (
          <Pressable key={tab} style={styles.item} onPress={() => onChange(tab)}>
            <View style={[styles.iconBubble, active && styles.iconBubbleActive]}>
              <Text style={[styles.iconText, active && styles.iconTextActive]}>{icons[tab]}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{labels[tab]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    height: 84,
    borderRadius: 24,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: {
    width: 74,
    alignItems: 'center',
    gap: 4,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconBubbleActive: {
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  iconText: {
    color: palette.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  iconTextActive: {
    color: '#17892d',
  },
  label: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: palette.textOnPrimary,
  },
});
