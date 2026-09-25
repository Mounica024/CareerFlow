import { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label: string;
  error?: string | null;
  accessibleLabel: string;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  accessibleLabel,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <Lock size={18} color="#94a3b8" style={styles.leftIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          accessible
          accessibilityLabel={accessibleLabel}
          accessibilityRole="text"
          textContentType="password"
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessible
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.eyeButton}
        >
          {visible ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    minHeight: 50,
  },
  inputRowError: {
    borderColor: '#dc2626',
  },
  leftIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 4,
  },
});
