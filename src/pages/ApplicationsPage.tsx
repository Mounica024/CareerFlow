import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ExternalLink, Trash2, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { applicationsService, APPLICATION_STATUSES, STATUS_LABELS, STATUS_COLORS } from '@/services/applicationsService';
import { matchingEngine } from '@/services/matchingEngine';
import { JobDetailsModal } from '@/components/JobDetailsModal';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/Common';
import { Modal } from '@/components/Modal';
import type { Application, ApplicationStatus, ApplicationEvent, Job, JobMatchResult } from '@/types';

export function ApplicationsPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [jobDetailsJob, setJobDetailsJob] = useState<Job | null>(null);
  const [jobDetailsMatch, setJobDetailsMatch] = useState<JobMatchResult | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const apps = await applicationsService.list(user.id);
      setApplications(apps);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (appId: string, status: ApplicationStatus) => {
    try {
      await applicationsService.updateStatus(appId, status);
      await load();
      if (selectedApp?.id === appId) {
        setSelectedApp((prev) => prev ? { ...prev, status } : null);
      }
    } catch {
      // keep current state on error
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await applicationsService.remove(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      setSelectedApp(null);
    } catch {
      // keep current state on error
    }
  };

  const openDetail = async (app: Application) => {
    setSelectedApp(app);
    setEventsLoading(true);
    try {
      const evts = await applicationsService.getEvents(app.id);
      setEvents(evts);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const openJobDetails = (app: Application) => {
    const job = app.job_data as unknown as Job;
    const match = profile ? matchingEngine.calculateMatch(profile, job) : null;
    setJobDetailsMatch(match);
    setJobDetailsJob(job);
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
        title="Applications"
        subtitle={`${applications.length} application${applications.length !== 1 ? 's' : ''} tracked`}
        action={
          applications.length > 0 && (
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button onClick={() => setView('board')} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${view === 'board' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900'}`}>Board</button>
              <button onClick={() => setView('list')} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900'}`}>List</button>
            </div>
          )
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No applications tracked yet"
          description="When you apply to a job, track it here to follow every stage from applied to offer."
          action={<Link to="/app/jobs" className="btn-primary">Find jobs</Link>}
        />
      ) : view === 'board' ? (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {APPLICATION_STATUSES.map((status) => {
              const apps = applications.filter((a) => a.status === status);
              return (
                <div key={status} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                    <span className="text-xs text-slate-400">{apps.length}</span>
                  </div>
                  <div className="space-y-2 min-h-32">
                    {apps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => openDetail(app)}
                        className="card w-full p-3 text-left transition-all hover:shadow-md hover:border-brand-200"
                      >
                        <p className="font-medium text-sm text-slate-900 truncate">{app.job_data.title}</p>
                        <p className="text-xs text-slate-500 truncate">{app.job_data.company}</p>
                        {app.applied_at && (
                          <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => openDetail(app)}
              className="card flex w-full items-center justify-between p-4 text-left transition-all hover:shadow-md hover:border-brand-200"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{app.job_data.title}</p>
                <p className="text-sm text-slate-500 truncate">{app.job_data.company}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`badge ${STATUS_COLORS[app.status]}`}>{STATUS_LABELS[app.status]}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        maxWidth="max-w-2xl"
      >
        {selectedApp && (
          <div className="space-y-5">
            {/* Job info */}
            <div>
              <h3 className="font-semibold text-slate-900">{selectedApp.job_data.title}</h3>
              <p className="text-sm text-slate-500">{selectedApp.job_data.company}</p>
              <button
                onClick={() => openJobDetails(selectedApp)}
                className="mt-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                View full job details
              </button>
              {selectedApp.job_data.application_url && (
                <a
                  href={selectedApp.job_data.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 ml-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  <ExternalLink className="h-4 w-4" /> Open application page
                </a>
              )}
            </div>

            {/* Status selector */}
            <div>
              <label className="label-field">Application status</label>
              <div className="flex flex-wrap gap-2">
                {APPLICATION_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedApp.id, status)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedApp.status === status
                        ? STATUS_COLORS[status] + ' border-transparent ring-2 ring-brand-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Timeline</h4>
              {eventsLoading ? (
                <LoadingSpinner size="sm" />
              ) : events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event, i) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-brand-500' : 'bg-slate-300'}`} />
                        {i < events.length - 1 && <div className="w-px flex-1 bg-slate-200" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-slate-900">{event.title}</p>
                        {event.description && <p className="text-xs text-slate-500">{event.description}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(event.occurred_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No timeline events yet.</p>
              )}
            </div>

            {/* Delete */}
            <div className="border-t border-slate-200 pt-4">
              <button onClick={() => handleDelete(selectedApp.id)} className="btn-danger text-xs">
                <Trash2 className="h-3.5 w-3.5" /> Remove application
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={jobDetailsJob}
        match={jobDetailsMatch}
        isTracked={jobDetailsJob ? applications.some((a) => a.job_id === jobDetailsJob.id && a.status !== 'saved') : false}
        onClose={() => setJobDetailsJob(null)}
      />
    </div>
  );
}
