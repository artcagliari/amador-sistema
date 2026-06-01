import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette } from '../theme';

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  onChangeText: (value: string) => void;
};

export function Field({ label, value, placeholder, multiline, keyboardType = 'default', secureTextEntry, onChangeText }: FieldProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        placeholder={placeholder ?? label}
        placeholderTextColor="#6b8373"
        value={value}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : undefined}
        onChangeText={onChangeText}
      />
    </View>
  );
}

type Option<T extends string> = {
  label: string;
  value: T;
};

type SelectProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function SelectPills<T extends string>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pills}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable key={option.value} style={[styles.pill, active && styles.pillActive]} onPress={() => onChange(option.value)}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Feedback({ message, type }: { message: string; type: 'success' | 'error' | '' }) {
  if (!message) return null;
  return <Text style={[styles.feedback, type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>{message}</Text>;
}

const styles = StyleSheet.create({
  block: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.inputBackground,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.inputText,
    fontSize: 15,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillActive: {
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  pillText: {
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#17892d',
  },
  feedback: {
    minHeight: 36,
    borderRadius: 12,
    color: palette.textOnPrimary,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  feedbackError: {
    backgroundColor: 'rgba(216,34,34,0.34)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(15,140,55,0.34)',
  },
});
