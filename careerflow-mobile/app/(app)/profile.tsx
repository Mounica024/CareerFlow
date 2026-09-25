import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, Briefcase } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { ProfileField } from '@/components/ProfileField';
import { TagInput } from '@/components/TagInput';
import { SectionCard } from '@/components/SectionCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Certification, Project, ExperienceEntry } from '@/types';

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('network') || m.includes('fetch')) return 'Unable to connect. Check your internet connection and try again.';
  if (m.includes('rate limit')) return 'Too many requests. Please wait a moment and try again.';
  return 'Unable to save profile. Please try again.';
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile, loading, needsSetup, update, refresh } = useProfile();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [college, setCollege] = useState('');
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [programmingLanguages, setProgrammingLanguages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [resumeUrl, setResumeUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setLocation(profile.location || '');
      setDegree(profile.degree || '');
      setBranch(profile.branch || '');
      setGraduationYear(profile.graduation_year?.toString() || '');
      setCollege(profile.college || '');
      setPreferredRoles(profile.preferred_roles || []);
      setPreferredLocations(profile.preferred_locations || []);
      setSkills(profile.skills || []);
      setProgrammingLanguages(profile.programming_languages || []);
      setCertifications(profile.certifications || []);
      setProjects(profile.projects || []);
      setExperience(profile.experience || []);
      setResumeUrl(profile.resume_url || '');
    }
  }, [profile]);

  const validateResumeUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return /^https?:\/\/.+\..+/.test(url.trim());
  };

  const handleSave = async () => {
    if (saving) return;
    setError(null);
    setResumeError(null);

    if (resumeUrl.trim() && !validateResumeUrl(resumeUrl)) {
      setResumeError('Please enter a valid URL (starting with http:// or https://).');
      return;
    }

    const gradYearNum = graduationYear.trim() ? parseInt(graduationYear.trim(), 10) : null;
    if (gradYearNum !== null && (isNaN(gradYearNum) || gradYearNum < 1900 || gradYearNum > 2100)) {
      setError('Please enter a valid graduation year.');
      return;
    }

    setSaving(true);
    try {
      await update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        graduation_year: gradYearNum,
        college: college.trim(),
        preferred_roles: preferredRoles,
        preferred_locations: preferredLocations,
        skills,
        programming_languages: programmingLanguages,
        certifications,
        projects,
        experience,
        resume_url: resumeUrl.trim(),
      });
      await refresh();
      if (needsSetup) {
        router.replace('/');
      } else {
        router.back();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(friendlyError(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f4c75" />
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
        {/* Header */}
        <View style={styles.header}>
          {needsSetup ? (
            <View style={styles.headerBrand}>
              <View style={styles.logoContainer}>
                <Briefcase size={20} color="#ffffff" />
              </View>
              <Text style={styles.brandName}>CareerFlow</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessible
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ArrowLeft size={22} color="#0f4c75" />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>{needsSetup ? 'Complete Your Profile' : 'Edit Profile'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {needsSetup && (
            <View style={styles.setupBanner}>
              <Text style={styles.setupBannerText}>
                Welcome to CareerFlow! Tell us about yourself so we can match you with the right opportunities.
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Personal Information */}
          <SectionCard title="Personal Information">
            <ProfileField label="Full name" value={fullName} onChangeText={setFullName} placeholder="e.g. Jane Doe" />
            <ProfileField label="Email" value={user?.email || ''} onChangeText={() => {}} placeholder="" />
            <ProfileField label="Phone" value={phone} onChangeText={setPhone} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" />
            <ProfileField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Bangalore, India" />
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education">
            <ProfileField label="Degree" value={degree} onChangeText={setDegree} placeholder="e.g. B.Tech" />
            <ProfileField label="Branch" value={branch} onChangeText={setBranch} placeholder="e.g. Computer Science" />
            <ProfileField label="Graduation year" value={graduationYear} onChangeText={setGraduationYear} placeholder="e.g. 2025" keyboardType="number-pad" />
            <ProfileField label="College / Institution" value={college} onChangeText={setCollege} placeholder="e.g. IIT Delhi" />
          </SectionCard>

          {/* Job Preferences */}
          <SectionCard title="Job Preferences">
            <TagInput
              label="Preferred roles"
              tags={preferredRoles}
              onAdd={(t) => setPreferredRoles((prev) => [...prev, t])}
              onRemove={(t) => setPreferredRoles((prev) => prev.filter((x) => x !== t))}
              placeholder="e.g. Software Engineer"
            />
            <TagInput
              label="Preferred locations"
              tags={preferredLocations}
              onAdd={(t) => setPreferredLocations((prev) => [...prev, t])}
              onRemove={(t) => setPreferredLocations((prev) => prev.filter((x) => x !== t))}
              placeholder="e.g. Bangalore, Remote"
            />
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Skills">
            <TagInput
              label="Skills"
              tags={skills}
              onAdd={(t) => setSkills((prev) => [...prev, t])}
              onRemove={(t) => setSkills((prev) => prev.filter((x) => x !== t))}
              placeholder="e.g. Data Analysis, Figma"
            />
            <TagInput
              label="Programming languages"
              tags={programmingLanguages}
              onAdd={(t) => setProgrammingLanguages((prev) => [...prev, t])}
              onRemove={(t) => setProgrammingLanguages((prev) => prev.filter((x) => x !== t))}
              placeholder="e.g. Python, JavaScript"
            />
          </SectionCard>

          {/* Certifications */}
          <SectionCard title="Certifications">
            {certifications.map((cert, i) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.listItemBody}>
                  <TextInput
                    style={styles.listInput}
                    value={cert.name}
                    onChangeText={(v) => setCertifications((prev) => prev.map((c, idx) => idx === i ? { ...c, name: v } : c))}
                    placeholder="Certification name"
                    placeholderTextColor="#94a3b8"
                    accessible
                    accessibilityLabel={`Certification ${i + 1} name`}
                  />
                  <View style={styles.listItemRow}>
                    <TextInput
                      style={[styles.listInput, styles.listInputSmall]}
                      value={cert.issuer || ''}
                      onChangeText={(v) => setCertifications((prev) => prev.map((c, idx) => idx === i ? { ...c, issuer: v } : c))}
                      placeholder="Issuer"
                      placeholderTextColor="#94a3b8"
                      accessible
                      accessibilityLabel={`Certification ${i + 1} issuer`}
                    />
                    <TextInput
                      style={[styles.listInput, styles.listInputSmall]}
                      value={cert.year || ''}
                      onChangeText={(v) => setCertifications((prev) => prev.map((c, idx) => idx === i ? { ...c, year: v } : c))}
                      placeholder="Year"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      accessible
                      accessibilityLabel={`Certification ${i + 1} year`}
                    />
                  </View>
                </View>
                <Pressable
                  onPress={() => setCertifications((prev) => prev.filter((_, idx) => idx !== i))}
                  hitSlop={8}
                  accessible
                  accessibilityLabel={`Remove certification ${i + 1}`}
                >
                  <X size={18} color="#dc2626" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => setCertifications((prev) => [...prev, { name: '', issuer: '', year: '' }])}
              style={styles.addListItemButton}
            >
              <Plus size={16} color="#0f4c75" />
              <Text style={styles.addListItemText}>Add certification</Text>
            </Pressable>
          </SectionCard>

          {/* Projects */}
          <SectionCard title="Projects">
            {projects.map((proj, i) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.listItemBody}>
                  <TextInput
                    style={styles.listInput}
                    value={proj.title}
                    onChangeText={(v) => setProjects((prev) => prev.map((p, idx) => idx === i ? { ...p, title: v } : p))}
                    placeholder="Project title"
                    placeholderTextColor="#94a3b8"
                    accessible
                    accessibilityLabel={`Project ${i + 1} title`}
                  />
                  <TextInput
                    style={[styles.listInput, styles.multilineInput]}
                    value={proj.description || ''}
                    onChangeText={(v) => setProjects((prev) => prev.map((p, idx) => idx === i ? { ...p, description: v } : p))}
                    placeholder="Description (optional)"
                    placeholderTextColor="#94a3b8"
                    multiline
                    accessible
                    accessibilityLabel={`Project ${i + 1} description`}
                  />
                  <TextInput
                    style={styles.listInput}
                    value={(proj.technologies || []).join(', ')}
                    onChangeText={(v) => setProjects((prev) => prev.map((p, idx) => idx === i ? { ...p, technologies: v.split(',').map((s) => s.trim()).filter(Boolean) } : p))}
                    placeholder="Technologies (comma-separated)"
                    placeholderTextColor="#94a3b8"
                    accessible
                    accessibilityLabel={`Project ${i + 1} technologies`}
                  />
                </View>
                <Pressable
                  onPress={() => setProjects((prev) => prev.filter((_, idx) => idx !== i))}
                  hitSlop={8}
                  accessible
                  accessibilityLabel={`Remove project ${i + 1}`}
                >
                  <X size={18} color="#dc2626" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => setProjects((prev) => [...prev, { title: '', description: '', technologies: [] }])}
              style={styles.addListItemButton}
            >
              <Plus size={16} color="#0f4c75" />
              <Text style={styles.addListItemText}>Add project</Text>
            </Pressable>
          </SectionCard>

          {/* Experience */}
          <SectionCard title="Experience">
            {experience.map((exp, i) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.listItemBody}>
                  <TextInput
                    style={styles.listInput}
                    value={exp.role}
                    onChangeText={(v) => setExperience((prev) => prev.map((e, idx) => idx === i ? { ...e, role: v } : e))}
                    placeholder="Role"
                    placeholderTextColor="#94a3b8"
                    accessible
                    accessibilityLabel={`Experience ${i + 1} role`}
                  />
                  <TextInput
                    style={styles.listInput}
                    value={exp.company}
                    onChangeText={(v) => setExperience((prev) => prev.map((e, idx) => idx === i ? { ...e, company: v } : e))}
                    placeholder="Company"
                    placeholderTextColor="#94a3b8"
                    accessible
                    accessibilityLabel={`Experience ${i + 1} company`}
                  />
                  <TextInput
                    style={styles.listInput}
                    value={exp.duration || ''}
                    onChangeText={(v) => setExperience((prev) => prev.map((e, idx) => idx === i ? { ...e, duration: v } : e))}
                    placeholder="Duration (e.g. 6 months)"
                    placeholderTextColor="#94a3b8"
                    accessible
                    accessibilityLabel={`Experience ${i + 1} duration`}
                  />
                  <TextInput
                    style={[styles.listInput, styles.multilineInput]}
                    value={exp.description || ''}
                    onChangeText={(v) => setExperience((prev) => prev.map((e, idx) => idx === i ? { ...e, description: v } : e))}
                    placeholder="Description (optional)"
                    placeholderTextColor="#94a3b8"
                    multiline
                    accessible
                    accessibilityLabel={`Experience ${i + 1} description`}
                  />
                </View>
                <Pressable
                  onPress={() => setExperience((prev) => prev.filter((_, idx) => idx !== i))}
                  hitSlop={8}
                  accessible
                  accessibilityLabel={`Remove experience ${i + 1}`}
                >
                  <X size={18} color="#dc2626" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => setExperience((prev) => [...prev, { role: '', company: '', duration: '', description: '' }])}
              style={styles.addListItemButton}
            >
              <Plus size={16} color="#0f4c75" />
              <Text style={styles.addListItemText}>Add experience</Text>
            </Pressable>
          </SectionCard>

          {/* Resume */}
          <SectionCard title="Resume">
            <ProfileField
              label="Resume URL"
              value={resumeUrl}
              onChangeText={setResumeUrl}
              placeholder="https://your-resume-link.com"
              keyboardType="url"
              error={resumeError}
            />
          </SectionCard>

          {/* Save button */}
          <View style={styles.saveContainer}>
            <PrimaryButton onPress={handleSave} loading={saving}>
              {needsSetup ? 'Save & Continue' : 'Save Changes'}
            </PrimaryButton>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0f4c75',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  setupBanner: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  setupBannerText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  listItemBody: {
    flex: 1,
    gap: 6,
  },
  listItemRow: {
    flexDirection: 'row',
    gap: 6,
  },
  listInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  listInputSmall: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  addListItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addListItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f4c75',
  },
  saveContainer: {
    marginTop: 8,
  },
});
