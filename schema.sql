-- AgenticScale D1 SQLite Database Schema

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale',
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    purpose TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('protected', 'monitoring', 'at_risk', 'quarantined')),
    risk_score INTEGER NOT NULL DEFAULT 0,
    blast_radius TEXT NOT NULL DEFAULT 'medium' CHECK(blast_radius IN ('low', 'medium', 'high', 'critical')),
    allowed_actions TEXT NOT NULL, -- JSON Array
    restricted_actions TEXT NOT NULL, -- JSON Array
    required_controls TEXT NOT NULL, -- JSON Array
    max_transaction_limit REAL DEFAULT 0,
    risk_categories TEXT NOT NULL DEFAULT '[]', -- JSON Array
    monitoring_requirements TEXT NOT NULL DEFAULT '[]', -- JSON Array
    archived_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_profile_versions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale',
    agent_id TEXT NOT NULL,
    version TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'system',
    change_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS safety_policies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale',
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    default_action TEXT NOT NULL CHECK(default_action IN ('ALLOW', 'REVIEW', 'BLOCK')),
    rule_expression TEXT NOT NULL,
    remediation_guidance TEXT NOT NULL,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS validation_runs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale',
    agent_id TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('passed', 'flagged', 'failed')),
    total_tests INTEGER NOT NULL,
    passed_tests INTEGER NOT NULL,
    failed_tests INTEGER NOT NULL,
    flagged_tests INTEGER NOT NULL DEFAULT 0,
    safety_score REAL NOT NULL,
    recommendation TEXT NOT NULL,
    details_json TEXT NOT NULL,
    release_decision TEXT NOT NULL DEFAULT 'pending' CHECK(release_decision IN ('pending', 'approved', 'rejected')),
    release_note TEXT,
    released_by TEXT,
    released_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS safety_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale',
    agent_id TEXT NOT NULL,
    action_name TEXT NOT NULL,
    target_resource TEXT,
    payload_summary TEXT,
    decision TEXT NOT NULL CHECK(decision IN ('ALLOW', 'REVIEW', 'BLOCK')),
    risk_score INTEGER NOT NULL,
    reasons TEXT NOT NULL, -- JSON Array
    mitigation TEXT,
    latency_ms INTEGER DEFAULT 14,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale',
    agent_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('P1', 'P2', 'P3', 'P4')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    runbook_steps TEXT NOT NULL, -- JSON Array
    status TEXT NOT NULL CHECK(status IN ('open', 'acknowledged', 'resolved')),
    resolution TEXT,
    resolution_note TEXT,
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id),
    FOREIGN KEY(event_id) REFERENCES safety_events(id)
);

-- Indexes for lightning fast query performance
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON safety_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_agent ON safety_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_decision ON safety_events(decision);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_validation_agent ON validation_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_profile_versions_agent ON agent_profile_versions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_memberships (
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'operator', 'viewer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, user_id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    detail_json TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gateway_keys (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME
);

INSERT OR IGNORE INTO organizations (id, slug, name)
VALUES ('org-demo-agenticscale', 'demo-agenticscale', 'AgenticScale Demo Organization');

INSERT OR IGNORE INTO users (id, subject, email, name)
VALUES ('user-demo-admin', 'email:kelvinlingac@gmail.com', 'kelvinlingac@gmail.com', 'AgenticScale Demo Admin');

INSERT OR IGNORE INTO organization_memberships (organization_id, user_id, role)
VALUES ('org-demo-agenticscale', 'user-demo-admin', 'owner');

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_versions_org ON agent_profile_versions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_org ON safety_policies(organization_id, id);
CREATE INDEX IF NOT EXISTS idx_validation_org ON validation_runs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org ON safety_events(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(organization_id, created_at DESC);
