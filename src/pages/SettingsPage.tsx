import { useEffect, useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Shield, Bell, Trash2, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { recruitmentEventsService } from '@/services/recruitmentEventsService';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/Common';
import type { RecruitmentEvent, EmailProvider } from '@/types';

const PROVIDER_CONFIG: Record<EmailProvider, { label: string; icon: typeof Mail; color: string }> = {
  gmail: { label: 'Gmail', icon: Mail, color: 'text-red-600' },
  outlook: { label: 'Outlook', icon: Mail, color: 'text-blue-600' },
};

const EVENT_LABELS: Record<string, string> = {
  application_confirmation: 'Application Confirmation',
  assessment_invitation: 'Assessment Invitation',
  interview_invitation: 'Interview Invitation',
  interview_reschedule: 'Interview Reschedule',
  rejection: 'Rejection',
  offer: 'Offer',
  other: 'Other',
};

export function SettingsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<RecruitmentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const evts = await recruitmentEventsService.list(user.id);
        setEvents(evts);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleConfirm = async (id: string) => {
    await recruitmentEventsService.confirm(id);
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, confirmed: true } : e));
  };

  const handleDelete = async (id: string) => {
    await recruitmentEventsService.remove(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
      <PageHeader title="Settings" subtitle="Manage your account, email integrations, and preferences." />

      <div className="space-y-6">
        {/* Email Integration */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Email Integration</h3>
              <p className="text-sm text-slate-500">Connect your email to automatically detect recruitment updates.</p>
            </div>
          </div>

          {/* Integration state: not connected */}
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
            <p className="text-sm font-medium text-slate-700">No email connected</p>
            <p className="mt-1 text-sm text-slate-500">
              CareerFlow can detect recruitment-related emails — application confirmations, assessment
              invitations, interview schedules, rejections, and offers — and link them to your tracked
              applications. Your email is never accessed without your explicit permission.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(['gmail', 'outlook'] as EmailProvider[]).map((provider) => {
                const config = PROVIDER_CONFIG[provider];
                return (
                  <div key={provider} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <config.icon className={`h-5 w-5 ${config.color}`} />
                      <span className="font-medium text-slate-900">{config.label}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Connect with OAuth to import recruitment emails. Requires your explicit authorization.
                    </p>
                    <button
                      disabled
                      className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed"
                    >
                      Coming soon
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-700">How email integration will work:</p>
            {[
              'You authorize CareerFlow to access recruitment-related emails only.',
              'The system identifies emails matching known recruitment patterns (confirmations, invitations, rejections, offers).',
              'Detected events appear here for your review before being applied to your applications.',
              'You confirm or dismiss each detected event — nothing is automatic without your approval.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Recruitment events */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Recruitment Updates</h3>
          <p className="text-sm text-slate-500 mb-4">Detected recruitment emails and manual events.</p>

          {events.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title="No recruitment updates"
              description="Connect your email to automatically detect recruitment messages, or events will appear here once detected."
            />
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${event.confirmed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {event.confirmed ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{event.subject || EVENT_LABELS[event.event_type] || 'Recruitment event'}</p>
                      <p className="text-xs text-slate-500 truncate">{event.snippet}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="badge bg-slate-100 text-slate-600">{EVENT_LABELS[event.event_type] || event.event_type}</span>
                        <span className="text-xs text-slate-400">{event.source}</span>
                        {event.confirmed && <span className="text-xs text-emerald-600">Confirmed</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!event.confirmed && (
                      <button onClick={() => handleConfirm(event.id)} className="btn-ghost text-xs text-emerald-600">
                        Confirm
                      </button>
                    )}
                    <button onClick={() => handleDelete(event.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-error-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy & Security */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Privacy & Security</h3>
              <p className="text-sm text-slate-500">Your data is private and secured with row-level security (RLS).</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
              Your profile, applications, and preparation data are only visible to you.
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
              Email access requires explicit OAuth authorization — CareerFlow never accesses your inbox without permission.
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
              No fake data — all statistics shown are from your actual activity.
            </div>
          </div>
        </div>

        {/* Data principles */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">CareerFlow Data Principles</h3>
          <div className="space-y-2">
            {[
              'Real data only — no fabricated statistics, jobs, or applications.',
              'Job listings come from legitimate, official sources only.',
              'Empty states are clearly distinguished from real data.',
              'Application links direct you to the official application page.',
            ].map((principle, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <AlertCircle className="mt-0.5 h-4 w-4 text-brand-500 shrink-0" />
                {principle}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
