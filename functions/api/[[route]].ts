// Cloudflare Pages Function API Handler powered by Hono.

import { Hono } from 'hono';
import { evaluateAgentAction, AgentContext } from '../../src/server/engine/policy';
import { analyzeAgentRisk } from '../../src/server/engine/risk';
import { runSafetyValidationSuite } from '../../src/server/engine/validator';

export interface Env {
  DB: D1Database;
  AGENTICSCALE_KV: KVNamespace;
  ADMIN_API_KEY?: string;
  GATEWAY_API_KEY?: string;
  APP_VERSION?: string;
}

type JsonObject = Record<string, unknown>;

const app = new Hono<{ Bindings: Env }>();
const APP_VERSION = '2.0.0';
const MAX_BODY_BYTES = 64 * 1024;
const MAX_TEXT_LENGTH = 10_000;
const ALLOWED_ORIGINS = new Set([
  'https://agenticscale.pages.dev',
  'https://agenticscale.org',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8788'
]);

const STATUS_VALUES = new Set(['protected', 'monitoring', 'at_risk', 'quarantined']);
const BLAST_RADIUS_VALUES = new Set(['low', 'medium', 'high', 'critical']);

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.has(origin) || /^https:\/\/[a-z0-9-]+\.agenticscale\.pages\.dev$/i.test(origin);
}

function jsonError(c: any, message: string, status: 400 | 401 | 403 | 404 | 413 | 415 | 422 | 500 | 503) {
  return c.json({ error: message }, status);
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let result = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    result |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return result === 0;
}

