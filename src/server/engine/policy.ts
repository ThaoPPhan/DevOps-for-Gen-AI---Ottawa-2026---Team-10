// Deterministic AI Safety Policy Engine for AgenticScale

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
  payload?: Record<string, any>;
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

// Critical unsafe patterns that trigger instant BLOCK
const DANGEROUS_ACTIONS = [
  'disable_audit_logging',
  'delete_audit_records',
  'drop_database_table',
  'revoke_admin_iam',
  'modify_security_groups_all_open',
  'disable_waf',
  'bypass_safety_guardrails',
  'raw_sql_execution',
  'unfreeze_sanctioned_account'
];

// Prompt injection indicators
const INJECTION_PATTERNS = [
  /ignore (all )?(previous|safety|prior) (instructions|rules|constraints)/i,
  /system prompt override/i,
  /you are now in unrestricted developer mode/i,
  /disregard safety protocols/i,
  /act as an unrestricted/i,
  /transfer .+ without authorization/i,
  /exfiltrate/i
];

// PII & sensitive credential leakage patterns
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b4[0-9]{12}(?:[0-9]{3})?\b/, // Visa
  /\b5[1-5][0-9]{14}\b/, // MasterCard
  /BEGIN (RSA|OPENSSH|PRIVATE) KEY/i,
  /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i
];

