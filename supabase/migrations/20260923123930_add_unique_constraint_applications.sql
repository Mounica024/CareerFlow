-- Add unique constraint to prevent duplicate applications for the same job
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_user_job_unique
  ON applications(user_id, job_id);