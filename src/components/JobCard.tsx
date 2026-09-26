import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Building2, Clock, CheckCircle2, XCircle, DollarSign, Calendar, ClipboardCheck, Loader2, ShieldCheck, ShieldQuestion, Globe } from 'lucide-react';
import type { Job, JobMatchResult, SourceType } from '@/types';
import { MatchBadge, EmploymentTypeBadge, WorkArrangementBadge, ExperienceLevelBadge } from '@/components/Badges';

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  government: 'Government / Public',
  company_careers: 'Official Company',
  recognized_platform: 'Recognized Platform',
  job_aggregator: 'Job Aggregator',
  unverified: 'Unverified / Unknown',
};

const SOURCE_TYPE_STYLES: Record<SourceType, string> = {
  government: 'bg-blue-50 text-blue-700 border-blue-200',
  company_careers: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  recognized_platform: 'bg-violet-50 text-violet-700 border-violet-200',
  job_aggregator: 'bg-amber-50 text-amber-700 border-amber-200',
  unverified: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SOURCE_TYPE_ICONS: Record<SourceType, typeof ShieldCheck> = {
  government: ShieldCheck,
  company_careers: ShieldCheck,
  recognized_platform: Globe,
  job_aggregator: Globe,
  unverified: ShieldQuestion,
};

function SourceBadge({ job }: { job: Job }) {
  const sourceType: SourceType = job.source_type || 'unverified';
  const label = SOURCE_TYPE_LABELS[sourceType];
  const Icon = SOURCE_TYPE_ICONS[sourceType];
  const style = SOURCE_TYPE_STYLES[sourceType];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium ${style}`} title={`Source: ${job.job_source} — ${label}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function JobCard({
  job,
  match,
  isSaved,
  isTracked = false,
  tracking = false,
  onSave,
  onRemove,
  onTrack,
  onView,
  showMatch = true,
}: {
  job: Job;
  match?: JobMatchResult | null;
  isSaved?: boolean;
  isTracked?: boolean;
  tracking?: boolean;
  onSave?: () => void;
  onRemove?: () => void;
  onTrack?: () => void;
  onView?: () => void;
  showMatch?: boolean;
}) {
  return (
    <div className="card p-5 transition-all hover:shadow-md animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
            {job.company_logo ? (
              <img src={job.company_logo} alt={job.company} className="h-full w-full rounded-lg object-cover" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{job.title}</h3>
            <p className="text-sm text-slate-500 truncate">{job.company}</p>
          </div>
        </div>
        {onSave && !isSaved && (
          <button onClick={onSave} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition-colors" title="Save job">
            <Bookmark className="h-5 w-5" />
          </button>
        )}
        {onRemove && isSaved && (
          <button onClick={onRemove} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 transition-colors" title="Remove from saved">
            <BookmarkCheck className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <EmploymentTypeBadge type={job.employment_type} />
        <WorkArrangementBadge arrangement={job.work_arrangement} />
        <ExperienceLevelBadge level={job.experience_level} />
        {job.location && (
          <span className="badge bg-slate-100 text-slate-600">
            <MapPin className="h-3 w-3" /> {job.location}
          </span>
        )}
        {job.salary_range && (
          <span className="badge bg-emerald-50 text-emerald-700">
            <DollarSign className="h-3 w-3" /> {job.salary_range}
          </span>
        )}
        {job.posted_at && (
          <span className="badge bg-slate-50 text-slate-500">
            <Calendar className="h-3 w-3" /> {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {job.description && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-2">{job.description}</p>
      )}

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((skill) => (
            <span key={skill} className="rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
              {skill}
            </span>
          ))}
          {job.skills.length > 6 && (
            <span className="text-xs text-slate-400">+{job.skills.length - 6} more</span>
          )}
        </div>
      )}

      {showMatch && match && (
        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <MatchBadge status={match.status} percentage={match.match_percentage} />
            {match.match_percentage !== null && (
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${
                    match.status === 'strong_match'
                      ? 'bg-emerald-500'
                      : match.status === 'partial_match'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${match.match_percentage}%` }}
                />
              </div>
            )}
          </div>
          {match.matching_skills.length > 0 && (
            <div className="mt-2.5">
              <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Matching skills
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{match.matching_skills.join(', ')}</p>
            </div>
          )}
          {match.missing_skills.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-rose-700 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Missing skills
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{match.missing_skills.join(', ')}</p>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">{match.explanation}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <SourceBadge job={job} />
          {job.application_deadline && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(job.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onTrack && (
            isTracked ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <ClipboardCheck className="h-3.5 w-3.5" /> Tracked
              </span>
            ) : (
              <button
                onClick={onTrack}
                disabled={tracking}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60 disabled:pointer-events-none"
              >
                {tracking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                {tracking ? 'Tracking…' : 'Track'}
              </button>
            )
          )}
          {onView && (
            <button
              onClick={onView}
              className="btn-primary text-xs px-3 py-1.5"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