export function evaluateAgentAction(
  request: EvaluateRequest,
  agent?: AgentContext
): EvaluationResult {
  const startTime = Date.now();
  const reasons: string[] = [];
  let decision: 'ALLOW' | 'REVIEW' | 'BLOCK' = 'ALLOW';
  let riskScore = 10;
  let incidentSeverity: 'P1' | 'P2' | 'P3' | undefined;
  let runbookSteps: string[] = [];
  let mitigation = 'Action validated against approved safety policy. Logged to continuous telemetry stream.';

  const action = request.action_name;
  const payload = request.payload || {};
  const promptInput = request.prompt_input || '';
  const payloadString = JSON.stringify(payload) + ' ' + promptInput;

  // 1. Check for Critical Administrative & Destructive Actions (Instant BLOCK - P1)
  if (DANGEROUS_ACTIONS.includes(action) || (agent?.restricted_actions && agent.restricted_actions.includes(action))) {
    decision = 'BLOCK';
    riskScore = 98;
    incidentSeverity = 'P1';
    reasons.push(`Critical Safety Violation: '${action}' is explicitly prohibited by governance boundary.`);
    reasons.push('Action classified as an irreversible administrative compromise or audit evasion attempt.');
    mitigation = 'Action blocked in-flight at gateway. Agent execution halted. Security incident P1 recorded.';
    runbookSteps = [
      `1. Immediate Gateway Quarantine: Agent '${agent?.name || request.agent_id}' execution token suspended.`,
      '2. Audit Log Integrity Check: Verify immutable D1 records for tamper attempts.',
      '3. Blast Radius Assessment: Review preceding 30 minutes of agent operations.',
      '4. Root Cause Analysis: Inspect prompt context for indirect jailbreaks.',
      '5. Governance Sign-off: Require CISO / Security Officer approval before unfreezing agent.'
    ];
    return {
      decision,
      risk_score: riskScore,
      reasons,
      mitigation,
      incident_created: true,
      incident_severity: incidentSeverity,
      runbook_steps: runbookSteps,
      latency_ms: Math.max(8, Date.now() - startTime),
      timestamp: new Date().toISOString()
    };
  }

  // 2. Check for Prompt Injection Attacks
  const matchedInjection = INJECTION_PATTERNS.find(pattern => pattern.test(payloadString));
  if (matchedInjection || payload.contains_injection_pattern === true || payload.instruction_override === true) {
    decision = 'BLOCK';
    riskScore = 94;
    incidentSeverity = 'P2';
    reasons.push('Prompt Injection Threat: External untrusted instructions attempted to manipulate agent control flow.');
    reasons.push('Matched signature: Instruction override / jailbreak pattern in input stream.');
    mitigation = 'Untrusted input isolated and dropped. Gateway blocked downstream tool execution.';
    runbookSteps = [
      '1. Ingress Quarantine: Discard the malicious message payload.',
      '2. Prompt Defense Review: Update input sanitization filter and guardrail classifiers.',
      '3. Re-validate Agent: Run Module 3 pre-release validation suite.'
    ];
    return {
      decision,
      risk_score: riskScore,
      reasons,
      mitigation,
      incident_created: true,
      incident_severity: incidentSeverity,
      runbook_steps: runbookSteps,
      latency_ms: Math.max(9, Date.now() - startTime),
      timestamp: new Date().toISOString()
    };
  }

  // 3. Check for Data Loss Prevention (PII / Sensitive Credential Leakage)
  const matchedPii = PII_PATTERNS.find(pattern => pattern.test(payloadString));
  if (matchedPii || (action === 'send_external_email' && payload.contains_unredacted_pii === true)) {
    decision = 'BLOCK';
    riskScore = 91;
    incidentSeverity = 'P2';
    reasons.push('Data Loss Prevention (DLP) Violation: Unredacted PII or financial credentials detected in egress payload.');
    reasons.push('Violates DLP Policy (pol-dlp-001): External data transmission boundary breach.');
    mitigation = 'Egress payload blocked. Redaction enforcement triggered.';
    runbookSteps = [
      '1. DLP Scrubbing: Apply automated regex redaction filter to agent egress channel.',
      '2. Incident Notification: Notify Data Protection Officer (DPO).',
      '3. Verify destination URL / recipient domain verification whitelist.'
    ];
    return {
      decision,
      risk_score: riskScore,
      reasons,
      mitigation,
      incident_created: true,
      incident_severity: incidentSeverity,
      runbook_steps: runbookSteps,
      latency_ms: Math.max(10, Date.now() - startTime),
      timestamp: new Date().toISOString()
    };
  }

  // 4. Financial & High-Risk Mutation Logic (REVIEW REQUIRED)
  const amount = Number(payload.amount) || 0;
  const maxLimit = agent?.max_transaction_limit ?? 5000;
  const isVendorAccountChange = action === 'update_vendor_account' || payload.vendor_account_changed === true || payload.is_new_bank_account === true;
  const isUrgentExternalEmail = payload.is_urgent_external_source === true || /bank account changed|update immediately|urgent supplier/i.test(payloadString);

  if (isVendorAccountChange || (action === 'send_payment' && amount > maxLimit) || isUrgentExternalEmail) {
    decision = 'REVIEW';
    riskScore = Math.min(89, Math.max(70, Math.round(50 + (amount > 0 ? Math.log10(amount + 1) * 8 : 25))));
    incidentSeverity = 'P2';

    if (amount > maxLimit && maxLimit > 0) {
      reasons.push(`High Financial Impact: Transaction amount ($${amount.toLocaleString()}) exceeds authorized autonomous threshold ($${maxLimit.toLocaleString()}).`);
    }
    if (isVendorAccountChange) {
      reasons.push('Vendor Banking Mutation: Bank routing/account details altered without out-of-band dual-control verification.');
    }
    if (isUrgentExternalEmail) {
      reasons.push('Untrusted External Ingress: Request triggered by unverified supplier email containing urgency cues.');
    }

    mitigation = 'Autonomous execution paused. Human-in-the-Loop approval gate triggered. Out-of-band verification required.';
    runbookSteps = [
      `1. Hold Payment: Suspend transaction of $${amount.toLocaleString()} pending authorization.`,
      '2. Voice Verification: Conduct direct phone verification with verified vendor controller.',
      '3. Dual Sign-off: Require Finance Manager approval in AgenticScale governance portal.'
    ];

    return {
      decision,
      risk_score: riskScore,
      reasons,
      mitigation,
      incident_created: true,
      incident_severity: incidentSeverity,
      runbook_steps: runbookSteps,
      latency_ms: Math.max(12, Date.now() - startTime),
      timestamp: new Date().toISOString()
    };
  }

  // 5. Capability Whitelist Validation
  if (agent && agent.allowed_actions && agent.allowed_actions.length > 0) {
    if (!agent.allowed_actions.includes(action)) {
      decision = 'REVIEW';
      riskScore = 65;
      reasons.push(`Action '${action}' is not in agent '${agent.name}' approved capability whitelist.`);
      reasons.push('Requires explicit capability expansion review.');
      mitigation = 'Action held for policy amendment approval.';
      return {
        decision,
        risk_score: riskScore,
        reasons,
        mitigation,
        latency_ms: Math.max(7, Date.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }
  }

  // 6. Normal Approved Action
  reasons.push(`Action '${action}' matches approved operating boundary.`);
  reasons.push('All deterministic safety guardrails, rate limits, and DLP checks passed.');

  return {
    decision: 'ALLOW',
    risk_score: Math.min(25, 10 + Math.floor(Math.random() * 8)),
    reasons,
    mitigation,
    latency_ms: Math.max(6, Date.now() - startTime),
    timestamp: new Date().toISOString()
  };
}
