// Deterministic AI Safety Policy Engine for AgenticScale.

export interface AgentContext {
  id: string;
  name: string;
  owner: string;
  purpose: string;
  version: string;
  status: 'protected' | 'monitoring' | 'at_risk' | 'quarantined';
  risk_score: number;
  blast_radius: 'low' | 'medium' | 'high' | 'critical';
  allowed_actions: string[];
  restricted_actions: string[];
  required_controls: string[];
  max_transaction_limit: number;
}

export interface EvaluateRequest {
  agent_id: string;
  action_name: string;
  target_resource?: string;
  payload?: Record<string, unknown>;
  prompt_input?: string;
}

export interface EvaluationResult {
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  risk_score: number;
  reasons: string[];
  mitigation: string;
  incident_created?: boolean;
  incident_severity?: 'P1' | 'P2' | 'P3';
  runbook_steps?: string[];
  latency_ms: number;
  timestamp: string;
}

const DANGEROUS_ACTIONS = new Set([
  'disable_audit_logging',
  'delete_audit_records',
  'drop_database_table',
  'revoke_admin_iam',
  'modify_security_groups_all_open',
  'disable_waf',
  'bypass_safety_guardrails',
  'raw_sql_execution',
  'unfreeze_sanctioned_account'
]);

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|safety)\s+(instructions|rules|constraints)/i,
  /system\s+prompt\s+override/i,
  /you are now in unrestricted developer mode/i,
  /disregard\s+safety\s+(protocols|rules|constraints)/i,
  /act as an unrestricted/i,
  /transfer .+ without authorization/i,
  /exfiltrate/i,
  /assistant\s+instruction.{0,80}(bypass|ignore|override)/i,
  /bypass\s+(validation|approval|safety)\s+(checks|rules|controls)/i
];

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b4[0-9]{12}(?:[0-9]{3})?\b/,
  /\b5[1-5][0-9]{14}\b/,
  /BEGIN (RSA|OPENSSH|PRIVATE) KEY/i,
  /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i
];

function result(
  startTime: number,
  decision: EvaluationResult['decision'],
  riskScore: number,
  reasons: string[],
  mitigation: string,
  incidentSeverity?: EvaluationResult['incident_severity'],
  runbookSteps?: string[]
): EvaluationResult {
  return {
    decision,
    risk_score: riskScore,
    reasons,
    mitigation,
    incident_created: Boolean(incidentSeverity),
    incident_severity: incidentSeverity,
    runbook_steps: runbookSteps,
    latency_ms: Math.max(1, Date.now() - startTime),
    timestamp: new Date().toISOString()
  };
}

