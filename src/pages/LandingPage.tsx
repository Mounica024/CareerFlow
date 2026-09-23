import { Link } from 'react-router-dom';
import { Briefcase, Search, Bookmark, ClipboardList, GraduationCap } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">CareerFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/signup" className="btn-primary">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 border border-brand-100">
          <span className="flex h-2 w-2 rounded-full bg-brand-500" />
          Built for college students & fresh graduates
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Your career, <span className="text-brand-600">in motion</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Discover real job opportunities, check your eligibility, track every application, and prepare
          for interviews — all in one professional workspace.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/signup" className="btn-primary px-6 py-3 text-base">Create your account</Link>
          <Link to="/login" className="btn-secondary px-6 py-3 text-base">Sign in</Link>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Search, title: 'Find Jobs', desc: 'Search real opportunities with smart filters and eligibility matching.' },
            { icon: Bookmark, title: 'Save & Compare', desc: 'Shortlist jobs, compare them side by side, and move them to tracking.' },
            { icon: ClipboardList, title: 'Track Applications', desc: 'Follow every stage from applied to offer with a visual timeline.' },
            { icon: GraduationCap, title: 'Prepare Smart', desc: 'Get preparation tailored to each job\'s requirements and your weak areas.' },
          ].map((feature) => (
            <div key={feature.title} className="card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        CareerFlow — Your career, in motion
      </footer>
    </div>
  );
}
