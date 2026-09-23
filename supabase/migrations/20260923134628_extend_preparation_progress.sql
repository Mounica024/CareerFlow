/*
# Extend preparation_progress for detailed learning/practice tracking

1. New Columns
- `learning_progress` (jsonb, default '{}'): tracks which learning sections are completed.
  Example: {"sections_completed": ["Network Security Basics", "TCP/IP Basics"]}
- `practice_progress` (jsonb, default '{}'): tracks which practice questions are answered correctly.
  Example: {"answered": [0, 2], "correct": [0]}
- `interview_progress` (jsonb, default '{}'): tracks which interview questions are practiced.
  Example: {"practiced": [0, 1]}
- `recommendation_reason` (text, nullable): why this topic was recommended.
- `priority` (text, default 'Medium'): High, Medium, or Low.
- `source_job_ids` (text[], default '{}'): job IDs that triggered this recommendation.

2. Modified Tables
- `preparation_progress`: adds the columns above. Existing rows get safe defaults.

3. Security
- RLS already enabled on preparation_progress.
- Existing policies (select/insert/update/delete own rows) remain unchanged.
- No new policies needed — same ownership model.

4. Notes
- All new columns have safe defaults so existing rows and code continue working.
- The status column (not_started/in_progress/completed) is preserved and now
  derived from learning + practice progress in the UI.
- No data is lost — this is purely additive.
*/

ALTER TABLE preparation_progress
  ADD COLUMN IF NOT EXISTS learning_progress jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS practice_progress jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interview_progress jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommendation_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS source_job_ids text[] DEFAULT '{}';