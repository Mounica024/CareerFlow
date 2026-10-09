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
 * Formats a job date as a relative string ("Posted today", "Posted 3 days ago")
 * or falls back to a calendar date ("Sep 28, 2026"). Returns null if no
 * valid date is available.
 */
export function formatRelativeDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Validates that a URL string is well-formed and uses http(s).
 */
export function isValidUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Quality gate: validates a job record before display.
 * Rejects records with missing title, company, usable source/application URL,
 * malformed URLs, unusable descriptions, placeholder/test data, or [object Object].
 * Returns the job if valid, null if it should be rejected.
 */
export function validateJob(job: Job): Job | null {
  if (!job) return null;

  // Title: must be a non-empty string
  if (!job.title || typeof job.title !== 'string' || !job.title.trim()) return null;
  if (job.title.includes('[object Object]')) return null;

  // Company: must resolve to a real name, not [object Object] or empty
  const company = normalizeCompany(job.company);
  if (!company || company === 'Unknown Company') return null;
  if (company.includes('[object Object]')) return null;

  // Application URL: must be a valid http(s) URL
  if (!isValidUrl(job.application_url)) return null;

  // Source URL: must be valid if present
  if (job.source_url && !isValidUrl(job.source_url)) return null;

  // Description: reject if it's an object, null, or too short to be useful
  if (job.description !== undefined) {
    if (typeof job.description !== 'string') return null;
    const cleaned = cleanDescription(job.description);
    if (cleaned.includes('[object Object]')) return null;
  }

  // Reject placeholder/test data
  const titleLower = job.title.toLowerCase();
  if (titleLower === 'test' || titleLower === 'untitled position' || titleLower.includes('lorem ipsum')) return null;

  // Reject jobs with invalid dates that are required
  if (job.posted_at) {
    const d = new Date(job.posted_at);
    if (isNaN(d.getTime())) return null;
  }

  // Reject jobs with invalid deadline dates
  if (job.application_deadline) {
    const d = new Date(job.application_deadline);
    if (isNaN(d.getTime())) return null;
  }

  // Reject jobs with raw object values in string fields
  if (typeof job.location === 'object') return null;
  if (typeof job.salary_range === 'object') return null;

  return job;
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

export interface DescriptionSections {
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

/**
 * Extracts structured sections (responsibilities, requirements, benefits)
 * from a job description by looking for common heading patterns.
 * Only returns sections that are actually present in the original text.
 * Never invents content.
 */
export function extractDescriptionSections(desc: string | undefined | null): DescriptionSections {
  const cleaned = cleanDescription(desc);
  const result: DescriptionSections = {
    description: cleaned,
    responsibilities: [],
    requirements: [],
    benefits: [],
  };

  if (!cleaned) return result;

  // Try to split by common section headings
  const headingPattern = /(?:^|\n)\s*(?:#{1,4}\s*)?((?:responsibilities|what you['']?ll do|what you will do|your role|the role|about the role|key responsibilities|what you['']?ll be doing|day[- ]to[- ]day))\s*[:\n]\s*/i;
  const reqPattern = /(?:^|\n)\s*(?:#{1,4}\s*)?((?:requirements|qualifications|what you['']?ll need|what we['']?re looking for|about you|skills and requirements|minimum requirements|preferred qualifications|nice to have|you have))\s*[:\n]\s*/i;
  const benefitsPattern = /(?:^|\n)\s*(?:#{1,4}\s*)?((?:benefits|perks|what we offer|our benefits|compensation and benefits))\s*[:\n]\s*/i;

  const respMatch = cleaned.match(headingPattern);
  const reqMatch = cleaned.match(reqPattern);
  const benMatch = cleaned.match(benefitsPattern);

  // Extract bullet-point or paragraph sections after each heading
  const extractSection = (startIdx: number, otherStarts: number[]): string[] => {
    const nextStart = Math.min(...otherStarts.filter((s) => s > startIdx), cleaned.length);
    const sectionText = cleaned.substring(startIdx, nextStart).trim();
    if (!sectionText) return [];

    // If section contains bullet points (lines starting with -, *, or •)
    const bullets = sectionText.split('\n').filter((line) => line.trim().match(/^[-*•]\s+/));
    if (bullets.length >= 2) {
      return bullets.map((b) => b.replace(/^[-*•]\s+/, '').trim()).filter(Boolean);
    }
    // Otherwise treat as paragraph — split by newlines
    return sectionText.split('\n').map((l) => l.trim()).filter(Boolean);
  };

  const allStarts = [respMatch?.index ?? -1, reqMatch?.index ?? -1, benMatch?.index ?? -1].filter((s) => s >= 0);

  if (respMatch && respMatch.index !== undefined) {
    const headingEnd = respMatch.index + respMatch[0].length;
    result.responsibilities = extractSection(headingEnd, allStarts.filter((s) => s !== respMatch.index));
  }
  if (reqMatch && reqMatch.index !== undefined) {
    const headingEnd = reqMatch.index + reqMatch[0].length;
    result.requirements = extractSection(headingEnd, allStarts.filter((s) => s !== reqMatch.index));
  }
  if (benMatch && benMatch.index !== undefined) {
    const headingEnd = benMatch.index + benMatch[0].length;
    result.benefits = extractSection(headingEnd, allStarts.filter((s) => s !== benMatch.index));
  }

  // If we extracted structured sections, the main description should be
  // the text before the first structured section
  if (result.responsibilities.length > 0 || result.requirements.length > 0 || result.benefits.length > 0) {
    const firstSectionStart = Math.min(...allStarts);
    result.description = cleaned.substring(0, firstSectionStart).trim();
  }

  return result;
}
