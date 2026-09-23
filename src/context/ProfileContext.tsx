import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Profile } from '@/types';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (data: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        let p = await profileService.getProfile(user.id);
        if (!p && !cancelled) {
          p = await profileService.createProfile(user.id, user.email || '', {
            email: user.email || '',
          });
        }
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    const p = await profileService.getProfile(user.id);
    setProfile(p);
  };

  const update = async (data: Partial<Profile>) => {
    if (!user) return;
    const updated = await profileService.updateProfile(user.id, data);
    setProfile(updated);
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, update }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
