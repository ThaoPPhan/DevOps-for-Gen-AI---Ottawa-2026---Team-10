ALTER TABLE validation_runs ADD COLUMN release_decision TEXT NOT NULL DEFAULT 'pending' CHECK(release_decision IN ('pending', 'approved', 'rejected'));
ALTER TABLE validation_runs ADD COLUMN release_note TEXT;
ALTER TABLE validation_runs ADD COLUMN released_by TEXT;
ALTER TABLE validation_runs ADD COLUMN released_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_validation_release ON validation_runs(release_decision, created_at DESC);
