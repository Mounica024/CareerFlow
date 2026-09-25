import { useState } from 'react';
import { User, Upload } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { PageHeader, LoadingSpinner } from '@/components/Common';
import { ProfileSetupModal } from '@/components/ProfileSetupModal';

export function ProfilePage() {
  const { profile, loading } = useProfile();
  const [editing, setEditing] = useState(false);

  if (loading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const skillTags = [...(profile.skills || []), ...(profile.programming_languages || [])];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Profile"
        subtitle="Your profile information drives job matching and recommendations."
        action={<button onClick={() => setEditing(true)} className="btn-primary"><User className="h-4 w-4" /> Edit profile</button>}
      />

      <div className="space-y-6">
        {/* Basic info */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Basic Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoField label="Full name" value={profile.full_name} />
            <InfoField label="Email" value={profile.email} />
            <InfoField label="Phone" value={profile.phone} />
            <InfoField label="Location" value={profile.location} />
          </div>
        </div>

        {/* Education */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Education</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoField label="Degree" value={profile.degree} />
            <InfoField label="Branch" value={profile.branch} />
            <InfoField label="Graduation year" value={profile.graduation_year?.toString()} />
            <InfoField label="College" value={profile.college} />
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Job Preferences</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Preferred roles</p>
              <TagList tags={profile.preferred_roles} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Preferred locations</p>
              <TagList tags={profile.preferred_locations} />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Skills</h3>
          <TagList tags={skillTags} />
          {skillTags.length === 0 && <p className="text-sm text-slate-400">No skills added yet. Edit your profile to add them.</p>}
        </div>

        {/* Certifications */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Certifications</h3>
          {profile.certifications.length > 0 ? (
            <div className="space-y-2">
              {profile.certifications.map((cert, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">{cert.name}</span>
                  {cert.issuer && <span className="text-xs text-slate-400">{cert.issuer}</span>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No certifications added yet.</p>}
        </div>

        {/* Projects */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Projects</h3>
          {profile.projects.length > 0 ? (
            <div className="space-y-3">
              {profile.projects.map((proj, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{proj.title}</p>
                  {proj.description && <p className="mt-1 text-sm text-slate-500">{proj.description}</p>}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="mt-2"><TagList tags={proj.technologies} /></div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No projects added yet.</p>}
        </div>

        {/* Experience */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Experience</h3>
          {profile.experience.length > 0 ? (
            <div className="space-y-3">
              {profile.experience.map((exp, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{exp.role}</span>
                    {exp.duration && <span className="text-xs text-slate-400">{exp.duration}</span>}
                  </div>
                  <p className="text-sm text-slate-500">{exp.company}</p>
                  {exp.description && <p className="mt-1 text-sm text-slate-500">{exp.description}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No experience added yet.</p>}
        </div>

        {/* Resume */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Resume</h3>
          {profile.resume_url ? (
            <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5">
              <Upload className="h-4 w-4" /> View resume
            </a>
          ) : <p className="text-sm text-slate-400">No resume link added yet.</p>}
        </div>
      </div>

      <ProfileSetupModal open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || '—'}</p>
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200">{tag}</span>
      ))}
    </div>
  );
}
