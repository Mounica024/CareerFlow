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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Briefcase } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { PasswordInput } from '@/components/PasswordInput';

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password. Please try again.';
  if (m.includes('email not confirmed')) return 'Please verify your email before signing in.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('network') || m.includes('fetch')) return 'Unable to connect. Check your internet connection and try again.';
  return 'Unable to sign in. Please try again.';
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Please enter a valid email address.';
    if (!password) e.password = 'Please enter your password.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setErrors({ general: friendlyAuthError(error) });
      }
    } catch {
      setErrors({ general: 'Unable to sign in. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>CareerFlow</Text>
            <Text style={styles.subtitle}>Sign in to continue your career journey</Text>
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
              placeholder="Enter your password"
              error={errors.password}
              accessibleLabel="Password"
            />

            <Pressable
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                <Pressable>
                  <Text style={styles.signupLink}>Create one</Text>
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
    paddingTop: 48,
    paddingBottom: 32,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#0f4c75',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0f4c75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: '#64748b',
  },
  signupLink: {
    fontSize: 14,
    color: '#0f4c75',
    fontWeight: '600',
  },
});
