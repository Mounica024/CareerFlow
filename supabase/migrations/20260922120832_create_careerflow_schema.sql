/*
# CareerFlow Core Schema

## Overview
Creates the foundational database schema for CareerFlow — a career assistant for college students and fresh graduates.
This migration establishes tables for student profiles, saved jobs, applications, application timeline events,
recruitment events (email-based), and preparation tracking.

## New Tables

1. `profiles` — Extended student profile data (linked to auth.users)
   - id (uuid, PK, references auth.users)
   - full_name, email, phone, degree, branch, graduation_year, college, location
   - preferred_roles (text[]), preferred_locations (text[])
   - skills (text[]), programming_languages (text[])
   - certifications (jsonb array), projects (jsonb array), experience (jsonb array)
   - resume_url (text)
   - created_at, updated_at

2. `saved_jobs` — Jobs a student has shortlisted
   - id, user_id, job_id, job_data (jsonb snapshot of job at save time), match_data (jsonb), created_at

3. `applications` — Tracked job applications
   - id, user_id, job_id, job_data (jsonb), status (enum-like text), applied_at, created_at, updated_at
   - status values: saved | applied | assessment | technical_interview | hr_interview | offer | rejected

4. `application_events` — Timeline events for each application
   - id, application_id, event_type, title, description, occurred_at, created_at

5. `recruitment_events` — Events detected from email integrations (future)
   - id, user_id, application_id (nullable), event_type, source (gmail/outlook/manual), subject, snippet, occurred_at, raw_data (jsonb), confirmed (boolean), created_at

6. `preparation_progress` — Tracks student preparation activity
   - id, user_id, category, topic, job_id (nullable), status, last_attempted_at, created_at

## Security
- All tables have RLS enabled.
- All tables are owner-scoped to the authenticated user via user_id (except profiles which uses auth.uid() = id).
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE).
- user_id columns default to auth.uid() so inserts work without explicitly passing user_id.

## Notes
1. Job data is stored as jsonb snapshots because jobs come from external provider APIs.
   This keeps the application self-contained even if the provider's listing is removed.
2. The recruitment_events table is designed for future Gmail/Outlook integration —
   it stores raw_data and a confirmed flag so detected emails can be reviewed before being applied.
3. No fake data is inserted. The app must work with zero rows.
*/

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  degree text DEFAULT '',
  branch text DEFAULT '',
  graduation_year int DEFAULT NULL,
  college text DEFAULT '',
  location text DEFAULT '',
  preferred_roles text[] DEFAULT '{}',
  preferred_locations text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  programming_languages text[] DEFAULT '{}',
  certifications jsonb DEFAULT '[]'::jsonb,
  projects jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '[]'::jsonb,
  resume_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============ saved_jobs ============
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  job_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  match_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_jobs" ON saved_jobs;
CREATE POLICY "select_own_saved_jobs" ON saved_jobs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_jobs" ON saved_jobs;
CREATE POLICY "insert_own_saved_jobs" ON saved_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_jobs" ON saved_jobs;
CREATE POLICY "update_own_saved_jobs" ON saved_jobs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_jobs" ON saved_jobs;
CREATE POLICY "delete_own_saved_jobs" ON saved_jobs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ applications ============
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  job_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'applied',
  applied_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_applications" ON applications;
CREATE POLICY "select_own_applications" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_applications" ON applications;
CREATE POLICY "insert_own_applications" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_applications" ON applications;
CREATE POLICY "update_own_applications" ON applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_applications" ON applications;
CREATE POLICY "delete_own_applications" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ application_events ============
CREATE TABLE IF NOT EXISTS application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_application_events" ON application_events;
CREATE POLICY "select_own_application_events" ON application_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM applications WHERE applications.id = application_events.application_id AND applications.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_application_events" ON application_events;
CREATE POLICY "insert_own_application_events" ON application_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM applications WHERE applications.id = application_events.application_id AND applications.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_application_events" ON application_events;
CREATE POLICY "update_own_application_events" ON application_events FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM applications WHERE applications.id = application_events.application_id AND applications.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM applications WHERE applications.id = application_events.application_id AND applications.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_application_events" ON application_events;
CREATE POLICY "delete_own_application_events" ON application_events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM applications WHERE applications.id = application_events.application_id AND applications.user_id = auth.uid())
  );

-- ============ recruitment_events ============
CREATE TABLE IF NOT EXISTS recruitment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  subject text DEFAULT '',
  snippet text DEFAULT '',
  occurred_at timestamptz DEFAULT now(),
  raw_data jsonb DEFAULT '{}'::jsonb,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recruitment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recruitment_events" ON recruitment_events;
CREATE POLICY "select_own_recruitment_events" ON recruitment_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recruitment_events" ON recruitment_events;
CREATE POLICY "insert_own_recruitment_events" ON recruitment_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_recruitment_events" ON recruitment_events;
CREATE POLICY "update_own_recruitment_events" ON recruitment_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_recruitment_events" ON recruitment_events;
CREATE POLICY "delete_own_recruitment_events" ON recruitment_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ preparation_progress ============
CREATE TABLE IF NOT EXISTS preparation_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  topic text NOT NULL,
  job_id text DEFAULT NULL,
  status text NOT NULL DEFAULT 'not_started',
  last_attempted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE preparation_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_preparation_progress" ON preparation_progress;
CREATE POLICY "select_own_preparation_progress" ON preparation_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_preparation_progress" ON preparation_progress;
CREATE POLICY "insert_own_preparation_progress" ON preparation_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_preparation_progress" ON preparation_progress;
CREATE POLICY "update_own_preparation_progress" ON preparation_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_preparation_progress" ON preparation_progress;
CREATE POLICY "delete_own_preparation_progress" ON preparation_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_application_events_application_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_events_user_id ON recruitment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_preparation_progress_user_id ON preparation_progress(user_id);