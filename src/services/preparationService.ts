import { supabase } from '@/lib/supabase';
import type { PreparationProgress, PreparationCategory, PreparationStatus } from '@/types';

export interface PreparationService {
  list(userId: string): Promise<PreparationProgress[]>;
  upsert(userId: string, category: PreparationCategory, topic: string, status: PreparationStatus, jobId?: string): Promise<PreparationProgress>;
  updateProgress(id: string, updates: Partial<Pick<PreparationProgress, 'learning_progress' | 'practice_progress' | 'interview_progress' | 'status'>>): Promise<PreparationProgress>;
  remove(id: string): Promise<void>;
}

class SupabasePreparationService implements PreparationService {
  async list(userId: string): Promise<PreparationProgress[]> {
    const { data, error } = await supabase
      .from('preparation_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PreparationProgress[];
  }

  async upsert(
    userId: string,
    category: PreparationCategory,
    topic: string,
    status: PreparationStatus,
    jobId?: string
  ): Promise<PreparationProgress> {
    const { data: existing } = await supabase
      .from('preparation_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('topic', topic)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('preparation_progress')
        .update({ status, last_attempted_at: new Date().toISOString(), job_id: jobId || null })
        .eq('id', (existing as PreparationProgress).id)
        .select()
        .single();
      if (error) throw error;
      return data as PreparationProgress;
    }

    const { data, error } = await supabase
      .from('preparation_progress')
      .insert({
        user_id: userId,
        category,
        topic,
        status,
        job_id: jobId || null,
        last_attempted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PreparationProgress;
  }

  async updateProgress(
    id: string,
    updates: Partial<Pick<PreparationProgress, 'learning_progress' | 'practice_progress' | 'interview_progress' | 'status'>>
  ): Promise<PreparationProgress> {
    const { data, error } = await supabase
      .from('preparation_progress')
      .update({ ...updates, last_attempted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as PreparationProgress;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('preparation_progress').delete().eq('id', id);
    if (error) throw error;
  }
}

export const preparationService: PreparationService = new SupabasePreparationService();
