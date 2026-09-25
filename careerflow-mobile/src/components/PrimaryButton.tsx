import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { type ReactNode } from 'react';

interface PrimaryButtonProps {
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ onPress, children, disabled, loading }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={styles.buttonText}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0f4c75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
