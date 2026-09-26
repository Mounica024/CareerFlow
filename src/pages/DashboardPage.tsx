import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  UserCircle,
  Search,
  Bookmark,
  ClipboardList,
  GraduationCap,
  Mail,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { profileService } from '@/services/profileService';
import { applicationsService, STATUS_LABELS, STATUS_COLORS } from '@/services/applicationsService';
import { recruitmentEventsService } from '@/services/recruitmentEventsService';
import { preparationService } from '@/services/preparationService';
import { jobProvider } from '@/services/jobProvider';
import { matchingEngine } from '@/services/matchingEngine';
import { LoadingSpinner, EmptyState } from '@/components/Common';
import type { Application, RecruitmentEvent, PreparationProgress, Job, JobMatchResult } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [applications, setApplications] = useState<Application[]>([]);
  const [recruitmentEvents, setRecruitmentEvents] = useState<RecruitmentEvent[]>([]);
  const [preparation, setPreparation] = useState<PreparationProgress[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<{ job: Job; match: JobMatchResult }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const [apps, events, prep] = await Promise.all([
          applicationsService.list(user.id),
          recruitmentEventsService.list(user.id),
          preparationService.list(user.id),
        ]);
        if (!cancelled) {
          setApplications(apps);
          setRecruitmentEvents(events);
          setPreparation(prep);
        }
      } catch {
        // silent — dashboard shows empty states
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Fetch recommended jobs when profile is available
  useEffect(() => {
    if (!profile || profile.skills.length === 0) return;
    let cancelled = false;

    (async () => {
      setLoadingJobs(true);
      try {
        const query = profile.preferred_roles.length > 0
          ? profile.preferred_roles[0]
          : profile.skills.slice(0, 2).join(' ');
        const location = profile.preferred_locations.length > 0 ? profile.preferred_locations[0] : undefined;
        const result = await jobProvider.search({
          query,
          location,
          results_per_page: 10,
        });
        if (cancelled) return;
        if (result.jobs.length > 0) {
          const matched = result.jobs
            .map((job) => ({ job, match: matchingEngine.calculateMatch(profile, job) }))
            .filter((m) => m.match.status !== 'unable_to_determine')
            .sort((a, b) => (b.match.match_percentage ?? -1) - (a.match.match_percentage ?? -1))
            .slice(0, 3);
          setRecommendedJobs(matched);
        }
      } catch {
        // silent — recommended section just won't show
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={<UserCircle className="h-6 w-6" />}
        title="Profile not loaded"
        description="We couldn't load your profile. Try refreshing the page."
      />
    );
  }

  const completion = profileService.calculateCompletion(profile);
  const savedApplications = applications.filter((a) => a.status === 'saved');
  const activeApplications = applications.filter(
    (a) => a.status !== 'saved' && a.status !== 'rejected' && a.status !== 'offer'
  );
  const upcomingEvents = recruitmentEvents.filter((e) => !e.confirmed).slice(0, 3);
  const completedPrep = preparation.filter((p) => p.status === 'completed').length;

  const stats = [
    { label: 'Profile Completion', value: `${completion}%`, icon: UserCircle, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Saved Jobs', value: savedApplications.length, icon: Bookmark, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Active Applications', value: activeApplications.length, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Prep Completed', value: completedPrep, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {profile.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here's an overview of your career progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile completion bar */}
      {completion < 100 && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Complete your profile</h3>
              <p className="mt-0.5 text-sm text-slate-500">A complete profile improves job matching accuracy.</p>
            </div>
            <Link to="/app/profile" className="btn-secondary text-xs">
              Update <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>
      )}

      {/* Recommended Jobs */}
      {profile && profile.skills.length > 0 && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              <h3 className="font-semibold text-slate-900">Recommended Jobs for You</h3>
            </div>
            <Link to="/app/jobs" className="text-xs text-brand-600 font-medium hover:text-brand-700">
              Find more
            </Link>
          </div>
          {loadingJobs ? (
            <div className="flex h-20 items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="space-y-2">
              {recommendedJobs.map(({ job, match }) => (
                <Link
                  key={job.id}
                  to="/app/jobs"
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 transition-all hover:shadow-md hover:border-brand-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{job.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {job.company}
                        {job.location && <><span className="text-slate-300 mx-1">•</span><MapPin className="h-3 w-3 inline" /> {job.location}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {match.match_percentage !== null && (
                      <span className={`text-xs font-semibold ${
                        match.status === 'strong_match' ? 'text-emerald-600'
                          : match.status === 'partial_match' ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}>
                        {match.match_percentage}%
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No strong matches right now. Try updating your profile with more skills and preferred roles.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Active applications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Active Applications</h3>
            <Link to="/app/applications" className="text-xs text-brand-600 font-medium hover:text-brand-700">
              View all
            </Link>
          </div>
          {activeApplications.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No active applications"
              description="Search for jobs and start tracking your applications."
              action={<Link to="/app/jobs" className="btn-primary text-xs">Find jobs</Link>}
            />
          ) : (
            <div className="space-y-2">
              {activeApplications.slice(0, 4).map((app) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{app.job_data.title}</p>
                    <p className="truncate text-xs text-slate-500">{app.job_data.company}</p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[app.status]} shrink-0`}>{STATUS_LABELS[app.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved jobs */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Saved Jobs</h3>
            <Link to="/app/saved" className="text-xs text-brand-600 font-medium hover:text-brand-700">
              View all
            </Link>
          </div>
          {savedApplications.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-6 w-6" />}
              title="No saved jobs yet"
              description="Track jobs you're interested in to review them later."
              action={<Link to="/app/jobs" className="btn-primary text-xs">Search jobs</Link>}
            />
          ) : (
            <div className="space-y-2">
              {savedApplications.slice(0, 4).map((saved) => (
                <div key={saved.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{saved.job_data.title}</p>
                    <p className="truncate text-xs text-slate-500">{saved.job_data.company}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recruitment updates */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recruitment Updates</h3>
            <Link to="/app/settings" className="text-xs text-brand-600 font-medium hover:text-brand-700">
              Settings
            </Link>
          </div>
          {recruitmentEvents.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-6 w-6" />}
              title="No recruitment updates"
              description="Email integration (Gmail/Outlook) is not yet connected. This feature will be available in a future update."
              action={<Link to="/app/settings" className="btn-secondary text-xs">View settings</Link>}
            />
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{event.subject}</p>
                    <p className="truncate text-xs text-slate-500">{event.snippet}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preparation progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Preparation Progress</h3>
            <Link to="/app/preparation" className="text-xs text-brand-600 font-medium hover:text-brand-700">
              View all
            </Link>
          </div>
          {preparation.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="Start preparing"
              description="Get job-driven preparation recommendations based on your tracked jobs."
              action={<Link to="/app/preparation" className="btn-primary text-xs">Start preparation</Link>}
            />
          ) : (
            <div className="space-y-2">
              {preparation.slice(0, 4).map((prep) => (
                <div key={prep.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {prep.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-amber-400 shrink-0" />
                    )}
                    <span className="truncate text-sm text-slate-700">{prep.topic}</span>
                  </div>
                  <span className="text-xs text-slate-400 capitalize shrink-0">{prep.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <h3 className="mb-3 font-semibold text-slate-900">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: '/app/profile', icon: UserCircle, label: 'Complete profile' },
            { to: '/app/jobs', icon: Search, label: 'Search jobs' },
            { to: '/app/preparation', icon: TrendingUp, label: 'Start prep' },
            { to: '/app/settings', icon: Mail, label: 'Settings' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="card flex items-center gap-3 p-4 transition-all hover:shadow-md hover:border-brand-200"
            >
              <action.icon className="h-5 w-5 text-brand-600" />
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
