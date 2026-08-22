-- Portable organization, identity, and audit boundary.

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS gateway_keys (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
);

INSERT OR IGNORE INTO organizations (id, slug, name)
VALUES ('org-demo-agenticscale', 'demo-agenticscale', 'AgenticScale Demo Organization');

INSERT OR IGNORE INTO users (id, subject, email, name)
VALUES ('user-demo-admin', 'email:kelvinlingac@gmail.com', 'kelvinlingac@gmail.com', 'AgenticScale Demo Admin');

INSERT OR IGNORE INTO organization_memberships (organization_id, user_id, role)
VALUES ('org-demo-agenticscale', 'user-demo-admin', 'owner');

ALTER TABLE agents ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale';
ALTER TABLE agent_profile_versions ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale';
ALTER TABLE safety_policies ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale';
ALTER TABLE validation_runs ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale';
ALTER TABLE safety_events ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale';
ALTER TABLE incidents ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'org-demo-agenticscale';

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_versions_org ON agent_profile_versions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_org ON safety_policies(organization_id, id);
CREATE INDEX IF NOT EXISTS idx_validation_org ON validation_runs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org ON safety_events(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(organization_id, created_at DESC);