function presentedApiKey(request: Request): string {
  const explicitKey = request.headers.get('X-AgenticScale-Key');
  if (explicitKey) return explicitKey;

  const authorization = request.headers.get('Authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function isSameOriginRequest(request: Request): boolean {
  const requestHost = new URL(request.url).hostname;
  if (requestHost === 'localhost' || requestHost === '127.0.0.1') return true;
  const origin = request.headers.get('Origin');
  if (origin) return isAllowedOrigin(origin);

  const fetchSite = request.headers.get('Sec-Fetch-Site');
  return fetchSite === 'same-origin' || fetchSite === 'same-site';
}

function hasAccess(request: Request, configuredKey?: string): boolean {
  const suppliedKey = presentedApiKey(request);
  if (configuredKey && suppliedKey && timingSafeEqual(configuredKey, suppliedKey)) return true;
  return isSameOriginRequest(request);
}

function requireAccess(c: any, configuredKey: string | undefined, label: string) {
  if (!hasAccess(c.req.raw, configuredKey)) {
    return c.json({ error: `${label} access requires a same-origin request or API key.` }, 401);
  }
  return undefined;
}

async function readJsonObject(c: any): Promise<JsonObject> {
  const contentLength = Number(c.req.header('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error('Request body exceeds the 64 KB limit.');

  const contentType = c.req.header('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Content-Type must be application/json.');
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new Error('Request body must be valid JSON.');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object.');
  }

  return body as JsonObject;
}

function stringField(body: JsonObject, key: string, required = false, maxLength = MAX_TEXT_LENGTH): string {
  const value = body[key];
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${key} is required.`);
    return '';
  }
  if (typeof value !== 'string') throw new Error(`${key} must be a string.`);
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${key} is required.`);
  if (normalized.length > maxLength) throw new Error(`${key} exceeds the ${maxLength} character limit.`);
  return normalized;
}

function stringArrayField(body: JsonObject, key: string): string[] {
  const value = body[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 100 || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${key} must be an array of at most 100 strings.`);
  }
  return value.map((item) => item.trim()).filter(Boolean).slice(0, 100);
}

function finiteNumberField(body: JsonObject, key: string, fallback: number, min: number, max: number): number {
  const value = body[key];
  if (value === undefined || value === null || value === '') return fallback;
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
  return numberValue;
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toAgentContext(row: any): AgentContext {
  return {
    ...row,
    allowed_actions: parseJsonArray(row.allowed_actions).filter((item): item is string => typeof item === 'string'),
    restricted_actions: parseJsonArray(row.restricted_actions).filter((item): item is string => typeof item === 'string'),
    required_controls: parseJsonArray(row.required_controls).filter((item): item is string => typeof item === 'string')
  } as AgentContext;
}

function addSecurityHeaders(c: any, origin: string | undefined): void {
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  if (origin) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-AgenticScale-Key');
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    c.header('Vary', 'Origin');
  }
}

// Restrict cross-origin access while still allowing the public same-origin dashboard.
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  if (origin && !isAllowedOrigin(origin)) {
    return c.json({ error: 'Origin is not allowed.' }, 403);
  }

  if (c.req.method === 'OPTIONS') {
    addSecurityHeaders(c, origin);
    return c.body(null, 204);
  }

  await next();
  addSecurityHeaders(c, origin);
  return c.res;
});

app.get('/api/health', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM agents').first<{ count: number }>();
    return c.json({
      status: 'online',
      version: c.env.APP_VERSION || APP_VERSION,
      platform: 'AgenticScale Continuous Safety Assurance',
      runtime: 'Cloudflare Pages Functions / Workers Edge',
      database: { status: 'connected', registered_agents: result?.count ?? 0 },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'health_check_failed', error: String(error) }));
    return c.json({
      status: 'degraded',
      version: c.env.APP_VERSION || APP_VERSION,
      database: { status: 'unavailable' },
      timestamp: new Date().toISOString()
    }, 503);
  }
});

app.post('/api/review', async (c) => {
  try {
    const body = await readJsonObject(c);
    const description = stringField(body, 'description', true);
    const agentName = stringField(body, 'agent_name', false, 200);
    const owner = stringField(body, 'owner', false, 200);
    return c.json(analyzeAgentRisk(description, agentName, owner));
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Invalid request.', 422);
  }
});

app.get('/api/agents', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Agent registry');
  if (denied) return denied;

  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
    return c.json(results.map((row: any) => ({
      ...row,
      allowed_actions: parseJsonArray(row.allowed_actions),
      restricted_actions: parseJsonArray(row.restricted_actions),
      required_controls: parseJsonArray(row.required_controls)
    })));
  } catch (error) {
    console.error(JSON.stringify({ event: 'agents_read_failed', error: String(error) }));
    return c.json({ error: 'Agent registry is unavailable.' }, 503);
  }
});

app.post('/api/agents', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Agent registry');
  if (denied) return denied;

  try {
    const body = await readJsonObject(c);
    const id = stringField(body, 'id', false, 120) || `agent-${crypto.randomUUID()}`;
    const name = stringField(body, 'name', true, 200);
    const owner = stringField(body, 'owner', true, 200);
    const purpose = stringField(body, 'purpose', true);
    const version = stringField(body, 'version', true, 80);
    const status = stringField(body, 'status', false, 20) || 'monitoring';
    const blastRadius = stringField(body, 'blast_radius', false, 20) || 'medium';
    if (!STATUS_VALUES.has(status)) throw new Error('status is invalid.');
    if (!BLAST_RADIUS_VALUES.has(blastRadius)) throw new Error('blast_radius is invalid.');

    const riskScore = finiteNumberField(body, 'risk_score', 35, 0, 100);
    const maxTransactionLimit = finiteNumberField(body, 'max_transaction_limit', 0, 0, 10_000_000);
    const allowedActions = stringArrayField(body, 'allowed_actions');
    const restrictedActions = stringArrayField(body, 'restricted_actions');
    const requiredControls = stringArrayField(body, 'required_controls');

    await c.env.DB.prepare(`
      INSERT INTO agents
        (id, name, owner, purpose, version, status, risk_score, blast_radius, allowed_actions, restricted_actions, required_controls, max_transaction_limit, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        owner = excluded.owner,
        purpose = excluded.purpose,
        version = excluded.version,
        status = excluded.status,
        risk_score = excluded.risk_score,
        blast_radius = excluded.blast_radius,
        allowed_actions = excluded.allowed_actions,
        restricted_actions = excluded.restricted_actions,
        required_controls = excluded.required_controls,
        max_transaction_limit = excluded.max_transaction_limit,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      id, name, owner, purpose, version, status, riskScore, blastRadius,
      JSON.stringify(allowedActions), JSON.stringify(restrictedActions), JSON.stringify(requiredControls), maxTransactionLimit
    ).run();

    return c.json({ success: true, id, message: 'Agent safety profile saved successfully.' });
  } catch (error) {
    console.error(JSON.stringify({ event: 'agent_write_failed', error: String(error) }));
    return jsonError(c, error instanceof Error ? error.message : 'Unable to save agent profile.', 422);
  }
});

