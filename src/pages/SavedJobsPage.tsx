import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, GitCompare, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { savedJobsService } from '@/services/savedJobsService';
import { applicationsService } from '@/services/applicationsService';
import { JobCard } from '@/components/JobCard';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/Common';
import { Modal } from '@/components/Modal';
import type { SavedJob, Job } from '@/types';

export function SavedJobsPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!user) return;
    try {
      const jobs = await savedJobsService.list(user.id);
      setSavedJobs(jobs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleRemove = async (jobId: string) => {
    if (!user) return;
    try {
      await savedJobsService.remove(user.id, jobId);
      setSavedJobs((prev) => prev.filter((s) => s.job_id !== jobId));
    } catch {
      // keep current state on error
    }
  };

  const handleTrack = async (job: Job) => {
    if (!user) return;
    try {
      await applicationsService.create(user.id, job, 'saved');
      await savedJobsService.remove(user.id, job.id);
      setSavedJobs((prev) => prev.filter((s) => s.job_id !== job.id));
    } catch {
      // keep current state on error
    }
  };

  const toggleCompare = (jobId: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else if (next.size < 3) {
        next.add(jobId);
      }
      return next;
    });
  };

  const compareJobs = savedJobs.filter((s) => compareIds.has(s.job_id));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Saved Jobs"
        subtitle={`${savedJobs.length} job${savedJobs.length !== 1 ? 's' : ''} shortlisted`}
        action={
          compareIds.size >= 2 ? (
            <button onClick={() => setCompareOpen(true)} className="btn-primary">
              <GitCompare className="h-4 w-4" /> Compare ({compareIds.size})
            </button>
          ) : undefined
        }
      />

      {savedJobs.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" />}
          title="No saved jobs yet"
          description="Save jobs from the Find Jobs page to compare and track them here."
          action={<Link to="/app/jobs" className="btn-primary">Find jobs <ArrowRight className="h-4 w-4" /></Link>}
        />
      ) : (
        <>
          {compareIds.size > 0 && compareIds.size < 2 && (
            <div className="card mb-4 border-brand-200 bg-brand-50/50 p-3 text-sm text-brand-700">
              Select at least 2 jobs to compare. {compareIds.size}/2 selected.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {savedJobs.map((saved) => (
              <div key={saved.id} className="relative">
                <button
                  onClick={() => toggleCompare(saved.job_id)}
                  className={`absolute right-3 top-3 z-10 rounded-lg border px-2 py-1 text-xs font-medium transition-all ${
                    compareIds.has(saved.job_id)
                      ? 'border-brand-300 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200'
                  }`}
                >
                  <GitCompare className="h-3 w-3 inline mr-1" />
                  {compareIds.has(saved.job_id) ? 'Selected' : 'Compare'}
                </button>
                <JobCard
                  job={saved.job_data}
                  match={saved.match_data}
                  isSaved
                  onRemove={() => handleRemove(saved.job_id)}
                  onTrack={() => handleTrack(saved.job_data)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Compare modal */}
      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Compare Jobs" maxWidth="max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-medium text-slate-500">Attribute</th>
                {compareJobs.map((job) => (
                  <th key={job.id} className="text-left py-2 px-4 font-semibold text-slate-900 min-w-48">
                    {job.job_data.title}
                    <p className="text-xs font-normal text-slate-500">{job.job_data.company}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Location', get: (j: Job) => j.location || '—' },
                { label: 'Employment', get: (j: Job) => j.employment_type.replace('_', ' ') },
                { label: 'Arrangement', get: (j: Job) => j.work_arrangement.replace('_', ' ') },
                { label: 'Experience', get: (j: Job) => j.experience_level.replace('_', ' ') },
                { label: 'Source', get: (j: Job) => j.job_source },
                { label: 'Deadline', get: (j: Job) => j.application_deadline ? new Date(j.application_deadline).toLocaleDateString() : '—' },
                { label: 'Skills', get: (j: Job) => j.skills.join(', ') || '—' },
                { label: 'Match %', get: (_j: Job, s?: SavedJob) => s?.match_data?.match_percentage !== null && s?.match_data?.match_percentage !== undefined ? `${s.match_data.match_percentage}%` : '—' },
              ].map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-medium text-slate-500">{row.label}</td>
                  {compareJobs.map((job) => (
                    <td key={job.id} className="py-2.5 px-4 text-slate-700 capitalize">
                      {row.get(job.job_data, job)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => setCompareOpen(false)} className="btn-secondary">Close</button>
        </div>
      </Modal>
    </div>
  );
}
