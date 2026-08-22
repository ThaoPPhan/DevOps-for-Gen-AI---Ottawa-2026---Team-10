ALTER TABLE agents ADD COLUMN risk_categories TEXT NOT NULL DEFAULT '[]';
ALTER TABLE agents ADD COLUMN monitoring_requirements TEXT NOT NULL DEFAULT '[]';
ALTER TABLE agents ADD COLUMN archived_at DATETIME;

ALTER TABLE incidents ADD COLUMN resolution TEXT;
ALTER TABLE incidents ADD COLUMN resolution_note TEXT;
ALTER TABLE incidents ADD COLUMN resolved_by TEXT;
ALTER TABLE incidents ADD COLUMN resolved_at DATETIME;
ALTER TABLE validation_runs ADD COLUMN flagged_tests INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS agent_profile_versions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    version TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'system',
    change_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_profile_versions_agent ON agent_profile_versions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