app.get('/api/agents/:id', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Agent registry');
  if (denied) return denied;

  try {
    const agent: any = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(c.req.param('id')).first();
    if (!agent) return c.json({ error: 'Agent not found.' }, 404);
    return c.json({
      ...agent,
      allowed_actions: parseJsonArray(agent.allowed_actions),
      restricted_actions: parseJsonArray(agent.restricted_actions),
      required_controls: parseJsonArray(agent.required_controls)
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'agent_read_failed', error: String(error) }));
    return c.json({ error: 'Agent registry is unavailable.' }, 503);
  }
});

app.get('/api/policies', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Policy registry');
  if (denied) return denied;

  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM safety_policies ORDER BY severity DESC, id ASC').all();
    return c.json(results);
  } catch (error) {
    console.error(JSON.stringify({ event: 'policy_read_failed', error: String(error) }));
    return c.json({ error: 'Policy registry is unavailable.' }, 503);
  }
});

app.post('/api/validate', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Validation');
  if (denied) return denied;

  try {
    const body = await readJsonObject(c);
    const agentId = stringField(body, 'agent_id', true, 120);
    const version = stringField(body, 'version', true, 80);
    const rawAgent: any = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(agentId).first();
    if (!rawAgent) return c.json({ error: 'Agent not found.' }, 404);

    const agent = toAgentContext(rawAgent);
    const agentName = stringField(body, 'agent_name', false, 200) || agent.name;
    const report = runSafetyValidationSuite(agentId, agentName, version, agent);

    await c.env.DB.prepare(`
      INSERT INTO validation_runs
        (id, agent_id, version, status, total_tests, passed_tests, failed_tests, safety_score, recommendation, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      report.id, agentId, version, report.overall_status, report.total_tests,
      report.passed_tests, report.failed_tests + report.flagged_tests,
      report.safety_score, report.recommendation, JSON.stringify(report.suites)
    ).run();

    return c.json({ ...report, run_id: report.id });
  } catch (error) {
    console.error(JSON.stringify({ event: 'validation_failed', error: String(error) }));
    return jsonError(c, error instanceof Error ? error.message : 'Validation failed.', 422);
  }
});

app.get('/api/validate/history', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Validation history');
  if (denied) return denied;

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT v.*, a.name as agent_name
      FROM validation_runs v
      LEFT JOIN agents a ON v.agent_id = a.id
      ORDER BY v.created_at DESC LIMIT 20
    `).all();
    return c.json(results.map((row: any) => ({
      ...row,
      details_json: typeof row.details_json === 'string' ? JSON.parse(row.details_json || '{}') : row.details_json
    })));
  } catch (error) {
    console.error(JSON.stringify({ event: 'validation_history_failed', error: String(error) }));
    return c.json({ error: 'Validation history is unavailable.' }, 503);
  }
});

