import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, MessageSquare,
  Target, Plus, CheckCircle2, Circle, Clock, ArrowRight,
  ChevronDown, ChevronUp, Lightbulb, PenTool, Award, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { preparationService } from '@/services/preparationService';
import { applicationsService } from '@/services/applicationsService';
import { generateRecommendations, type PrepRecommendation } from '@/services/preparationRecommender';
import { getTopicContent, type PrepTopicContent } from '@/services/preparationContent';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/Common';
import { Modal } from '@/components/Modal';
import type { PreparationCategory, PreparationProgress, Application } from '@/types';

const CATEGORY_LABELS: Record<PreparationCategory, string> = {
  aptitude: 'Aptitude',
  coding: 'Coding',
  technical_concepts: 'Technical Concepts',
  role_specific: 'Role-specific Skills',
  interview_questions: 'Interview Questions',
  hr_questions: 'HR Questions',
  mock_interview: 'Mock Interview',
  weak_skills: 'Weak Skill Areas',
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  High: { bg: 'bg-red-50', text: 'text-red-700' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Low: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

type WorkspaceTab = 'learn' | 'practice' | 'interview' | 'progress';

function computeStatus(prog: PreparationProgress | undefined): 'not_started' | 'learning' | 'practice' | 'completed' {
  if (!prog) return 'not_started';
  const learned = prog.learning_progress?.sections_completed?.length ?? 0;
  const answered = prog.practice_progress?.answered?.length ?? 0;
  const practiced = prog.interview_progress?.practiced?.length ?? 0;
  if (learned > 0 || answered > 0 || practiced > 0) {
    if (prog.status === 'completed') return 'completed';
    if (answered > 0 || practiced > 0) return 'practice';
    return 'learning';
  }
  return 'not_started';
}

function statusLabel(status: string): string {
  if (status === 'completed') return 'Completed';
  if (status === 'practice') return 'Practice';
  if (status === 'learning') return 'Learning';
  return 'Not Started';
}

export function PreparationPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [progress, setProgress] = useState<PreparationProgress[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<PrepRecommendation[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState<PreparationCategory>('technical_concepts');
  const [workspaceTopic, setWorkspaceTopic] = useState<string | null>(null);
  const [workspaceCategory, setWorkspaceCategory] = useState<PreparationCategory>('technical_concepts');
  const [workspaceJobContext, setWorkspaceJobContext] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [prog, apps] = await Promise.all([
        preparationService.list(user.id),
        applicationsService.list(user.id),
      ]);
      setProgress(prog);
      setApplications(apps);
      if (profile) {
        setRecommendations(generateRecommendations(profile, apps));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    load();
  }, [load]);

  // Find progress for a given topic
  const findProgress = (topic: string): PreparationProgress | undefined => {
    const lower = topic.toLowerCase().trim();
    return progress.find((p) => p.topic.toLowerCase().trim() === lower);
  };

  const startPreparation = async (topic: string, category: PreparationCategory, jobId?: string) => {
    if (!user) return;
    const existing = findProgress(topic);
    if (!existing) {
      await preparationService.upsert(user.id, category, topic, 'not_started', jobId);
      await load();
    }
    setWorkspaceTopic(topic);
    setWorkspaceCategory(category);
    setWorkspaceJobContext(jobId || null);
  };

  const handleAddTopic = async () => {
    const topicName = newTopic.trim();
    if (!user || !topicName) return;
    await preparationService.upsert(user.id, newCategory, topicName, 'not_started');
    setNewTopic('');
    setAddOpen(false);
    await load();
    startPreparation(topicName, newCategory);
  };

  const handleDelete = async (id: string) => {
    await preparationService.remove(id);
    setProgress((prev) => prev.filter((p) => p.id !== id));
  };

  // Skills to improve — from job-derived recommendations only, already filtered for false positives
  const skillsToImprove = recommendations
    .filter((r) => r.relatedJobs.length > 0)
    .map((r) => r.topic);

  // Separate job-derived from general recommendations
  const jobRecommendations = recommendations.filter((r) => r.relatedJobs.length > 0);
  const generalRecommendations = recommendations.filter((r) => r.relatedJobs.length === 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const inProgressCount = progress.filter((p) => {
    const s = computeStatus(p);
    return s === 'learning' || s === 'practice';
  }).length;

  // Empty state: no tracked jobs and no progress
  if (applications.length === 0 && progress.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Preparation"
          subtitle="Prepare for assessments and interviews based on your target roles."
          action={<button onClick={() => setAddOpen(true)} className="btn-secondary"><Plus className="h-4 w-4" /> Add topic</button>}
        />
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="No target jobs yet"
          description="Track a job from Find Jobs to get preparation recommendations based on real job requirements. You can also add a topic manually."
          action={<Link to="/app/jobs" className="btn-primary">Find Jobs</Link>}
        />
        <AddTopicModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          topic={newTopic}
          setTopic={setNewTopic}
          category={newCategory}
          setCategory={setNewCategory}
          onAdd={handleAddTopic}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Preparation"
        subtitle="Prepare for assessments and interviews based on your target roles."
        action={<button onClick={() => setAddOpen(true)} className="btn-secondary"><Plus className="h-4 w-4" /> Add topic</button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-900">{progress.length}</p>
          <p className="text-xs text-slate-500">Total topics</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
          <p className="text-xs text-slate-500">In progress</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
      </div>

      {/* Recommended from Your Jobs */}
      {jobRecommendations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-900">Recommended from Your Jobs</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Based on requirements found in your tracked jobs. CareerFlow compares your profile with job requirements to identify what you should prepare.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {jobRecommendations.map((rec) => {
              const prog = findProgress(rec.topic);
              const status = computeStatus(prog);
              const content = getTopicContent(rec.topic);
              const prStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Low;
              return (
                <div key={rec.topic} className="card p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 capitalize">{rec.topic}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{CATEGORY_LABELS[rec.category]}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${prStyle.bg} ${prStyle.text}`}>
                      {rec.priority}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{rec.reason}</p>

                  {rec.relatedJobs.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500">Related jobs:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rec.relatedJobs.slice(0, 3).map((job) => (
                          <span key={job} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            {job}
                          </span>
                        ))}
                        {rec.relatedJobs.length > 3 && (
                          <span className="text-xs text-slate-400">+{rec.relatedJobs.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className={`font-medium ${
                      status === 'completed' ? 'text-emerald-600' :
                      status === 'practice' ? 'text-blue-600' :
                      status === 'learning' ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {statusLabel(status)}
                    </span>
                    {content && (
                      <span className="text-slate-300">•</span>
                    )}
                    {content && (
                      <span className="text-slate-400">
                        {content.keyConcepts.length} concepts · {content.practice.length} practice · {content.interviewQuestions.length} interview
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 flex items-center gap-2">
                    <button
                      onClick={() => startPreparation(rec.topic, rec.category)}
                      className="btn-primary text-sm"
                    >
                      {status === 'not_started' ? 'Start Preparation' : 'Continue'} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    {prog && (
                      <button
                        onClick={() => handleDelete(prog.id)}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Interview Preparation */}
      {generalRecommendations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-900">General Interview Preparation</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            General preparation that applies to most hiring processes — not specific to a particular job listing.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {generalRecommendations.map((rec) => {
              const prog = findProgress(rec.topic);
              const status = computeStatus(prog);
              const content = getTopicContent(rec.topic);
              const prStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Low;
              return (
                <div key={rec.topic} className="card p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">{rec.topic}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{CATEGORY_LABELS[rec.category]}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${prStyle.bg} ${prStyle.text}`}>
                      {rec.priority}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{rec.reason}</p>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className={`font-medium ${
                      status === 'completed' ? 'text-emerald-600' :
                      status === 'practice' ? 'text-blue-600' :
                      status === 'learning' ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {statusLabel(status)}
                    </span>
                    {content && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">
                          {content.keyConcepts.length} concepts · {content.practice.length} practice · {content.interviewQuestions.length} interview
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-auto pt-3 flex items-center gap-2">
                    <button
                      onClick={() => startPreparation(rec.topic, rec.category)}
                      className="btn-primary text-sm"
                    >
                      {status === 'not_started' ? 'Start Preparation' : 'Continue'} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    {prog && (
                      <button
                        onClick={() => handleDelete(prog.id)}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills to Improve */}
      {skillsToImprove.length > 0 && (
        <div className="card mb-6 border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">Skills to Improve</p>
              <p className="mt-0.5 text-sm text-slate-600">
                These skills appear in your tracked job requirements but are not yet in your profile. Click a skill to start preparing.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skillsToImprove.map((skill) => {
                  const rec = recommendations.find((r) => r.topic === skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => rec && startPreparation(rec.topic, rec.category)}
                      className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200 capitalize hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer"
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Preparation — topics with progress */}
      {progress.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-900">My Preparation</h2>
          </div>
          <div className="space-y-2">
            {progress.map((item) => {
              const status = computeStatus(item);
              const content = getTopicContent(item.topic);
              const learnedCount = item.learning_progress?.sections_completed?.length ?? 0;
              const practiceAnswered = item.practice_progress?.answered?.length ?? 0;
              const interviewPracticed = item.interview_progress?.practiced?.length ?? 0;
              const totalSections = content?.keyConcepts.length ?? 0;
              const totalPractice = content?.practice.length ?? 0;
              const totalInterview = content?.interviewQuestions.length ?? 0;
              return (
                <div key={item.id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : status === 'not_started' ? (
                      <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 capitalize truncate">{item.topic}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className={status === 'completed' ? 'text-emerald-600 font-medium' : status === 'not_started' ? 'text-slate-400' : 'text-amber-600 font-medium'}>
                          {statusLabel(status)}
                        </span>
                        {content && (
                          <>
                            {totalSections > 0 && <span>Learn: {learnedCount}/{totalSections}</span>}
                            {totalPractice > 0 && <span>Practice: {practiceAnswered}/{totalPractice}</span>}
                            {totalInterview > 0 && <span>Interview: {interviewPracticed}/{totalInterview}</span>}
                          </>
                        )}
                        <span className="text-slate-400">{CATEGORY_LABELS[item.category]}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => startPreparation(item.topic, item.category, item.job_id || undefined)}
                    className="text-sm text-brand-600 font-medium hover:text-brand-700 shrink-0"
                  >
                    {status === 'not_started' ? 'Start' : 'Open'} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Readiness summary */}
      {completedCount > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Preparation Progress</h2>
          </div>
          <div className="space-y-2">
            {progress.filter((p) => p.status === 'completed').map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-700 capitalize">{p.topic}</span>
              </div>
            ))}
            {progress.filter((p) => computeStatus(p) !== 'completed' && computeStatus(p) !== 'not_started').map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <Circle className="h-4 w-4 text-slate-300" />
                <span className="text-slate-500 capitalize">{p.topic}</span>
                <span className="text-xs text-amber-600">({statusLabel(computeStatus(p))})</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            These preparation areas are tracked based on the requirements currently available for your tracked jobs. Completing them does not guarantee a job offer.
          </p>
        </div>
      )}

      {/* Categories overview */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Categories</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(CATEGORY_LABELS) as PreparationCategory[]).map((cat) => {
            const items = progress.filter((p) => p.category === cat);
            const recs = recommendations.filter((r) => r.category === cat);
            const count = items.length + recs.filter((r) => !items.some((i) => i.topic.toLowerCase() === r.topic.toLowerCase())).length;
            return (
              <div key={cat} className="card p-3">
                <p className="text-sm font-medium text-slate-900">{CATEGORY_LABELS[cat]}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {count > 0 ? `${count} topic${count > 1 ? 's' : ''}` : 'No topics yet'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* No recommendations but has jobs */}
      {applications.length > 0 && recommendations.filter((r) => r.relatedJobs.length > 0).length === 0 && (
        <div className="card p-5 border-slate-200">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">Not enough requirement information</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Your tracked jobs do not contain enough detailed requirement information to generate reliable preparation recommendations. Try tracking jobs with more detailed descriptions, or add a topic manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add topic modal */}
      <AddTopicModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        topic={newTopic}
        setTopic={setNewTopic}
        category={newCategory}
        setCategory={setNewCategory}
        onAdd={handleAddTopic}
      />

      {/* Preparation workspace */}
      {workspaceTopic && (
        <PreparationWorkspace
          topic={workspaceTopic}
          category={workspaceCategory}
          jobContext={workspaceJobContext}
          content={getTopicContent(workspaceTopic)}
          progress={findProgress(workspaceTopic)}
          onProgressUpdate={load}
          onClose={() => { setWorkspaceTopic(null); setWorkspaceJobContext(null); }}
        />
      )}
    </div>
  );
}

// ─── Add Topic Modal ───
function AddTopicModal({
  open, onClose, topic, setTopic, category, setCategory, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  topic: string;
  setTopic: (v: string) => void;
  category: PreparationCategory;
  setCategory: (v: PreparationCategory) => void;
  onAdd: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add Preparation Topic">
      <div className="space-y-4">
        <div>
          <label className="label-field">Category</label>
          <select
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value as PreparationCategory)}
          >
            {(Object.keys(CATEGORY_LABELS) as PreparationCategory[]).map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Topic</label>
          <input
            className="input-field"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Arrays and Strings, SQL Joins, Network Security"
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          />
          <p className="mt-1 text-xs text-slate-400">
            After adding, you'll get the full Learn → Practice → Interview experience.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onAdd} disabled={!topic.trim()} className="btn-primary">Add & Start</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Preparation Workspace ───
function PreparationWorkspace({
  topic, category, jobContext, content, progress, onProgressUpdate, onClose,
}: {
  topic: string;
  category: PreparationCategory;
  jobContext: string | null;
  content: PrepTopicContent | null;
  progress: PreparationProgress | undefined;
  onProgressUpdate: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<WorkspaceTab>('learn');
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Set<number>>(new Set());

  const sectionsCompleted = new Set(progress?.learning_progress?.sections_completed ?? []);
  const practiceAnswered = new Set(progress?.practice_progress?.answered ?? []);
  const practiceCorrect = new Set(progress?.practice_progress?.correct ?? []);
  const interviewPracticed = new Set(progress?.interview_progress?.practiced ?? []);

  const totalSections = content?.keyConcepts.length ?? 0;
  const totalPractice = content?.practice.length ?? 0;
  const totalInterview = content?.interviewQuestions.length ?? 0;

  const toggleSection = async (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
    if (content && !sectionsCompleted.has(content.keyConcepts[index].title)) {
      const newCompleted = [...sectionsCompleted, content.keyConcepts[index].title];
      if (progress) {
        await preparationService.updateProgress(progress.id, {
          learning_progress: { sections_completed: [...newCompleted] },
          status: 'in_progress',
        });
        onProgressUpdate();
      }
    }
  };

  const answerQuestion = async (index: number, optionIndex: number) => {
    if (!content || practiceAnswered.has(index) || !progress) return;
    const isCorrect = optionIndex === content.practice[index].correctIndex;
    const newAnswered = [...practiceAnswered, index];
    const newCorrect = isCorrect ? [...practiceCorrect, index] : [...practiceCorrect];
    setPracticeAnswers({ ...practiceAnswers, [index]: optionIndex });
    setShowExplanation(new Set([...showExplanation, index]));
    const allPracticeDone = newAnswered.length === totalPractice;
    const allLearned = sectionsCompleted.size === totalSections;
    const newStatus = allPracticeDone && allLearned ? 'completed' : 'in_progress';
    await preparationService.updateProgress(progress.id, {
      practice_progress: { answered: newAnswered, correct: newCorrect },
      status: newStatus,
    });
    onProgressUpdate();
  };

  const markInterviewPracticed = async (index: number) => {
    if (!content || interviewPracticed.has(index) || !progress) return;
    const newPracticed = [...interviewPracticed, index];
    const allDone = newPracticed.length === totalInterview;
    const allLearned = sectionsCompleted.size === totalSections;
    const allPractice = practiceAnswered.size === totalPractice;
    const newStatus = allDone && allLearned && allPractice ? 'completed' : 'in_progress';
    await preparationService.updateProgress(progress.id, {
      interview_progress: { practiced: newPracticed },
      status: newStatus,
    });
    onProgressUpdate();
  };

  const learnedCount = sectionsCompleted.size;
  const answeredCount = practiceAnswered.size;
  const practicedCount = interviewPracticed.size;
  const overallStatus = computeStatus(progress);

  const tabs: { key: WorkspaceTab; label: string; icon: typeof BookOpen; count?: string }[] = [
    { key: 'learn', label: 'Learn', icon: BookOpen, count: totalSections > 0 ? `${learnedCount}/${totalSections}` : undefined },
    { key: 'practice', label: 'Practice', icon: PenTool, count: totalPractice > 0 ? `${answeredCount}/${totalPractice}` : undefined },
    { key: 'interview', label: 'Interview', icon: MessageSquare, count: totalInterview > 0 ? `${practicedCount}/${totalInterview}` : undefined },
    { key: 'progress', label: 'Progress', icon: Award },
  ];

  return (
    <Modal open={true} onClose={onClose} title={`Preparation: ${content?.topic || topic}`} maxWidth="max-w-2xl">
      {/* Job context */}
      {jobContext && (
        <div className="mb-4 rounded-lg bg-brand-50 border border-brand-100 p-3">
          <p className="text-xs font-medium text-brand-700">Preparing for a tracked job</p>
          <p className="text-sm text-slate-600 mt-0.5">{jobContext}</p>
        </div>
      )}

      {/* Source disclaimer */}
      {!content && (
        <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs text-slate-500">
            Detailed learning content is not yet available for this topic. You can still track your progress manually. Recommendations based on job requirements come from your actual tracked job listings — CareerFlow does not invent requirements.
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count && <span className="text-xs text-slate-400">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Learn tab */}
      {tab === 'learn' && (
        <div className="space-y-3">
          {content ? (
            <>
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-medium text-slate-900">What is {content.topic}?</h3>
                <p className="mt-1 text-sm text-slate-600">{content.overview}</p>
              </div>
              {content.keyConcepts.map((section, i) => {
                const isExpanded = expandedSection === i;
                const isCompleted = sectionsCompleted.has(section.title);
                return (
                  <div key={i} className="rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => toggleSection(i)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-slate-900 text-left">
                          {i + 1}. {section.title}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1">
                        <ul className="space-y-1.5">
                          {section.notes.map((note, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="text-brand-400 mt-0.5">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
              {learnedCount === totalSections && totalSections > 0 && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                  <p className="text-sm text-emerald-700 font-medium">
                    All learning sections completed! Move to Practice to continue.
                  </p>
                </div>
              )}
            </>
          ) : (
            <NoContentPlaceholder topic={topic} />
          )}
        </div>
      )}

      {/* Practice tab */}
      {tab === 'practice' && (
        <div className="space-y-4">
          {content && content.practice.length > 0 ? (
            content.practice.map((q, i) => {
              const answered = practiceAnswered.has(i);
              const selectedOption = practiceAnswers[i] ?? null;
              const showExp = showExplanation.has(i);
              const isCorrect = practiceCorrect.has(i);
              return (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-900">
                    {i + 1}. {q.question}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, j) => {
                      const isSelected = selectedOption === j;
                      const isCorrectOption = j === q.correctIndex;
                      let style = 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/30';
                      if (answered) {
                        if (isCorrectOption) style = 'border-emerald-300 bg-emerald-50';
                        else if (isSelected) style = 'border-red-300 bg-red-50';
                        else style = 'border-slate-200 opacity-60';
                      }
                      return (
                        <button
                          key={j}
                          disabled={answered}
                          onClick={() => answerQuestion(i, j)}
                          className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${style} ${
                            !answered ? 'cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          <span className="font-medium text-slate-700">{String.fromCharCode(65 + j)}.</span>{' '}
                          <span className="text-slate-600">{opt}</span>
                          {answered && isCorrectOption && <CheckCircle2 className="inline h-4 w-4 text-emerald-500 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                  {showExp && (
                    <div className={`mt-3 rounded-lg p-3 text-sm ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      <p className="font-medium">{isCorrect ? 'Correct!' : 'Not quite.'}</p>
                      <p className="mt-1 text-slate-600">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : content ? (
            <p className="text-sm text-slate-500 text-center py-8">No practice questions available for this topic yet.</p>
          ) : (
            <NoContentPlaceholder topic={topic} />
          )}
        </div>
      )}

      {/* Interview tab */}
      {tab === 'interview' && (
        <div className="space-y-4">
          {content && content.interviewQuestions.length > 0 ? (
            content.interviewQuestions.map((q, i) => {
              const practiced = interviewPracticed.has(i);
              return (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{q.question}</p>
                    {practiced && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">Suggested answer:</p>
                    <p className="text-sm text-slate-600">{q.answer}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-slate-500">Key points to mention:</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {q.keyPoints.map((pt, j) => (
                        <span key={j} className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{pt}</span>
                      ))}
                    </div>
                  </div>
                  {q.followUp && (
                    <p className="mt-2 text-xs text-slate-400">
                      <span className="font-medium">Follow-up:</span> {q.followUp}
                    </p>
                  )}
                  {!practiced && (
                    <button
                      onClick={() => markInterviewPracticed(i)}
                      className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      Mark as practiced
                    </button>
                  )}
                </div>
              );
            })
          ) : content ? (
            <p className="text-sm text-slate-500 text-center py-8">No interview questions available for this topic yet.</p>
          ) : (
            <NoContentPlaceholder topic={topic} />
          )}
        </div>
      )}

      {/* Progress tab */}
      {tab === 'progress' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-900">Progress Summary</h3>
              <span className={`text-sm font-medium ${
                overallStatus === 'completed' ? 'text-emerald-600' :
                overallStatus === 'practice' ? 'text-blue-600' :
                overallStatus === 'learning' ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {statusLabel(overallStatus)}
              </span>
            </div>
            {content ? (
              <div className="space-y-3">
                <ProgressBar label="Learning sections" current={learnedCount} total={totalSections} />
                <ProgressBar label="Practice questions" current={answeredCount} total={totalPractice} />
                <ProgressBar label="Interview questions" current={practicedCount} total={totalInterview} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Progress tracking requires learning content for this topic.</p>
            )}
          </div>

          {overallStatus === 'completed' && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-medium text-emerald-700">Preparation Completed</p>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                You have completed the learning, practice, and interview sections for this topic. This preparation is based on the requirements currently available for your tracked jobs.
              </p>
            </div>
          )}

          {overallStatus !== 'completed' && content && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                {overallStatus === 'not_started' && 'Click on the Learn tab to start studying the key concepts.'}
                {overallStatus === 'learning' && 'Continue learning, then move to Practice to test your understanding.'}
                {overallStatus === 'practice' && 'Keep practicing! Complete all questions and interview prep to finish.'}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ProgressBar({ label, current, total }: { label: string; current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-500 font-medium">{current}/{total}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-brand-500' : 'bg-slate-200'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function NoContentPlaceholder({ topic }: { topic: string }) {
  return (
    <div className="text-center py-8">
      <Lightbulb className="h-10 w-10 text-slate-300 mx-auto mb-2" />
      <p className="text-sm font-medium text-slate-600">No structured content yet for "{topic}"</p>
      <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
        CareerFlow has learning content for common technical topics. For this topic, you can track your progress manually or explore related topics that have full Learn, Practice, and Interview sections.
      </p>
    </div>
  );
}