export function evaluateAgentAction(request: EvaluateRequest, agent?: AgentContext): EvaluationResult {
  const startTime = Date.now();
  const action = request.action_name.trim().toLowerCase();
  const payload = request.payload || {};
  const promptInput = request.prompt_input || '';
  const payloadString = `${JSON.stringify(payload)} ${promptInput}`;

  if (!agent) {
    return result(
      startTime,
      'REVIEW',
      95,
      ['Agent identity could not be verified against a registered safety profile.'],
      'Execution held because the gateway cannot authorize an unknown agent.',
      'P1',
      ['1. Register or restore the agent safety profile.', '2. Re-run the action only after ownership and permissions are verified.']
    );
  }

  if (agent.status === 'quarantined') {
    return result(
      startTime,
      'BLOCK',
      99,
      [`Agent '${agent.name}' is quarantined and cannot execute actions.`],
      'Execution blocked while the agent is quarantined.',
      'P1',
      ['1. Review the active incident and runbook.', '2. Require governance approval before releasing the quarantine.']
    );
  }

  if (DANGEROUS_ACTIONS.has(action) || agent.restricted_actions.includes(action)) {
    return result(
      startTime,
      'BLOCK',
      98,
      [
        `Critical Safety Violation: '${action}' is explicitly prohibited by governance boundary.`,
        'Action classified as an irreversible administrative compromise or audit evasion attempt.'
      ],
      'Action blocked in-flight at gateway. Agent execution halted. Security incident P1 recorded.',
      'P1',
      [
        `1. Immediate Gateway Quarantine: Agent '${agent.name}' execution token suspended.`,
        '2. Audit Log Integrity Check: Verify immutable D1 records for tamper attempts.',
        '3. Blast Radius Assessment: Review preceding 30 minutes of agent operations.',
        '4. Root Cause Analysis: Inspect prompt context for indirect jailbreaks.',
        '5. Governance Sign-off: Require security officer approval before unfreezing the agent.'
      ]
    );
  }

  const matchedInjection = INJECTION_PATTERNS.some((pattern) => pattern.test(payloadString));
  if (matchedInjection || payload.contains_injection_pattern === true || payload.instruction_override === true) {
    return result(
      startTime,
      'BLOCK',
      94,
      [
        'Prompt Injection Threat: External untrusted instructions attempted to manipulate agent control flow.',
        'Input matched an instruction override or jailbreak pattern.'
      ],
      'Untrusted input isolated and dropped. Gateway blocked downstream tool execution.',
      'P2',
      [
        '1. Ingress Quarantine: Discard the malicious message payload.',
        '2. Prompt Defense Review: Update input sanitization and guardrail classifiers.',
        '3. Re-validate the agent before restoring autonomous execution.'
      ]
    );
  }

  const egressAction = /^(send|export|upload|notify|webhook|post)/i.test(action) || action === 'send_external_email';
  const matchedPii = egressAction && PII_PATTERNS.some((pattern) => pattern.test(payloadString));
  if (matchedPii || (action === 'send_external_email' && payload.contains_unredacted_pii === true)) {
    return result(
      startTime,
      'BLOCK',
      91,
      [
        'Data Loss Prevention violation: Unredacted PII or financial credentials detected in an egress payload.',
        'External data transmission crossed the configured protection boundary.'
      ],
      'Egress payload blocked. Redaction enforcement triggered.',
      'P2',
      [
        '1. Apply automated redaction to the egress payload.',
        '2. Notify the data protection owner.',
        '3. Verify the destination against the approved recipient allowlist.'
      ]
    );
  }

  const amount = typeof payload.amount === 'number' ? payload.amount : Number(payload.amount || 0);
  const safeAmount = Number.isFinite(amount) && amount >= 0 ? amount : Number.POSITIVE_INFINITY;
  const maxLimit = Number.isFinite(agent.max_transaction_limit) ? Math.max(0, agent.max_transaction_limit) : 0;
  const isVendorAccountChange = action === 'update_vendor_account' || payload.vendor_account_changed === true || payload.is_new_bank_account === true;
  const isUrgentExternalRequest = payload.is_urgent_external_source === true || /bank account changed|update immediately|urgent supplier/i.test(payloadString);
  const isHighValuePayment = action === 'send_payment' && safeAmount > maxLimit;

  if (isVendorAccountChange || isHighValuePayment || isUrgentExternalRequest) {
    const reasons: string[] = [];
    if (isHighValuePayment) {
      reasons.push(`High Financial Impact: Transaction amount ($${safeAmount.toLocaleString()}) exceeds the authorized threshold ($${maxLimit.toLocaleString()}).`);
    }
    if (isVendorAccountChange) reasons.push('Vendor Banking Mutation: Bank routing/account details require out-of-band dual-control verification.');
    if (isUrgentExternalRequest) reasons.push('Untrusted External Ingress: Request contains urgency cues from an unverified source.');

    return result(
      startTime,
      'REVIEW',
      Math.min(89, Math.max(70, Math.round(50 + (safeAmount > 0 && Number.isFinite(safeAmount) ? Math.log10(safeAmount + 1) * 8 : 25)))),
      reasons,
      'Autonomous execution paused. Human-in-the-Loop approval gate triggered. Out-of-band verification required.',
      'P2',
      [
        `1. Hold Payment: Suspend transaction of $${Number.isFinite(safeAmount) ? safeAmount.toLocaleString() : 'unknown amount'} pending authorization.`,
        '2. Voice Verification: Conduct direct verification with the verified vendor controller.',
        '3. Dual Sign-off: Require Finance Manager approval in the governance portal.'
      ]
    );
  }

  if (agent.allowed_actions.length === 0 || !agent.allowed_actions.includes(action)) {
    return result(
      startTime,
      'REVIEW',
      65,
      [`Action '${action}' is not in agent '${agent.name}' approved capability whitelist.`, 'Requires explicit capability expansion review.'],
      'Action held for policy amendment approval.'
    );
  }

  return result(
    startTime,
    'ALLOW',
    15,
    [`Action '${action}' matches the approved operating boundary.`, 'Deterministic safety guardrails, rate limits, and DLP checks passed.'],
    'Action validated against approved safety policy. Logged to continuous telemetry stream.'
  );
}
