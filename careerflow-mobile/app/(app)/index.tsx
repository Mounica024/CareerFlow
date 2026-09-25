import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Briefcase, LogOut } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPlaceholder() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Briefcase size={36} color="#ffffff" />
        </View>
        <Text style={styles.title}>CareerFlow Mobile</Text>
        <Text style={styles.badge}>Phase 1</Text>
        <Text style={styles.subtitle}>
          You're signed in{user?.email ? ` as ${user.email}` : ''}.
        </Text>
        <Text style={styles.description}>
          Dashboard, Find Jobs, Saved Jobs, Applications, Preparation, and Profile
          will be added in the next development phase.
        </Text>

        <Pressable onPress={signOut} style={styles.signOutButton}>
          <LogOut size={18} color="#ffffff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0f4c75',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f4c75',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f4c75',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
