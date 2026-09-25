import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Zap, Plug, Info, AlertCircle, MapPin, ChevronDown, Loader2, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { jobProvider } from '@/services/jobProvider';
import { matchingEngine } from '@/services/matchingEngine';
import { applicationsService } from '@/services/applicationsService';
import { JobCard } from '@/components/JobCard';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/Common';
import type { Job, JobSearchFilters, EmploymentType, ExperienceLevel, WorkArrangement, JobSearchResult } from '@/types';

export function FindJobsPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [trackingJobId, setTrackingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [company, setCompany] = useState('');

  const [filters, setFilters] = useState<JobSearchFilters>({
    query: '',
    employment_type: undefined,
    experience_level: undefined,
    location: '',
    work_arrangement: undefined,
    skills: [],
    sort: 'relevance',
    page: 1,
    results_per_page: 10,
  });

  const loadSavedIds = useCallback(async () => {
    if (!user) return;
    try {
      const apps = await applicationsService.list(user.id);
      setSavedIds(new Set(apps.filter((a) => a.status === 'saved').map((a) => a.job_id)));
      setTrackedIds(new Set(apps.map((a) => a.job_id)));
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    loadSavedIds();
  }, [loadSavedIds]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const buildSearchQuery = () => {
    const query = filters.query || '';
    const companyTrim = company.trim();
    if (companyTrim && query.trim()) {
      return `${query.trim()} ${companyTrim}`;
    }
    if (companyTrim) {
      return companyTrim;
    }
    return query.trim();
  };

  const handleSearch = async (resetPage = true, overridePage?: number) => {
    const searchPage = overridePage ?? (resetPage ? 1 : page);
    if (resetPage) {
      setPage(1);
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    setNotConfigured(false);

    try {
      const combinedQuery = buildSearchQuery();
      const result: JobSearchResult = await jobProvider.search({
        ...filters,
        query: combinedQuery,
        page: searchPage,
        results_per_page: 10,
      });

      if (result.configured === false) {
        setNotConfigured(true);
        setJobs([]);
        setHasMore(false);
        setTotal(0);
      } else if (result.error) {
        setError(result.error);
        setJobs([]);
        setHasMore(false);
        setTotal(0);
      } else {
        const newJobs = resetPage ? result.jobs : [...jobs, ...result.jobs.filter((j) => !jobs.some((existing) => existing.id === j.id))];
        setJobs(newJobs);
        setHasMore(result.has_more);
        setTotal(result.total);
      }
    } catch {
      setError('Something went wrong while searching. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    await handleSearch(false, nextPage);
  };

  const handleSave = async (job: Job) => {
    if (!user || !profile) return;
    try {
      const match = matchingEngine.calculateMatch(profile, job);
      await applicationsService.create(user.id, job, 'saved');
      setSavedIds((prev) => new Set(prev).add(job.id));
      setTrackedIds((prev) => new Set(prev).add(job.id));
    } catch {
      setToast({ msg: 'Failed to save job. Please try again.', type: 'error' });
    }
  };

  const handleRemove = async (jobId: string) => {
    if (!user) return;
    try {
      const apps = await applicationsService.list(user.id);
      const app = apps.find((a) => a.job_id === jobId);
      if (app) {
        await applicationsService.remove(app.id);
      }
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch {
      setToast({ msg: 'Failed to remove saved job.', type: 'error' });
    }
  };

  const handleTrack = async (job: Job) => {
    if (!user) {
      setToast({ msg: 'You must be signed in to track a job.', type: 'error' });
      return;
    }
    if (trackedIds.has(job.id)) return;
    setTrackingJobId(job.id);
    try {
      await applicationsService.create(user.id, job, 'applied');
      setTrackedIds((prev) => new Set(prev).add(job.id));
      setToast({ msg: 'Application tracked successfully.', type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to track job.';
      setToast({ msg, type: 'error' });
    } finally {
      setTrackingJobId(null);
    }
  };

  const hasProfile = profile && (profile.skills.length > 0 || profile.programming_languages.length > 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Find Jobs"
        subtitle="Search real job opportunities and check your eligibility."
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 shadow-lg border animate-slide-up ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-error-50 border-error-200 text-error-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Provider status banner */}
      {notConfigured ? (
        <div className="card mb-6 border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Job search isn't connected yet</p>
              <p className="mt-0.5 text-sm text-slate-600">
                Add the Adzuna API credentials to enable real job search. CareerFlow never shows fake or fabricated job listings.
              </p>
            </div>
          </div>
        </div>
      ) : (
        !searched && (
          <div className="card mb-6 border-brand-200 bg-brand-50/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Real job search powered by Adzuna</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Search across real job listings from the Adzuna network. Results include legitimate application links — CareerFlow never fabricates jobs.
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Primary search */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.query || ''}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter job title or keyword (e.g. Software Engineer)"
              className="input-field pl-11 text-base"
            />
          </div>
          <button onClick={() => handleSearch()} disabled={loading} className="btn-primary sm:px-8">
            {loading ? <LoadingSpinner size="sm" /> : <><Search className="h-4 w-4" /> Search Jobs</>}
          </button>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showFilters ? 'Hide filters' : 'Refine your search (optional)'}
        </button>

        {showFilters && (
          <div className="mt-4 border-t border-slate-200 pt-4 animate-slide-up">
            <p className="mb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Optional filters</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label-field">
                  <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> Company</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. TCS, Infosys, Amazon"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> Location</span>
                </label>
                <input
                  type="text"
                  value={filters.location || ''}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. Bangalore, India"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">Employment type</label>
                <select
                  className="input-field"
                  value={filters.employment_type || ''}
                  onChange={(e) => setFilters({ ...filters, employment_type: (e.target.value || undefined) as EmploymentType | undefined })}
                >
                  <option value="">Any</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="label-field">Experience level</label>
                <select
                  className="input-field"
                  value={filters.experience_level || ''}
                  onChange={(e) => setFilters({ ...filters, experience_level: (e.target.value || undefined) as ExperienceLevel | undefined })}
                >
                  <option value="">Any</option>
                  <option value="entry_level">Entry Level</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div>
                <label className="label-field">Work arrangement</label>
                <select
                  className="input-field"
                  value={filters.work_arrangement || ''}
                  onChange={(e) => setFilters({ ...filters, work_arrangement: (e.target.value || undefined) as WorkArrangement | undefined })}
                >
                  <option value="">Any</option>
                  <option value="remote">Remote</option>
                  <option value="on_site">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="label-field">Sort by</label>
                <select
                  className="input-field"
                  value={filters.sort || 'relevance'}
                  onChange={(e) => setFilters({ ...filters, sort: (e.target.value) as JobSearchFilters['sort'] })}
                >
                  <option value="relevance">Relevance</option>
                  <option value="latest">Latest</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile warning */}
      {hasProfile === false && (
        <div className="card mb-6 border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700">
              Add skills and programming languages to your profile to get match scores on job listings.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="card mb-6 border-error-200 bg-error-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-error-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">Search error</p>
              <p className="mt-0.5 text-sm text-slate-600">{error}</p>
              <button onClick={() => handleSearch()} className="mt-2 btn-secondary text-xs">Try again</button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : searched ? (
        <>
          {jobs.length > 0 && (
            <p className="mb-4 text-sm text-slate-500">
              {total > 0 ? `${total.toLocaleString()} jobs found` : `${jobs.length} jobs found`}
            </p>
          )}
          {jobs.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job) => {
                  const match = profile ? matchingEngine.calculateMatch(profile, job) : null;
                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      match={match}
                      isSaved={savedIds.has(job.id)}
                      isTracked={trackedIds.has(job.id)}
                      tracking={trackingJobId === job.id}
                      onSave={() => handleSave(job)}
                      onRemove={() => handleRemove(job.id)}
                      onTrack={() => handleTrack(job)}
                    />
                  );
                })}
              </div>
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn-secondary"
                  >
                    {loadingMore ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Loading more…</>
                    ) : (
                      <>Load more <ChevronDown className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : !error && !notConfigured ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No matching jobs found"
              description={company.trim()
                ? `No matching jobs found for this company. Try a different company name or keyword.`
                : "Try adjusting your search terms, location, or filters."}
            />
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={<Zap className="h-6 w-6" />}
          title="Start your job search"
          description="Enter the job you want. CareerFlow will find real opportunities from different companies and locations."
        />
      )}
    </div>
  );
}
