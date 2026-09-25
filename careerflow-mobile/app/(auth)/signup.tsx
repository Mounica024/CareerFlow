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
import { Mail, Briefcase, CheckCircle } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { PasswordInput } from '@/components/PasswordInput';

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already') && m.includes('registered')) return 'An account with this email already exists. Try signing in instead.';
  if (m.includes('weak') || m.includes('password')) return 'Password is too weak. Please use at least 6 characters.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('network') || m.includes('fetch')) return 'Unable to connect. Check your internet connection and try again.';
  return 'Unable to create account. Please try again.';
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Please enter a valid email address.';
    if (!password) e.password = 'Please enter a password.';
    if (!confirmPassword) e.confirm = 'Please confirm your password.';
    else if (password !== confirmPassword) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const { error, needsConfirmation } = await signUp(email.trim(), password);
      if (error) {
        setErrors({ general: friendlyAuthError(error) });
      } else if (needsConfirmation) {
        setSuccess(true);
      }
    } catch {
      setErrors({ general: 'Unable to create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We sent a verification link to {email.trim()}. Please verify your email before signing in.
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
              <Briefcase size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your career journey with CareerFlow</Text>
          </View>

          <View style={styles.form}>
            {errors.general ? (
              <View style={styles.generalErrorBox}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, errors.email ? styles.inputRowError : null]}>
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
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <PasswordInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              error={errors.password}
              accessibleLabel="Password"
            />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              error={errors.confirm}
              accessibleLabel="Confirm password"
            />

            <Pressable
              onPress={handleSignup}
              disabled={loading}
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
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
    paddingTop: 40,
    paddingBottom: 28,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#0f4c75',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
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
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 4,
  },
  generalErrorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  signupButton: {
    backgroundColor: '#0f4c75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 14,
    color: '#0f4c75',
    fontWeight: '600',
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
