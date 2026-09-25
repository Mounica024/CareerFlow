import { NavLink, useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Search,
  Bookmark,
  ClipboardList,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { ProfileSetupModal } from '@/components/ProfileSetupModal';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/jobs', label: 'Find Jobs', icon: Search, end: false },
  { to: '/app/saved', label: 'Saved Jobs', icon: Bookmark, end: false },
  { to: '/app/applications', label: 'Applications', icon: ClipboardList, end: false },
  { to: '/app/preparation', label: 'Preparation', icon: GraduationCap, end: false },
  { to: '/app/profile', label: 'Profile', icon: User, end: false },
  { to: '/app/settings', label: 'Settings', icon: Settings, end: false },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { profile, needsSetup, setNeedsSetup } = useProfile();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Briefcase className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">CareerFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{profile?.full_name || 'User'}</p>
            <p className="truncate text-xs text-slate-400">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl animate-slide-in">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-slate-900">CareerFlow</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <ProfileSetupModal
        open={needsSetup}
        onClose={() => setNeedsSetup(false)}
      />
    </div>
  );
}
