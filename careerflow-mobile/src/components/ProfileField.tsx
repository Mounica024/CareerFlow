import { View, Text, TextInput, StyleSheet } from 'react-native';

interface ProfileFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'url';
  error?: string | null;
  multiline?: boolean;
}

export function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
  multiline,
}: ProfileFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        accessible
        accessibilityLabel={label}
        multiline={multiline}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 4,
  },
});
