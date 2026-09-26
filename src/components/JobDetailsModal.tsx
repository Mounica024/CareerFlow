import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Building2, Clock, DollarSign, Calendar, ExternalLink,
  Bookmark, BookmarkCheck, ClipboardCheck, GraduationCap, Loader2,
  CheckCircle2, XCircle, AlertCircle, ShieldCheck, ShieldQuestion, Globe,
  ArrowRight, AlertTriangle,
} from 'lucide-react';
import type { Job, JobMatchResult, SourceType } from '@/types';
import { Modal } from '@/components/Modal';
import {
  MatchBadge, EmploymentTypeBadge, WorkArrangementBadge, ExperienceLevelBadge,
} from '@/components/Badges';

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

interface JobDetailsModalProps {
  job: Job | null;
  match?: JobMatchResult | null;
  isSaved?: boolean;
  isTracked?: boolean;
  tracking?: boolean;
  onSave?: () => void;
  onRemove?: () => void;
  onTrack?: () => void;
  onClose: () => void;
}

export function JobDetailsModal({
  job, match, isSaved = false, isTracked = false, tracking = false,
  onSave, onRemove, onTrack, onClose,
}: JobDetailsModalProps) {
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const navigate = useNavigate();

  if (!job) return null;

  const sourceType: SourceType = job.source_type || 'unverified';
  const SourceIcon = SOURCE_TYPE_ICONS[sourceType];
  const sourceLabel = SOURCE_TYPE_LABELS[sourceType];
  const sourceStyle = SOURCE_TYPE_STYLES[sourceType];

  const handleApply = () => {
    if (job.application_url) {
      window.open(job.application_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrepare = () => {
    onClose();
    navigate('/app/preparation');
  };

  return (
    <Modal open={!!job} onClose={onClose} title="Job Details" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
            {job.company_logo ? (
              <img src={job.company_logo} alt={job.company} className="h-full w-full rounded-lg object-cover" />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
            <p className="text-sm text-slate-500">{job.company}</p>
          </div>
          {isSaved ? (
            <button onClick={onRemove} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 transition-colors" title="Remove from saved">
              <BookmarkCheck className="h-5 w-5" />
            </button>
          ) : (
            onSave && (
              <button onClick={onSave} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition-colors" title="Save job">
                <Bookmark className="h-5 w-5" />
              </button>
            )
          )}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
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
              <Calendar className="h-3 w-3" /> Posted {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {job.application_deadline && (
            <span className="badge bg-rose-50 text-rose-700">
              <Clock className="h-3 w-3" /> Deadline {new Date(job.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Source info */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${sourceStyle}`}>
            <SourceIcon className="h-3 w-3" />
            {sourceLabel}
          </span>
          <span className="text-xs text-slate-500">via {job.job_source}</span>
        </div>

        {/* Description */}
        {job.description && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Job Description</h4>
            <p className="text-sm text-slate-600 whitespace-pre-line">{job.description}</p>
          </div>
        )}

        {/* Skills */}
        {job.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Skills & Requirements</h4>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span key={skill} className="rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why this job matches you */}
        {match && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Why This Job Matches You</h4>

            {match.status === 'unable_to_determine' ? (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600">{match.explanation}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <MatchBadge status={match.status} percentage={match.match_percentage} />
                  {match.match_percentage !== null && (
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          match.status === 'strong_match' ? 'bg-emerald-500'
                            : match.status === 'partial_match' ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${match.match_percentage}%` }}
                      />
                    </div>
                  )}
                </div>

                {match.matching_skills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Matching Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matching_skills.map((s) => (
                        <span key={s} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {match.missing_skills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-rose-700 mb-1.5 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Skills to Improve
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills.map((s) => (
                        <span key={s} className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {match.other_requirements.length > 0 && (
                  <div className="mb-1">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Other Requirements</p>
                    <ul className="space-y-1">
                      {match.other_requirements.map((req, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-slate-400 mt-0.5">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">{match.explanation}</p>
              </>
            )}
          </div>
        )}

        {/* Apply confirmation */}
        {showApplyConfirm && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 animate-slide-up">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">You are leaving CareerFlow</p>
                <p className="mt-1 text-sm text-slate-600">
                  You will be redirected to the application page on{' '}
                  <span className="font-medium text-slate-900">{job.job_source}</span>
                  {' '}to complete your application. CareerFlow cannot submit applications on your behalf to external sites.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleApply}
                    className="btn-primary text-xs"
                  >
                    Continue to {job.job_source} <ExternalLink className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setShowApplyConfirm(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
          {onTrack && (
            isTracked ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <ClipboardCheck className="h-4 w-4" /> Tracked
              </span>
            ) : (
              <button
                onClick={onTrack}
                disabled={tracking}
                className="btn-secondary text-sm"
              >
                {tracking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                {tracking ? 'Tracking…' : 'Track Application'}
              </button>
            )
          )}
          <button
            onClick={handlePrepare}
            className="btn-secondary text-sm"
          >
            <GraduationCap className="h-4 w-4" /> Prepare for This Job
          </button>
          {job.application_url && !showApplyConfirm && (
            <button
              onClick={() => setShowApplyConfirm(true)}
              className="btn-primary text-sm ml-auto"
            >
              Apply on {sourceType === 'company_careers' ? 'Company Website' : 'Source Website'}
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Application info note */}
        {job.application_url && (
          <p className="text-xs text-slate-400 flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            CareerFlow helps you discover, understand, and prepare for this opportunity. The actual application is completed on the source website.
          </p>
        )}
      </div>
    </Modal>
  );
}
