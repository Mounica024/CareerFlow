// ============ Core Domain Types ============

export type EmploymentType = 'full_time' | 'part_time' | 'internship' | 'contract';
export type WorkArrangement = 'remote' | 'on_site' | 'hybrid';
export type ExperienceLevel = 'entry_level' | 'junior' | 'mid' | 'senior' | 'lead';

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'assessment'
  | 'technical_interview'
  | 'hr_interview'
  | 'offer'
  | 'rejected';

export type MatchStatus = 'strong_match' | 'partial_match' | 'requirements_missing' | 'unable_to_determine';

export type RecruitmentEventType =
  | 'application_confirmation'
  | 'assessment_invitation'
  | 'interview_invitation'
  | 'interview_reschedule'
  | 'rejection'
  | 'offer'
  | 'other';

export type EmailProvider = 'gmail' | 'outlook';

export type PreparationCategory =
  | 'aptitude'
  | 'coding'
  | 'technical_concepts'
  | 'role_specific'
  | 'interview_questions'
  | 'hr_questions'
  | 'mock_interview'
  | 'weak_skills';

export type PreparationStatus = 'not_started' | 'in_progress' | 'completed';

// ============ Profile ============

export interface Certification {
  name: string;
  issuer?: string;
  year?: string;
}

export interface Project {
  title: string;
  description?: string;
  technologies?: string[];
  link?: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  duration?: string;
  description?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number | null;
  college?: string;
  location?: string;
  preferred_roles: string[];
  preferred_locations: string[];
  skills: string[];
  programming_languages: string[];
  certifications: Certification[];
  projects: Project[];
  experience: ExperienceEntry[];
  resume_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ============ Job ============

export interface JobRequirement {
  skill: string;
  required: boolean;
}

export type SourceType =
  | 'government'
  | 'company_careers'
  | 'recognized_platform'
  | 'job_aggregator'
  | 'unverified';

export interface SourceInfo {
  name: string;
  type: SourceType;
  url?: string;
  application_url?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location?: string;
  employment_type: EmploymentType;
  work_arrangement: WorkArrangement;
  experience_level: ExperienceLevel;
  description?: string;
  requirements: JobRequirement[];
  skills: string[];
  application_deadline?: string | null;
  application_url?: string;
  job_source: string;
  source_type?: SourceType;
  source_url?: string;
  posted_at?: string;
  salary_range?: string;
}

// ============ Job Match ============

export interface JobMatchResult {
  status: MatchStatus;
  match_percentage: number | null;
  matching_skills: string[];
  missing_skills: string[];
  other_requirements: string[];
  explanation: string;
}

// ============ Saved Job ============

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  job_data: Job;
  match_data: JobMatchResult | null;
  created_at: string;
}

// ============ Application ============

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  job_data: Job;
  status: ApplicationStatus;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Application Event ============

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: string;
  title: string;
  description?: string;
  occurred_at: string;
  created_at: string;
}

// ============ Recruitment Event ============

export interface RecruitmentEvent {
  id: string;
  user_id: string;
  application_id: string | null;
  event_type: RecruitmentEventType;
  source: string;
  subject: string;
  snippet: string;
  occurred_at: string;
  raw_data: Record<string, unknown>;
  confirmed: boolean;
  created_at: string;
}

// ============ Preparation Progress ============

export interface PreparationProgress {
  id: string;
  user_id: string;
  category: PreparationCategory;
  topic: string;
  job_id: string | null;
  status: PreparationStatus;
  last_attempted_at: string | null;
  created_at: string;
  learning_progress?: { sections_completed?: string[] };
  practice_progress?: { answered?: number[]; correct?: number[] };
  interview_progress?: { practiced?: number[] };
  recommendation_reason?: string | null;
  priority?: string | null;
  source_job_ids?: string[] | null;
}

// ============ Email Integration ============

export interface EmailIntegrationStatus {
  provider: EmailProvider | null;
  connected: boolean;
  connected_at?: string;
}

// ============ Job Provider ============

export interface JobSearchFilters {
  query?: string;
  employment_type?: EmploymentType;
  experience_level?: ExperienceLevel;
  location?: string;
  work_arrangement?: WorkArrangement;
  skills?: string[];
  sort?: 'relevance' | 'latest' | 'deadline';
  page?: number;
  results_per_page?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  total: number;
  has_more: boolean;
  source: string;
  configured?: boolean;
  error?: string;
}
