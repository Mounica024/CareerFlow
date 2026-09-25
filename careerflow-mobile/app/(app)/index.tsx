import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Briefcase,
  UserCircle,
  Bookmark,
  ClipboardList,
  GraduationCap,
  LogOut,
  ArrowRight,
  Code,
  Target,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { profileService } from '@/services/profileService';
import { supabase } from '@/lib/supabase';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [activeAppsCount, setActiveAppsCount] = useState(0);
  const [prepCompleted, setPrepCompleted] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [savedRes, appsRes, prepRes] = await Promise.all([
        supabase.from('saved_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('preparation_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
      ]);
      setSavedJobsCount(savedRes.count || 0);
      setActiveAppsCount(appsRes.count || 0);
      setPrepCompleted(prepRes.count || 0);
    } catch {
      // silent — dashboard shows zeros
    }
  }, [user]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadCounts()]);
    setRefreshing(false);
  };

  if (profileLoading || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f4c75" />
        </View>
      </SafeAreaView>
    );
  }

  const completion = profileService.calculateCompletion(profile);
  const firstName = profile.full_name?.split(' ')[0] || 'there';

  const stats = [
    { label: 'Profile', value: `${completion}%`, icon: UserCircle, color: '#0f4c75', bg: '#e0f2fe' },
    { label: 'Saved Jobs', value: savedJobsCount, icon: Bookmark, color: '#7c3aed', bg: '#f3e8ff' },
    { label: 'Applications', value: activeAppsCount, icon: ClipboardList, color: '#d97706', bg: '#fef3c7' },
    { label: 'Prep Done', value: prepCompleted, icon: GraduationCap, color: '#059669', bg: '#d1fae5' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0f4c75" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Briefcase size={22} color="#ffffff" />
            </View>
            <Text style={styles.brandName}>CareerFlow</Text>
            <View style={styles.spacer} />
            <Pressable
              onPress={signOut}
              hitSlop={12}
              accessible
              accessibilityLabel="Sign out"
              accessibilityRole="button"
            >
              <LogOut size={20} color="#64748b" />
            </Pressable>
          </View>
          <Text style={styles.welcome}>Welcome back, {firstName}</Text>
          <Text style={styles.welcomeSub}>Here's an overview of your career progress.</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <stat.icon size={18} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Profile completion bar */}
        {completion < 100 && (
          <Pressable
            onPress={() => router.push('/profile')}
            style={styles.completionCard}
            accessible
            accessibilityLabel="Complete your profile"
            accessibilityRole="button"
          >
            <View style={styles.completionHeader}>
              <View style={styles.completionTextContainer}>
                <Text style={styles.completionTitle}>Complete your profile</Text>
                <Text style={styles.completionSub}>A complete profile improves job matching accuracy.</Text>
              </View>
              <ArrowRight size={18} color="#0f4c75" />
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </Pressable>
        )}

        {/* Career overview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Target size={18} color="#0f4c75" />
            <Text style={styles.sectionTitle}>Career Overview</Text>
          </View>

          {profile.preferred_roles.length > 0 && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Target roles</Text>
              <Text style={styles.fieldValue}>{profile.preferred_roles.join(', ')}</Text>
            </View>
          )}

          {profile.preferred_locations.length > 0 && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Preferred locations</Text>
              <Text style={styles.fieldValue}>{profile.preferred_locations.join(', ')}</Text>
            </View>
          )}

          {profile.skills.length > 0 && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Skills</Text>
              <View style={styles.tagsContainer}>
                {profile.skills.slice(0, 6).map((skill) => (
                  <View key={skill} style={styles.tag}>
                    <Text style={styles.tagText}>{skill}</Text>
                  </View>
                ))}
                {profile.skills.length > 6 && (
                  <Text style={styles.moreText}>+{profile.skills.length - 6} more</Text>
                )}
              </View>
            </View>
          )}

          {profile.programming_languages.length > 0 && (
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Code size={14} color="#64748b" />
                <Text style={styles.fieldLabel}>Programming languages</Text>
              </View>
              <View style={styles.tagsContainer}>
                {profile.programming_languages.map((lang) => (
                  <View key={lang} style={[styles.tag, { backgroundColor: '#ecfdf5' }]}>
                    <Text style={[styles.tagText, { color: '#065f46' }]}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {profile.preferred_roles.length === 0 && profile.skills.length === 0 && (
            <Text style={styles.emptyText}>Add your target roles and skills to improve job matching.</Text>
          )}
        </View>

        {/* Profile button */}
        <Pressable
          onPress={() => router.push('/profile')}
          style={styles.profileButton}
          accessible
          accessibilityLabel="Edit profile"
          accessibilityRole="button"
        >
          <UserCircle size={20} color="#0f4c75" />
          <Text style={styles.profileButtonText}>Edit Profile</Text>
          <ArrowRight size={16} color="#94a3b8" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f4c75',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 10,
  },
  spacer: {
    flex: 1,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  completionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  completionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  completionSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#0f4c75',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  fieldRow: {
    marginBottom: 14,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: '#334155',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 13,
    color: '#94a3b8',
    alignSelf: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  profileButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f4c75',
  },
});
