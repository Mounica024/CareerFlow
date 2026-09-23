import type { MatchStatus, EmploymentType, WorkArrangement, ExperienceLevel } from '@/types';

export function MatchBadge({ status, percentage }: { status: MatchStatus; percentage: number | null }) {
  const config: Record<MatchStatus, { label: string; classes: string }> = {
    strong_match: { label: 'Strong Match', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    partial_match: { label: 'Partial Match', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
    requirements_missing: { label: 'Requirements Missing', classes: 'bg-rose-50 text-rose-700 border border-rose-200' },
    unable_to_determine: { label: 'Unable to Determine', classes: 'bg-slate-100 text-slate-600 border border-slate-200' },
  };

  const { label, classes } = config[status];

  return (
    <span className={`badge ${classes}`}>
      {percentage !== null && `${percentage}% — `}
      {label}
    </span>
  );
}

export function EmploymentTypeBadge({ type }: { type: EmploymentType }) {
  const labels: Record<EmploymentType, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    internship: 'Internship',
    contract: 'Contract',
  };
  return <span className="badge bg-slate-100 text-slate-600">{labels[type]}</span>;
}

export function WorkArrangementBadge({ arrangement }: { arrangement: WorkArrangement }) {
  const labels: Record<WorkArrangement, string> = {
    remote: 'Remote',
    on_site: 'On-site',
    hybrid: 'Hybrid',
  };
  return <span className="badge bg-brand-50 text-brand-700">{labels[arrangement]}</span>;
}

export function ExperienceLevelBadge({ level }: { level: ExperienceLevel }) {
  const labels: Record<ExperienceLevel, string> = {
    entry_level: 'Entry Level',
    junior: 'Junior',
    mid: 'Mid-level',
    senior: 'Senior',
    lead: 'Lead',
  };
  return <span className="badge bg-violet-50 text-violet-700">{labels[level]}</span>;
}
