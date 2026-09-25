import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Plus, X, Save, Upload, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useProfile } from '@/context/ProfileContext';
import type { Certification, Project, ExperienceEntry, Profile } from '@/types';

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  degree: string;
  branch: string;
  graduation_year: string;
  college: string;
  location: string;
  preferred_roles: string;
  preferred_locations: string;
  skills: string;
  programming_languages: string;
  certifications: Certification[];
  projects: Project[];
  experience: ExperienceEntry[];
  resume_url: string;
}

function emptyForm(email: string): FormState {
  return {
    full_name: '',
    email,
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
    certifications: [],
    projects: [],
    experience: [],
    resume_url: '',
  };
}

function profileToForm(p: Profile): FormState {
  return {
    full_name: p.full_name || '',
    email: p.email || '',
    phone: p.phone || '',
    degree: p.degree || '',
    branch: p.branch || '',
    graduation_year: p.graduation_year?.toString() || '',
    college: p.college || '',
    location: p.location || '',
    preferred_roles: (p.preferred_roles || []).join(', '),
    preferred_locations: (p.preferred_locations || []).join(', '),
    skills: (p.skills || []).join(', '),
    programming_languages: (p.programming_languages || []).join(', '),
    certifications: p.certifications || [],
    projects: p.projects || [],
    experience: p.experience || [],
    resume_url: p.resume_url || '',
  };
}

export function ProfileSetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, update } = useProfile();
  const [form, setForm] = useState<FormState>(emptyForm(''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      const email = profile?.email || '';
      setForm(profile ? profileToForm(profile) : emptyForm(email));
      setError(false);
    }
  }, [open, profile]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(false);
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
      onClose();
    } catch {
      setError(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setError(false), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Profile Setup" maxWidth="max-w-2xl">
      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Failed to save profile. Please try again.
          </div>
        )}

        {/* Personal details */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Personal Details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Full name</label>
              <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
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
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Education</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Degree</label>
              <input className="input-field" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="B.Tech / B.S." />
            </div>
            <div>
              <label className="label-field">Branch</label>
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

        {/* Skills */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Skills & Languages</h3>
          <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Certifications</h3>
            <button type="button" onClick={() => setForm({ ...form, certifications: [...form.certifications, { name: '' }] })} className="btn-ghost text-xs">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="space-y-2">
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
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Projects</h3>
            <button type="button" onClick={() => setForm({ ...form, projects: [...form.projects, { title: '' }] })} className="btn-ghost text-xs">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="space-y-3">
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
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Experience</h3>
            <button type="button" onClick={() => setForm({ ...form, experience: [...form.experience, { company: '', role: '' }] })} className="btn-ghost text-xs">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="space-y-3">
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
        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Resume</h3>
          <label className="label-field">Resume URL</label>
          <input className="input-field" value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} placeholder="Link to your resume (Google Drive, etc.)" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <AlertCircle className="h-3.5 w-3.5" />
            You can close this and complete it later from Profile.
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              <X className="h-4 w-4" /> Close
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save Profile</>}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
