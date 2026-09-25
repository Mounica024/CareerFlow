import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Briefcase, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await resetPassword(email.trim());
      if (err) {
        setError('Unable to send reset email. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Unable to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            If an account exists for {email.trim()}, we've sent a password reset link.
          </Text>
          <Link href="/login" asChild>
            <Pressable style={styles.successButton}>
              <Text style={styles.successButtonText}>Back to Login</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Briefcase size={28} color="#ffffff" />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color="#94a3b8" style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  accessible
                  accessibilityLabel="Email address"
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </Pressable>

            <Link href="/login" asChild>
              <Pressable style={styles.backRow}>
                <ArrowLeft size={16} color="#0f4c75" />
                <Text style={styles.backText}>Back to Login</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f4c75',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
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
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  submitButton: {
    backgroundColor: '#0f4c75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  backText: {
    fontSize: 14,
    color: '#0f4c75',
    fontWeight: '500',
    marginLeft: 6,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successButton: {
    backgroundColor: '#0f4c75',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  successButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
