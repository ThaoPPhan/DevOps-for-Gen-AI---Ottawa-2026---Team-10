// Cloudflare Pages Function API Handler powered by Hono

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { evaluateAgentAction, AgentContext } from '../../src/server/engine/policy';
import { analyzeAgentRisk } from '../../src/server/engine/risk';
import { runSafetyValidationSuite } from '../../src/server/engine/validator';

export interface Env {
  DB: D1Database;
  AGENTICSCALE_KV: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// 1. Health & System Diagnostic
app.get('/api/health', async (c) => {
  let dbStatus = 'connected';
  let agentsCount = 0;
  try {
    if (c.env.DB) {
      const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM agents').first<{ count: number }>();
      agentsCount = result?.count || 0;
    }
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  return c.json({
    status: 'online',
    version: '1.0.0',
    platform: 'AgenticScale Continuous Safety Assurance',
    runtime: 'Cloudflare Workers / Pages Edge',
    database: {
      status: dbStatus,
      registered_agents: agentsCount
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Module 1: AI Agent Risk Review
app.post('/api/review', async (c) => {
  const body = await c.req.json();
  const description = body.description || '';
  const agentName = body.agent_name || '';
  const owner = body.owner || '';

  if (!description.trim()) {
    return c.json({ error: 'Agent description is required for risk review.' }, 400);
  }

  const analysis = analyzeAgentRisk(description, agentName, owner);
  return c.json(analysis);
});

// 3. Module 2: Agent Safety Profiles & Registry
app.get('/api/agents', async (c) => {
  try {
    if (c.env.DB) {
      const { results } = await c.env.DB.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
      const parsed = results.map((row: any) => ({
        ...row,
        allowed_actions: JSON.parse(row.allowed_actions || '[]'),
        restricted_actions: JSON.parse(row.restricted_actions || '[]'),
        required_controls: JSON.parse(row.required_controls || '[]')
      }));
      return c.json(parsed);
    }
  } catch (err: any) {
    console.error('Error fetching agents:', err);
  }
  return c.json([]);
});

app.post('/api/agents', async (c) => {
  const body = await c.req.json();
  const id = body.id || `agent-${Date.now().toString(36)}`;
  const name = body.name || 'Untitled Agent';
  const owner = body.owner || 'Operations';
  const purpose = body.purpose || '';
  const version = body.version || 'v1.0.0';
  const status = body.status || 'protected';
  const risk_score = body.risk_score ?? 35;
  const blast_radius = body.blast_radius || 'medium';
  const allowed_actions = JSON.stringify(body.allowed_actions || []);
  const restricted_actions = JSON.stringify(body.restricted_actions || []);
  const required_controls = JSON.stringify(body.required_controls || []);
  const max_transaction_limit = body.max_transaction_limit ?? 5000;

  try {
    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO agents 
        (id, name, owner, purpose, version, status, risk_score, blast_radius, allowed_actions, restricted_actions, required_controls, max_transaction_limit, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        id, name, owner, purpose, version, status, risk_score, blast_radius,
        allowed_actions, restricted_actions, required_controls, max_transaction_limit
      ).run();

      return c.json({ success: true, id, message: 'Agent safety profile saved successfully.' });
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }

  return c.json({ success: true, id, message: 'Agent saved.' });
});

app.get('/api/agents/:id', async (c) => {
  const id = c.req.param('id');
  try {
    if (c.env.DB) {
      const agent: any = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(id).first();
      if (!agent) {
        return c.json({ error: 'Agent not found' }, 404);
      }
      return c.json({
        ...agent,
        allowed_actions: JSON.parse(agent.allowed_actions || '[]'),
        restricted_actions: JSON.parse(agent.restricted_actions || '[]'),
        required_controls: JSON.parse(agent.required_controls || '[]')
      });
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
  return c.json({ error: 'Database unavailable' }, 500);
});

// 4. Safety Policies
app.get('/api/policies', async (c) => {
  try {
    if (c.env.DB) {
      const { results } = await c.env.DB.prepare('SELECT * FROM safety_policies ORDER BY severity DESC').all();
      return c.json(results);
    }
  } catch (err: any) {
    console.error('Error fetching policies:', err);
  }
  return c.json([]);
});

// 5. Module 3: Pre-Release Safety Validation
app.post('/api/validate', async (c) => {
  const body = await c.req.json();
  const agentId = body.agent_id || 'agent-fraud-02';
  const agentName = body.agent_name || 'Fraud Analysis Agent';
  const version = body.version || 'v2.0.0-rc1';

  const report = runSafetyValidationSuite(agentId, agentName, version);

  // Store validation run in D1
  try {
    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT INTO validation_runs 
        (id, agent_id, version, status, total_tests, passed_tests, failed_tests, safety_score, recommendation, details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        report.id,
        agentId,
        version,
        report.overall_status,
        report.total_tests,
        report.passed_tests,
        report.failed_tests + report.flagged_tests,
        report.safety_score,
        report.recommendation,
        JSON.stringify(report.suites)
      ).run();
    }
  } catch (err: any) {
    console.error('Failed to log validation run:', err);
  }

  return c.json(report);
});

app.get('/api/validate/history', async (c) => {
  try {
    if (c.env.DB) {
      const { results } = await c.env.DB.prepare(`
        SELECT v.*, a.name as agent_name 
        FROM validation_runs v
        LEFT JOIN agents a ON v.agent_id = a.id
        ORDER BY v.created_at DESC LIMIT 20
      `).all();
      return c.json(results.map((r: any) => ({
        ...r,
        details_json: JSON.parse(r.details_json || '{}')
      })));
    }
  } catch (err: any) {
    console.error('Error fetching validation history:', err);
  }
  return c.json([]);
});

// 6. Module 4: Runtime Safety Gateway Evaluator
app.post('/api/gateway/evaluate', async (c) => {
  const body = await c.req.json();
  const agentId = body.agent_id || 'agent-invoice-01';
  const actionName = body.action_name || 'read_invoice';
  const targetResource = body.target_resource || 's3://invoices/doc-01.pdf';
  const payload = body.payload || {};
  const promptInput = body.prompt_input || '';

  let agentContext: AgentContext | undefined;

  try {
    if (c.env.DB) {
      const raw: any = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(agentId).first();
      if (raw) {
        agentContext = {
          ...raw,
          allowed_actions: JSON.parse(raw.allowed_actions || '[]'),
          restricted_actions: JSON.parse(raw.restricted_actions || '[]'),
          required_controls: JSON.parse(raw.required_controls || '[]')
        };
      }
    }
  } catch (err) {
    console.error('Could not fetch agent context from D1, using fallback evaluation', err);
  }

  const evaluation = evaluateAgentAction({
    agent_id: agentId,
    action_name: actionName,
    target_resource: targetResource,
    payload,
    prompt_input: promptInput
  }, agentContext);

  const eventId = `evt-${Date.now().toString(36)}`;
  const payloadSummary = body.summary || (promptInput ? `Prompt: "${promptInput.slice(0, 100)}..."` : `${actionName} on ${targetResource}`);

  // Persist Safety Event in D1
  try {
    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT INTO safety_events 
        (id, agent_id, action_name, target_resource, payload_summary, decision, risk_score, reasons, mitigation, latency_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        agentId,
        actionName,
        targetResource,
        payloadSummary,
        evaluation.decision,
        evaluation.risk_score,
        JSON.stringify(evaluation.reasons),
        evaluation.mitigation,
        evaluation.latency_ms
      ).run();

      // Create Incident if flagged or blocked
      if (evaluation.incident_created && evaluation.incident_severity) {
        const incidentId = `inc-${Date.now().toString(36)}`;
        await c.env.DB.prepare(`
          INSERT INTO incidents
          (id, agent_id, event_id, severity, title, summary, runbook_steps, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
        `).bind(
          incidentId,
          agentId,
          eventId,
          evaluation.incident_severity,
          `${evaluation.decision}: Unsafe ${actionName} detected for ${agentContext?.name || agentId}`,
          evaluation.reasons.join('. '),
          JSON.stringify(evaluation.runbook_steps || [])
        ).run();
      }
    }
  } catch (err: any) {
    console.error('Failed to log safety event:', err);
  }

  return c.json({
    event_id: eventId,
    ...evaluation
  });
});

// 7. Module 5: Central Safety Dashboard Telemetry & Stats
app.get('/api/dashboard/stats', async (c) => {
  try {
    if (c.env.DB) {
      const agentsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM agents').first<{ count: number }>();
      const protectedCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'protected'").first<{ count: number }>();
      const monitoringCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'monitoring'").first<{ count: number }>();
      const atRiskCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM agents WHERE status IN ('at_risk', 'quarantined')").first<{ count: number }>();

      const totalEvents = await c.env.DB.prepare('SELECT COUNT(*) as count FROM safety_events').first<{ count: number }>();
      const allowedEvents = await c.env.DB.prepare("SELECT COUNT(*) as count FROM safety_events WHERE decision = 'ALLOW'").first<{ count: number }>();
      const reviewEvents = await c.env.DB.prepare("SELECT COUNT(*) as count FROM safety_events WHERE decision = 'REVIEW'").first<{ count: number }>();
      const blockedEvents = await c.env.DB.prepare("SELECT COUNT(*) as count FROM safety_events WHERE decision = 'BLOCK'").first<{ count: number }>();

      const openIncidents = await c.env.DB.prepare("SELECT COUNT(*) as count FROM incidents WHERE status = 'open'").first<{ count: number }>();

      return c.json({
        fleet: {
          total_agents: agentsCount?.count || 4,
          protected: protectedCount?.count || 2,
          monitoring: monitoringCount?.count || 1,
          at_risk: atRiskCount?.count || 1
        },
        telemetry: {
          total_events: totalEvents?.count || 0,
          allowed: allowedEvents?.count || 0,
          reviewed: reviewEvents?.count || 0,
          blocked: blockedEvents?.count || 0,
          interventions_rate: totalEvents?.count ? Math.round(((reviewEvents?.count || 0) + (blockedEvents?.count || 0)) / totalEvents.count * 100) : 40
        },
        incidents: {
          open_count: openIncidents?.count || 0
        },
        organizational_patterns: [
          {
            category: 'Financial Agents',
            pattern: 'High-Value disbursements exceeding threshold & unverified vendor bank updates',
            frequency: 'High',
            action_status: 'Guarded by dual-approval threshold & phone verification policy'
          },
          {
            category: 'DevOps & Cloud Agents',
            pattern: 'Attempts to disable audit logging and modify IAM during auto-healing cycles',
            frequency: 'Medium',
            action_status: 'Permanently blocked by perimeter policy pol-adm-001'
          },
          {
            category: 'Customer Support & Email Copilots',
            pattern: 'Unsanitized PII and credit card tokens in outbound communications',
            frequency: 'Medium',
            action_status: 'Sanitized and filtered via DLP boundary'
          }
        ]
      });
    }
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
  }

  return c.json({
    fleet: { total_agents: 4, protected: 2, monitoring: 1, at_risk: 1 },
    telemetry: { total_events: 5, allowed: 2, reviewed: 1, blocked: 2, interventions_rate: 60 },
    incidents: { open_count: 1 }
  });
});

// 8. Live Events Log
app.get('/api/events', async (c) => {
  const decision = c.req.query('decision');
  const agentId = c.req.query('agent_id');
  const limit = Number(c.req.query('limit')) || 30;

  try {
    if (c.env.DB) {
      let query = `
        SELECT e.*, a.name as agent_name, a.owner as agent_owner
        FROM safety_events e
        LEFT JOIN agents a ON e.agent_id = a.id
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      if (decision) {
        conditions.push('e.decision = ?');
        params.push(decision.toUpperCase());
      }
      if (agentId) {
        conditions.push('e.agent_id = ?');
        params.push(agentId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY e.timestamp DESC LIMIT ?';
      params.push(limit);

      const stmt = c.env.DB.prepare(query);
      const { results } = await (params.length > 0 ? stmt.bind(...params).all() : stmt.all());

      const formatted = results.map((r: any) => ({
        ...r,
        reasons: JSON.parse(r.reasons || '[]')
      }));

      return c.json(formatted);
    }
  } catch (err: any) {
    console.error('Error fetching events:', err);
  }
  return c.json([]);
});

// 9. Incidents & Runbooks
app.get('/api/incidents', async (c) => {
  try {
    if (c.env.DB) {
      const { results } = await c.env.DB.prepare(`
        SELECT i.*, a.name as agent_name, e.action_name, e.target_resource, e.timestamp as event_time
        FROM incidents i
        LEFT JOIN agents a ON i.agent_id = a.id
        LEFT JOIN safety_events e ON i.event_id = e.id
        ORDER BY i.created_at DESC
      `).all();

      return c.json(results.map((r: any) => ({
        ...r,
        runbook_steps: JSON.parse(r.runbook_steps || '[]')
      })));
    }
  } catch (err: any) {
    console.error('Error fetching incidents:', err);
  }
  return c.json([]);
});

app.post('/api/incidents/:id/resolve', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const status = body.status || 'resolved';

  try {
    if (c.env.DB) {
      await c.env.DB.prepare('UPDATE incidents SET status = ? WHERE id = ?').bind(status, id).run();
      return c.json({ success: true, message: `Incident ${id} marked as ${status}` });
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }

  return c.json({ success: true });
});

// Cloudflare Pages Functions entry point
export const onRequest: PagesFunction<Env> = async (context) => {
  return app.fetch(context.request, context.env, context);
};

export default app;
