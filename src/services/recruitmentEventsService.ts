import { supabase } from '@/lib/supabase';
import type { RecruitmentEvent } from '@/types';

export interface RecruitmentEventsService {
  list(userId: string): Promise<RecruitmentEvent[]>;
  confirm(eventId: string): Promise<RecruitmentEvent>;
  remove(eventId: string): Promise<void>;
}

class SupabaseRecruitmentEventsService implements RecruitmentEventsService {
  async list(userId: string): Promise<RecruitmentEvent[]> {
    const { data, error } = await supabase
      .from('recruitment_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RecruitmentEvent[];
  }

  async confirm(eventId: string): Promise<RecruitmentEvent> {
    const { data, error } = await supabase
      .from('recruitment_events')
      .update({ confirmed: true })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data as RecruitmentEvent;
  }

  async remove(eventId: string): Promise<void> {
    const { error } = await supabase.from('recruitment_events').delete().eq('id', eventId);
    if (error) throw error;
  }
}

export const recruitmentEventsService: RecruitmentEventsService = new SupabaseRecruitmentEventsService();
