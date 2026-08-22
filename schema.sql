-- AgenticScale D1 SQLite Database Schema

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safety_policies (
    id TEXT PRIMARY KEY,
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
    agent_id TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('passed', 'flagged', 'failed')),
    total_tests INTEGER NOT NULL,
    passed_tests INTEGER NOT NULL,
    failed_tests INTEGER NOT NULL,
    safety_score REAL NOT NULL,
    recommendation TEXT NOT NULL,
    details_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS safety_events (
    id TEXT PRIMARY KEY,
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
    agent_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('P1', 'P2', 'P3', 'P4')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    runbook_steps TEXT NOT NULL, -- JSON Array
    status TEXT NOT NULL CHECK(status IN ('open', 'acknowledged', 'resolved')),
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
