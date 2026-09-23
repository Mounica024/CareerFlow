import type { Job, JobSearchFilters, JobSearchResult } from '@/types';

/**
 * JobProvider interface — pluggable job source.
 * Implement this to connect a real job API (e.g., a provider with an approved integration).
 * Each provider returns jobs in the unified Job shape.
 */
export interface JobProvider {
  readonly name: string;
  readonly isConnected: boolean;
  search(filters: JobSearchFilters): Promise<JobSearchResult>;
}

/**
 * AdzunaJobProvider — calls CareerFlow's own edge function which proxies
 * the Adzuna Jobs API server-side. API credentials are never exposed to the frontend.
 */
export class AdzunaJobProvider implements JobProvider {
  readonly name = 'Adzuna';
  private configured: boolean | null = null;

  get isConnected(): boolean {
    return this.configured === true;
  }

  async search(filters: JobSearchFilters): Promise<JobSearchResult> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const endpoint = `${supabaseUrl}/functions/v1/job-search`;

    const payload = {
      query: filters.query || undefined,
      location: filters.location || undefined,
      page: filters.page || 1,
      results_per_page: filters.results_per_page || 10,
      full_time: filters.employment_type === 'full_time',
      country: 'in',
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return {
        jobs: [],
        total: 0,
        has_more: false,
        source: this.name,
        configured: true,
        error: 'Unable to reach the job search service. Please check your connection and try again.',
      };
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      const configured = errorBody.configured !== false;
      this.configured = configured;
      return {
        jobs: [],
        total: 0,
        has_more: false,
        source: this.name,
        configured,
        error: errorBody.error || `Search failed (${response.status})`,
      };
    }

    const data = await response.json();
    this.configured = data.configured !== false;
    return {
      jobs: data.jobs || [],
      total: data.total || 0,
      has_more: data.has_more || false,
      source: data.source || this.name,
      configured: true,
    };
  }
}

/**
 * NoOpJobProvider — fallback when no real job API is connected.
 * Returns zero results. The UI shows a clean integration/empty state.
 */
export class NoOpJobProvider implements JobProvider {
  readonly name = 'No provider connected';
  readonly isConnected = false;

  async search(_filters: JobSearchFilters): Promise<JobSearchResult> {
    return {
      jobs: [],
      total: 0,
      has_more: false,
      source: this.name,
    };
  }
}

export const jobProvider: JobProvider = new AdzunaJobProvider();
