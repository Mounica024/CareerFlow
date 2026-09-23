import { supabase } from '@/lib/supabase';
import type { Profile, Certification, Project, ExperienceEntry } from '@/types';

export interface ProfileService {
  getProfile(userId: string): Promise<Profile | null>;
  createProfile(userId: string, email: string, data: Partial<Profile>): Promise<Profile>;
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile>;
  calculateCompletion(profile: Profile): number;
}

class SupabaseProfileService implements ProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  }

  async createProfile(userId: string, email: string, data: Partial<Profile>): Promise<Profile> {
    const insertData = {
      id: userId,
      email,
      full_name: data.full_name || '',
      phone: data.phone || '',
      degree: data.degree || '',
      branch: data.branch || '',
      graduation_year: data.graduation_year || null,
      college: data.college || '',
      location: data.location || '',
      preferred_roles: data.preferred_roles || [],
      preferred_locations: data.preferred_locations || [],
      skills: data.skills || [],
      programming_languages: data.programming_languages || [],
      certifications: data.certifications || [],
      projects: data.projects || [],
      experience: data.experience || [],
      resume_url: data.resume_url || '',
    };

    const { data: result, error } = await supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return result as Profile;
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedKeys: (keyof Profile)[] = [
      'full_name', 'phone', 'degree', 'branch', 'graduation_year', 'college',
      'location', 'preferred_roles', 'preferred_locations', 'skills',
      'programming_languages', 'certifications', 'projects', 'experience', 'resume_url',
    ];

    for (const key of allowedKeys) {
      if (key in data) {
        updateData[key] = data[key];
      }
    }

    const { data: result, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return result as Profile;
  }

  calculateCompletion(profile: Profile): number {
    const fields: { key: keyof Profile; weight: number; check: (val: unknown) => boolean }[] = [
      { key: 'full_name', weight: 8, check: (v) => !!v && v.toString().trim().length > 0 },
      { key: 'phone', weight: 5, check: (v) => !!v && v.toString().trim().length > 0 },
      { key: 'degree', weight: 8, check: (v) => !!v && v.toString().trim().length > 0 },
      { key: 'branch', weight: 7, check: (v) => !!v && v.toString().trim().length > 0 },
      { key: 'graduation_year', weight: 7, check: (v) => !!v },
      { key: 'college', weight: 7, check: (v) => !!v && v.toString().trim().length > 0 },
      { key: 'location', weight: 5, check: (v) => !!v && v.toString().trim().length > 0 },
      { key: 'preferred_roles', weight: 10, check: (v) => Array.isArray(v) && v.length > 0 },
      { key: 'preferred_locations', weight: 5, check: (v) => Array.isArray(v) && v.length > 0 },
      { key: 'skills', weight: 15, check: (v) => Array.isArray(v) && v.length >= 3 },
      { key: 'programming_languages', weight: 8, check: (v) => Array.isArray(v) && v.length > 0 },
      { key: 'certifications', weight: 5, check: (v) => Array.isArray(v) && v.length > 0 },
      { key: 'projects', weight: 10, check: (v) => Array.isArray(v) && v.length > 0 },
    ];

    let score = 0;
    for (const field of fields) {
      if (field.check(profile[field.key])) {
        score += field.weight;
      }
    }
    return Math.min(100, score);
  }
}

export const profileService: ProfileService = new SupabaseProfileService();

export type { Certification, Project, ExperienceEntry };
