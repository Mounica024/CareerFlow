import { useState, useRef, useEffect, type FormEvent } from 'react';
import { User, Plus, X, Save, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { PageHeader, LoadingSpinner } from '@/components/Common';
import type { Certification, Project, ExperienceEntry } from '@/types';

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, update } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    degree: '',
    branch: '',
    graduation_year: '',
    college: '',
    location: '',
    preferred_roles: '',
    preferred_locations: '',
    skills: '',
    programming_languages: '',
    certifications: [] as Certification[],
    projects: [] as Project[],
    experience: [] as ExperienceEntry[],
    resume_url: '',
  });

  const startEditing = () => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      degree: profile.degree || '',
      branch: profile.branch || '',
      graduation_year: profile.graduation_year?.toString() || '',
      college: profile.college || '',
      location: profile.location || '',
      preferred_roles: (profile.preferred_roles || []).join(', '),
      preferred_locations: (profile.preferred_locations || []).join(', '),
      skills: (profile.skills || []).join(', '),
      programming_languages: (profile.programming_languages || []).join(', '),
      certifications: profile.certifications || [],
      projects: profile.projects || [],
      experience: profile.experience || [],
      resume_url: profile.resume_url || '',
    });
    setEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await update({
        full_name: form.full_name,
        phone: form.phone,
        degree: form.degree,
        branch: form.branch,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year, 10) : null,
        college: form.college,
        location: form.location,
        preferred_roles: form.preferred_roles.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_locations: form.preferred_locations.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        programming_languages: form.programming_languages.split(',').map((s) => s.trim()).filter(Boolean),
        certifications: form.certifications,
        projects: form.projects,
        experience: form.experience,
        resume_url: form.resume_url,
      });
      setEditing(false);
      setSavedMsg(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedMsg(false), 3000);
    } catch {
      setErrorMsg(true);
      setTimeout(() => setErrorMsg(false), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Edit Profile"
          subtitle="Update your information to improve job matching."
          action={
            <button onClick={() => setEditing(false)} className="btn-ghost">
              <X className="h-4 w-4" /> Cancel
            </button>
          }
        />

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic info */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Full name</label>
                <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input className="input-field bg-slate-50" value={form.email} disabled />
              </div>
              <div>
                <label className="label-field">Phone</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" />
              </div>
              <div>
                <label className="label-field">Location</label>
                <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State" />
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Education</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Degree</label>
                <input className="input-field" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="B.Tech / B.S." />
              </div>
              <div>
                <label className="label-field">Branch / Specialization</label>
                <input className="input-field" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="Computer Science" />
              </div>
              <div>
                <label className="label-field">Graduation year</label>
                <input className="input-field" type="number" value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} placeholder="2026" />
              </div>
              <div>
                <label className="label-field">College</label>
                <input className="input-field" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="Your college name" />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Job Preferences</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Preferred roles (comma-separated)</label>
                <input className="input-field" value={form.preferred_roles} onChange={(e) => setForm({ ...form, preferred_roles: e.target.value })} placeholder="Software Engineer, Data Analyst" />
              </div>
              <div>
                <label className="label-field">Preferred locations (comma-separated)</label>
                <input className="input-field" value={form.preferred_locations} onChange={(e) => setForm({ ...form, preferred_locations: e.target.value })} placeholder="Remote, Bangalore, Mumbai" />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Skills</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Skills (comma-separated)</label>
                <input className="input-field" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, SQL, Docker, Communication" />
              </div>
              <div>
                <label className="label-field">Programming languages (comma-separated)</label>
                <input className="input-field" value={form.programming_languages} onChange={(e) => setForm({ ...form, programming_languages: e.target.value })} placeholder="Python, Java, JavaScript" />
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Certifications</h3>
              <button type="button" onClick={() => setForm({ ...form, certifications: [...form.certifications, { name: '' }] })} className="btn-ghost text-xs">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {form.certifications.map((cert, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input-field" placeholder="Certification name" value={cert.name} onChange={(e) => { const arr = [...form.certifications]; arr[i] = { ...arr[i], name: e.target.value }; setForm({ ...form, certifications: arr }); }} />
                  <input className="input-field max-w-32" placeholder="Issuer" value={cert.issuer || ''} onChange={(e) => { const arr = [...form.certifications]; arr[i] = { ...arr[i], issuer: e.target.value }; setForm({ ...form, certifications: arr }); }} />
                  <button type="button" onClick={() => setForm({ ...form, certifications: form.certifications.filter((_, idx) => idx !== i) })} className="btn-ghost text-error-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {form.certifications.length === 0 && <p className="text-sm text-slate-400">No certifications added.</p>}
            </div>
          </div>

          {/* Projects */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Projects</h3>
              <button type="button" onClick={() => setForm({ ...form, projects: [...form.projects, { title: '' }] })} className="btn-ghost text-xs">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <div className="space-y-4">
              {form.projects.map((proj, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input className="input-field" placeholder="Project title" value={proj.title} onChange={(e) => { const arr = [...form.projects]; arr[i] = { ...arr[i], title: e.target.value }; setForm({ ...form, projects: arr }); }} />
                    <button type="button" onClick={() => setForm({ ...form, projects: form.projects.filter((_, idx) => idx !== i) })} className="btn-ghost text-error-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <textarea className="input-field" rows={2} placeholder="Description" value={proj.description || ''} onChange={(e) => { const arr = [...form.projects]; arr[i] = { ...arr[i], description: e.target.value }; setForm({ ...form, projects: arr }); }} />
                  <input className="input-field" placeholder="Technologies (comma-separated)" value={(proj.technologies || []).join(', ')} onChange={(e) => { const arr = [...form.projects]; arr[i] = { ...arr[i], technologies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }; setForm({ ...form, projects: arr }); }} />
                </div>
              ))}
              {form.projects.length === 0 && <p className="text-sm text-slate-400">No projects added.</p>}
            </div>
          </div>

          {/* Experience */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Experience</h3>
              <button type="button" onClick={() => setForm({ ...form, experience: [...form.experience, { company: '', role: '' }] })} className="btn-ghost text-xs">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <div className="space-y-4">
              {form.experience.map((exp, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input className="input-field" placeholder="Role" value={exp.role} onChange={(e) => { const arr = [...form.experience]; arr[i] = { ...arr[i], role: e.target.value }; setForm({ ...form, experience: arr }); }} />
                    <input className="input-field" placeholder="Company" value={exp.company} onChange={(e) => { const arr = [...form.experience]; arr[i] = { ...arr[i], company: e.target.value }; setForm({ ...form, experience: arr }); }} />
                    <button type="button" onClick={() => setForm({ ...form, experience: form.experience.filter((_, idx) => idx !== i) })} className="btn-ghost text-error-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <input className="input-field" placeholder="Duration (e.g., 3 months)" value={exp.duration || ''} onChange={(e) => { const arr = [...form.experience]; arr[i] = { ...arr[i], duration: e.target.value }; setForm({ ...form, experience: arr }); }} />
                  <textarea className="input-field" rows={2} placeholder="Description" value={exp.description || ''} onChange={(e) => { const arr = [...form.experience]; arr[i] = { ...arr[i], description: e.target.value }; setForm({ ...form, experience: arr }); }} />
                </div>
              ))}
              {form.experience.length === 0 && <p className="text-sm text-slate-400">No experience added.</p>}
            </div>
          </div>

          {/* Resume */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Resume</h3>
            <label className="label-field">Resume URL</label>
            <input className="input-field" value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} placeholder="Link to your resume (Google Drive, etc.)" />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save profile</>}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // View mode
  const skillTags = [...(profile.skills || []), ...(profile.programming_languages || [])];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Profile"
        subtitle="Your profile information drives job matching and recommendations."
        action={<button onClick={startEditing} className="btn-primary"><User className="h-4 w-4" /> Edit profile</button>}
      />

      {savedMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 animate-slide-up">
          Profile saved successfully.
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-slide-up">
          Failed to save profile. Please try again.
        </div>
      )}

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
