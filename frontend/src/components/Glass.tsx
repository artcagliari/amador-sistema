import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, shadow } from '../theme';

export function GlassCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

type GlassButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
};

export function GlassButton({ label, onPress, disabled, variant = 'primary' }: GlassButtonProps) {
  return (
    <Pressable
      style={[styles.button, variant === 'danger' && styles.buttonDanger, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
  },
  button: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
  },
  buttonDanger: {
    backgroundColor: palette.danger,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: palette.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
