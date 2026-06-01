import { PropsWithChildren } from 'react';
import { BlurView } from 'expo-blur';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { palette, shadow } from '../theme';
import { FadeInView } from './FadeInView';

type GlassCardProps = PropsWithChildren<{
  delay?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function GlassCard({ children, delay = 0, style }: GlassCardProps) {
  return (
    <FadeInView delay={delay}>
      <BlurView intensity={26} tint="light" style={[styles.card, style]}>
        {children}
      </BlurView>
    </FadeInView>
  );
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
      style={({ pressed }) => [
        styles.button,
        variant === 'danger' && styles.buttonDanger,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 24,
    padding: 16,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
  },
  button: {
    height: 56,
    minWidth: 108,
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }, { scale: 0.99 }],
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
