import { supabase } from '@/lib/supabase';
import type { Application, ApplicationEvent, ApplicationStatus, Job } from '@/types';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'assessment',
  'technical_interview',
  'hr_interview',
  'offer',
  'rejected',
  'withdrawn',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  assessment: 'Assessment',
  technical_interview: 'Technical Interview',
  hr_interview: 'HR Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: 'bg-slate-100 text-slate-700',
  applied: 'bg-brand-50 text-brand-700',
  assessment: 'bg-amber-50 text-amber-700',
  technical_interview: 'bg-violet-50 text-violet-700',
  hr_interview: 'bg-cyan-50 text-cyan-700',
  offer: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  withdrawn: 'bg-slate-100 text-slate-500',
};

export interface ApplicationsService {
  list(userId: string): Promise<Application[]>;
  create(userId: string, job: Job, status?: ApplicationStatus): Promise<Application>;
  exists(userId: string, jobId: string): Promise<boolean>;
  updateStatus(applicationId: string, status: ApplicationStatus): Promise<Application>;
  remove(applicationId: string): Promise<void>;
  addEvent(applicationId: string, eventType: string, title: string, description?: string): Promise<ApplicationEvent>;
  getEvents(applicationId: string): Promise<ApplicationEvent[]>;
}

class SupabaseApplicationsService implements ApplicationsService {
  async list(userId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Application[];
  }

  async create(userId: string, job: Job, status: ApplicationStatus = 'saved'): Promise<Application> {
    // Check if an application for this job already exists for this user
    const { data: existing } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', job.id)
      .maybeSingle();

    if (existing) {
      return existing as Application;
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        job_id: job.id,
        job_data: job as unknown as Record<string, unknown>,
        status,
        applied_at: status === 'applied' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      // Race condition: row was inserted between our check and insert.
      // Fetch and return the existing row.
      if (error.code === '23505') {
        const { data: existingRow } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle();
        if (existingRow) return existingRow as Application;
      }
      throw error;
    }
    const application = data as Application;

    await this.addEvent(application.id, 'created', 'Application tracked', `Status: ${STATUS_LABELS[status]}`);

    return application;
  }

  async exists(userId: string, jobId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async updateStatus(applicationId: string, status: ApplicationStatus): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update({
        status,
        updated_at: new Date().toISOString(),
        applied_at: status === 'applied' ? new Date().toISOString() : undefined,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    const application = data as Application;

    await this.addEvent(applicationId, 'status_change', `Moved to ${STATUS_LABELS[status]}`, '');

    return application;
  }

  async remove(applicationId: string): Promise<void> {
    const { error } = await supabase.from('applications').delete().eq('id', applicationId);
    if (error) throw error;
  }

  async addEvent(
    applicationId: string,
    eventType: string,
    title: string,
    description?: string
  ): Promise<ApplicationEvent> {
    const { data, error } = await supabase
      .from('application_events')
      .insert({
        application_id: applicationId,
        event_type: eventType,
        title,
        description: description || '',
      })
      .select()
      .single();

    if (error) throw error;
    return data as ApplicationEvent;
  }

  async getEvents(applicationId: string): Promise<ApplicationEvent[]> {
    const { data, error } = await supabase
      .from('application_events')
      .select('*')
      .eq('application_id', applicationId)
      .order('occurred_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ApplicationEvent[];
  }
}

export const applicationsService: ApplicationsService = new SupabaseApplicationsService();