app.post('/api/gateway/evaluate', async (c) => {
  const denied = requireAccess(c, c.env.GATEWAY_API_KEY, 'Gateway');
  if (denied) return denied;

  try {
    const body = await readJsonObject(c);
    const agentId = stringField(body, 'agent_id', true, 120);
    const actionName = stringField(body, 'action_name', true, 160);
    const targetResource = stringField(body, 'target_resource', true, 500);
    const promptInput = stringField(body, 'prompt_input', false, 20_000);
    const payload = body.payload === undefined ? {} : body.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('payload must be a JSON object.');

    const rawAgent: any = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(agentId).first();
    if (!rawAgent) return c.json({ error: 'Unknown agent. Register a safety profile before evaluating actions.' }, 404);
    const agent = toAgentContext(rawAgent);

    const evaluation = evaluateAgentAction({
      agent_id: agentId,
      action_name: actionName,
      target_resource: targetResource,
      payload: payload as Record<string, unknown>,
      prompt_input: promptInput
    }, agent);

    const eventId = `evt-${crypto.randomUUID()}`;
    const payloadSummary = stringField(body, 'summary', false, 500) || `${actionName} on ${targetResource}`;
    const statements = [c.env.DB.prepare(`
      INSERT INTO safety_events
        (id, agent_id, action_name, target_resource, payload_summary, decision, risk_score, reasons, mitigation, latency_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventId, agentId, actionName, targetResource, payloadSummary, evaluation.decision,
      evaluation.risk_score, JSON.stringify(evaluation.reasons), evaluation.mitigation, evaluation.latency_ms
    )];

    if (evaluation.incident_created && evaluation.incident_severity) {
      const incidentId = `inc-${crypto.randomUUID()}`;
      statements.push(c.env.DB.prepare(`
        INSERT INTO incidents
          (id, agent_id, event_id, severity, title, summary, runbook_steps, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
      `).bind(
        incidentId, agentId, eventId, evaluation.incident_severity,
        `${evaluation.decision}: Unsafe ${actionName} detected for ${agent.name}`,
        evaluation.reasons.join('. '), JSON.stringify(evaluation.runbook_steps || [])
      ));
    }

    try {
      await c.env.DB.batch(statements);
    } catch (error) {
      console.error(JSON.stringify({ event: 'telemetry_write_failed', agent_id: agentId, error: String(error) }));
      return c.json({ error: 'Safety telemetry is unavailable; action was not authorized.', decision: 'REVIEW' }, 503);
    }

    return c.json({ event_id: eventId, ...evaluation });
  } catch (error) {
    console.error(JSON.stringify({ event: 'gateway_request_failed', error: String(error) }));
    return jsonError(c, error instanceof Error ? error.message : 'Gateway request failed.', 422);
  }
});

app.get('/api/dashboard/stats', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Dashboard');
  if (denied) return denied;

  try {
    const [agentsCount, protectedCount, monitoringCount, atRiskCount, totalEvents, allowedEvents, reviewEvents, blockedEvents, openIncidents, patternRows] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM agents').first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'protected'").first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'monitoring'").first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM agents WHERE status IN ('at_risk', 'quarantined')").first<{ count: number }>(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM safety_events').first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM safety_events WHERE decision = 'ALLOW'").first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM safety_events WHERE decision = 'REVIEW'").first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM safety_events WHERE decision = 'BLOCK'").first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM incidents WHERE status = 'open'").first<{ count: number }>(),
      c.env.DB.prepare(`
        SELECT CASE
          WHEN action_name IN ('send_payment', 'update_vendor_account') THEN 'Financial Operations'
          WHEN action_name IN ('disable_audit_logging', 'delete_audit_records', 'unfreeze_sanctioned_account') THEN 'Infrastructure & Privilege'
          WHEN action_name IN ('send_external_email', 'export_pii') THEN 'Data Protection'
          ELSE 'Other'
        END as category, COUNT(*) as count
        FROM safety_events
        GROUP BY category
        HAVING category != 'Other'
      `).all<{ category: string; count: number }>()
    ]);

    const total = totalEvents?.count ?? 0;
    const reviewed = reviewEvents?.count ?? 0;
    const blocked = blockedEvents?.count ?? 0;
    const organizationalPatterns = (patternRows.results || []).map((row) => ({
      category: row.category,
      pattern: row.category === 'Financial Operations'
        ? 'High-value disbursements or vendor banking mutations requiring human verification'
        : row.category === 'Infrastructure & Privilege'
          ? 'Attempts to cross administrative or audit-boundary controls'
          : 'Sensitive data egress requiring DLP enforcement',
      frequency: row.count >= 5 ? 'High' : row.count >= 2 ? 'Medium' : 'Low',
      action_status: row.category === 'Financial Operations'
        ? 'Held for dual-control verification'
        : row.category === 'Infrastructure & Privilege'
          ? 'Blocked by perimeter policy'
          : 'Blocked or redacted by DLP policy'
    }));

    return c.json({
      fleet: {
        total_agents: agentsCount?.count ?? 0,
        protected: protectedCount?.count ?? 0,
        monitoring: monitoringCount?.count ?? 0,
        at_risk: atRiskCount?.count ?? 0
      },
      telemetry: {
        total_events: total,
        allowed: allowedEvents?.count ?? 0,
        reviewed,
        blocked,
        interventions_rate: total > 0 ? Math.round(((reviewed + blocked) / total) * 100) : 0
      },
      incidents: { open_count: openIncidents?.count ?? 0 },
      organizational_patterns: organizationalPatterns
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'dashboard_stats_failed', error: String(error) }));
    return c.json({ error: 'Dashboard data is unavailable.' }, 503);
  }
});

app.get('/api/events', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Event telemetry');
  if (denied) return denied;

  const decision = c.req.query('decision');
  const agentId = c.req.query('agent_id');
  const requestedLimit = Number(c.req.query('limit') || 30);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 30;

  try {
    let query = `
      SELECT e.*, a.name as agent_name, a.owner as agent_owner
      FROM safety_events e
      LEFT JOIN agents a ON e.agent_id = a.id
    `;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (decision) {
      const normalizedDecision = decision.toUpperCase();
      if (!['ALLOW', 'REVIEW', 'BLOCK'].includes(normalizedDecision)) return c.json({ error: 'Invalid decision filter.' }, 422);
      conditions.push('e.decision = ?');
      params.push(normalizedDecision);
    }
    if (agentId) {
      conditions.push('e.agent_id = ?');
      params.push(agentId);
    }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ' ORDER BY e.timestamp DESC LIMIT ?';
    params.push(limit);

    const statement = c.env.DB.prepare(query).bind(...params);
    const { results } = await statement.all();
    return c.json(results.map((row: any) => ({ ...row, reasons: parseJsonArray(row.reasons) })));
  } catch (error) {
    console.error(JSON.stringify({ event: 'events_read_failed', error: String(error) }));
    return c.json({ error: 'Event telemetry is unavailable.' }, 503);
  }
});

app.get('/api/incidents', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Incident registry');
  if (denied) return denied;

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT i.*, a.name as agent_name, e.action_name, e.target_resource, e.timestamp as event_time
      FROM incidents i
      LEFT JOIN agents a ON i.agent_id = a.id
      LEFT JOIN safety_events e ON i.event_id = e.id
      ORDER BY i.created_at DESC
    `).all();
    return c.json(results.map((row: any) => ({ ...row, runbook_steps: parseJsonArray(row.runbook_steps) })));
  } catch (error) {
    console.error(JSON.stringify({ event: 'incidents_read_failed', error: String(error) }));
    return c.json({ error: 'Incident registry is unavailable.' }, 503);
  }
});

app.post('/api/incidents/:id/resolve', async (c) => {
  const denied = requireAccess(c, c.env.ADMIN_API_KEY, 'Incident registry');
  if (denied) return denied;

  try {
    const body = await readJsonObject(c);
    const status = stringField(body, 'status', false, 20) || 'resolved';
    if (!['acknowledged', 'resolved'].includes(status)) return c.json({ error: 'Invalid incident status.' }, 422);
    const result = await c.env.DB.prepare('UPDATE incidents SET status = ? WHERE id = ?').bind(status, c.req.param('id')).run();
    if (!result.meta.changes) return c.json({ error: 'Incident not found.' }, 404);
    return c.json({ success: true, message: `Incident ${c.req.param('id')} marked as ${status}.` });
  } catch (error) {
    console.error(JSON.stringify({ event: 'incident_update_failed', error: String(error) }));
    return jsonError(c, error instanceof Error ? error.message : 'Unable to update incident.', 422);
  }
});

export const onRequest: PagesFunction<Env> = async (context) => {
  return app.fetch(context.request, context.env, {
    waitUntil: context.waitUntil,
    passThroughOnException: context.passThroughOnException,
    props: {}
  });
};

export default app;
