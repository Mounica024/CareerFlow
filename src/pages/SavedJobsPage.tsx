import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { applicationsService, STATUS_LABELS, STATUS_COLORS } from '@/services/applicationsService';
import { matchingEngine } from '@/services/matchingEngine';
import { JobCard } from '@/components/JobCard';
import { JobDetailsModal } from '@/components/JobDetailsModal';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/Common';
import type { Application, Job, JobMatchResult } from '@/types';

export function SavedJobsPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [savedApps, setSavedApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<JobMatchResult | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const apps = await applicationsService.list(user.id);
      setSavedApps(apps.filter((a) => a.status === 'saved'));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (appId: string) => {
    try {
      await applicationsService.remove(appId);
      setSavedApps((prev) => prev.filter((a) => a.id !== appId));
    } catch {
      // keep current state on error
    }
  };

  const handleTrack = async (app: Application) => {
    try {
      await applicationsService.updateStatus(app.id, 'applied');
      setSavedApps((prev) => prev.filter((a) => a.id !== app.id));
    } catch {
      // keep current state on error
    }
  };

  const openJobDetails = (job: Job) => {
    const match = profile ? matchingEngine.calculateMatch(profile, job) : null;
    setSelectedMatch(match);
    setSelectedJob(job);
  };

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
        subtitle={`${savedApps.length} job${savedApps.length !== 1 ? 's' : ''} shortlisted`}
      />

      {savedApps.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" />}
          title="No saved jobs yet"
          description="Track jobs from the Find Jobs page to review and compare them here."
          action={<Link to="/app/jobs" className="btn-primary">Find jobs <ArrowRight className="h-4 w-4" /></Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {savedApps.map((app) => (
            <div key={app.id} className="relative">
              <button
                onClick={() => handleTrack(app)}
                className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-all hover:border-brand-200 hover:text-brand-700"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Move to Applied
              </button>
              <JobCard
                job={app.job_data as unknown as Job}
                match={profile ? matchingEngine.calculateMatch(profile, app.job_data as unknown as Job) : null}
                isSaved
                onRemove={() => handleRemove(app.id)}
                onView={() => openJobDetails(app.job_data as unknown as Job)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        match={selectedMatch}
        isSaved={true}
        onSave={() => {}}
        onRemove={() => {
          if (selectedJob) {
            const app = savedApps.find((a) => a.job_id === selectedJob.id);
            if (app) handleRemove(app.id);
          }
          setSelectedJob(null);
        }}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
