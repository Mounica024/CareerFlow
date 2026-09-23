import { supabase } from '@/lib/supabase';
import type { SavedJob, Job, JobMatchResult } from '@/types';

export interface SavedJobsService {
  list(userId: string): Promise<SavedJob[]>;
  save(userId: string, job: Job, matchData: JobMatchResult | null): Promise<SavedJob>;
  remove(userId: string, jobId: string): Promise<void>;
  isSaved(userId: string, jobId: string): Promise<boolean>;
}

class SupabaseSavedJobsService implements SavedJobsService {
  async list(userId: string): Promise<SavedJob[]> {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SavedJob[];
  }

  async save(userId: string, job: Job, matchData: JobMatchResult | null): Promise<SavedJob> {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: userId,
        job_id: job.id,
        job_data: job as unknown as Record<string, unknown>,
        match_data: matchData as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SavedJob;
  }

  async remove(userId: string, jobId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId);

    if (error) throw error;
  }

  async isSaved(userId: string, jobId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }
}

export const savedJobsService: SavedJobsService = new SupabaseSavedJobsService();
