import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Building2, Clock, CheckCircle2, XCircle, DollarSign, Calendar, ClipboardCheck, Loader2 } from 'lucide-react';
import type { Job, JobMatchResult } from '@/types';
import { MatchBadge, EmploymentTypeBadge, WorkArrangementBadge, ExperienceLevelBadge } from '@/components/Badges';

export function JobCard({
  job,
  match,
  isSaved,
  isTracked = false,
  tracking = false,
  onSave,
  onRemove,
  onTrack,
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
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Source: {job.job_source}</span>
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
          {job.application_url && (
            <a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs px-3 py-1.5"
            >
              Apply <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
