import type { Job } from '@/types';

/**
 * Safely extracts a company name from any value the provider might return:
 * string, object with display_name/name, null, or undefined.
 * Never returns [object Object] or raw JSON.
 */
export function normalizeCompany(value: unknown): string {
  if (!value) return 'Unknown Company';
  if (typeof value === 'string') return value.trim() || 'Unknown Company';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const name = obj.display_name || obj.name || obj.company_name || obj.label;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return 'Unknown Company';
}

/**
 * Formats a job date string for display. Returns null if the date is
 * missing or invalid — the caller should not render a badge in that case.
 */
export function formatJobDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Cleans obvious formatting artifacts from a job description:
 * collapses excessive whitespace, trims, removes broken line breaks.
 * Does not rewrite, summarize, or change meaning.
 */
export function cleanDescription(desc: string | undefined | null): string {
  if (!desc) return '';
  return desc
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Returns a readable location string, or null if unavailable.
 */
export function normalizeLocation(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const name = obj.display_name || obj.name || obj.label;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return null;
}

/**
 * Defensive: ensures a Job's company and description are safe for display.
 */
export function normalizeJobForDisplay(job: Job): Job {
  return {
    ...job,
    company: normalizeCompany(job.company),
    description: cleanDescription(job.description),
    location: job.location || undefined,
  };
}
