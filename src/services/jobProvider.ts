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
      experience_level: filters.experience_level || undefined,
      work_arrangement: filters.work_arrangement || undefined,
      sort: filters.sort || undefined,
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
 * LeverJobProvider — calls CareerFlow's own edge function which fetches
 * public job postings from Lever's public postings API. Lever is an ATS
 * used by many companies; their public postings endpoint requires no API key.
 * The edge function handles fetching from multiple company handles server-side.
 */
export class LeverJobProvider implements JobProvider {
  readonly name = 'Lever';
  readonly isConnected = true;

  async search(filters: JobSearchFilters): Promise<JobSearchResult> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const endpoint = `${supabaseUrl}/functions/v1/lever-search`;

    const payload = {
      query: filters.query || undefined,
      location: filters.location || undefined,
      page: filters.page || 1,
      results_per_page: filters.results_per_page || 10,
      experience_level: filters.experience_level || undefined,
      work_arrangement: filters.work_arrangement || undefined,
      sort: filters.sort || undefined,
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
      };
    }

    if (!response.ok) {
      return {
        jobs: [],
        total: 0,
        has_more: false,
        source: this.name,
        configured: true,
      };
    }

    const data = await response.json();
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

/**
 * Normalizes a string for deduplication: lowercase, trim, collapse whitespace,
 * remove common punctuation and suffixes.
 */
function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,;&'"\/\\()\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|pvt|private)\b/g, '')
    .trim();
}

/**
 * Build a deduplication key from normalized title + company + location.
 * Jobs with the same key across providers are considered duplicates.
 */
function dedupKey(job: Job): string {
  const title = normalizeText(job.title);
  const company = normalizeText(job.company);
  const location = normalizeText(job.location || '');
  return `${title}|${company}|${location}`;
}

/**
 * When two jobs are duplicates, pick the more complete record.
 * Prefer: longer description, more skills, has a deadline, has a salary.
 */
function pickMoreComplete(a: Job, b: Job): Job {
  let scoreA = 0;
  let scoreB = 0;
  if (a.description) scoreA += a.description.length;
  if (b.description) scoreB += b.description.length;
  if (a.skills.length) scoreA += a.skills.length * 50;
  if (b.skills.length) scoreB += b.skills.length * 50;
  if (a.application_deadline) scoreA += 100;
  if (b.application_deadline) scoreB += 100;
  if (a.salary_range) scoreA += 100;
  if (b.salary_range) scoreB += 100;
  return scoreA >= scoreB ? a : b;
}

interface ProviderResult {
  result: JobSearchResult;
  provider: JobProvider;
}

/**
 * JobAggregator — calls all registered providers in parallel, merges results
 * into a single deduplicated list, and handles pagination across providers.
 *
 * Pagination strategy: each provider is queried with the same page number.
 * Results are merged and deduplicated. has_more is true if ANY provider has more.
 * Total is the sum across providers (approximate for display purposes).
 *
 * If a provider fails, its results are simply excluded — other providers still
 * return jobs. No provider errors are exposed to the user.
 */
export class JobAggregator implements JobProvider {
  readonly name = 'CareerFlow';
  private providers: JobProvider[];

  constructor(providers: JobProvider[]) {
    this.providers = providers;
  }

  get isConnected(): boolean {
    return this.providers.some((p) => p.isConnected);
  }

  async search(filters: JobSearchFilters): Promise<JobSearchResult> {
    const results = await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const result = await provider.search(filters);
          return { result, provider } as ProviderResult;
        } catch {
          return {
            result: { jobs: [], total: 0, has_more: false, source: provider.name },
            provider,
          } as ProviderResult;
        }
      })
    );

    // Filter out providers that returned configuration errors
    const validResults = results.filter(
      (r) => r.result.configured !== false && !r.result.error
    );

    // If all providers returned configuration errors, surface that
    if (validResults.length === 0) {
      const firstConfig = results.find((r) => r.result.configured === false);
      if (firstConfig) {
        return {
          jobs: [],
          total: 0,
          has_more: false,
          source: this.name,
          configured: false,
        };
      }
      const firstError = results.find((r) => r.result.error);
      return {
        jobs: [],
        total: 0,
        has_more: false,
        source: this.name,
        configured: true,
        error: firstError?.result.error,
      };
    }

    // Merge and deduplicate across all providers
    const seen = new Map<string, Job>();

    for (const { result } of validResults) {
      for (const job of result.jobs) {
        const key = dedupKey(job);
        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, job);
        } else {
          seen.set(key, pickMoreComplete(existing, job));
        }
      }
    }

    const mergedJobs = Array.from(seen.values());
    const totalHasMore = validResults.some((r) => r.result.has_more);
    const totalSum = validResults.reduce((sum, r) => sum + (r.result.total || 0), 0);

    return {
      jobs: mergedJobs,
      total: totalSum,
      has_more: totalHasMore,
      source: this.name,
      configured: true,
    };
  }
}

const providers: JobProvider[] = [new AdzunaJobProvider(), new LeverJobProvider()];

export const jobProvider: JobProvider = new JobAggregator(providers);
