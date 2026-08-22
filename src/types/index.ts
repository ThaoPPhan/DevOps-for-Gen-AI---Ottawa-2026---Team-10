export interface Agent {
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
  created_at?: string;
  updated_at?: string;
}

export interface Policy {
  id: string;
  name: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  default_action: 'ALLOW' | 'REVIEW' | 'BLOCK';
  rule_expression: string;
  remediation_guidance: string;
  is_enabled: number;
}

export interface SafetyEvent {
  id: string;
  agent_id: string;
  agent_name?: string;
  action_name: string;
  target_resource: string;
  payload_summary: string;
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  risk_score: number;
  reasons: string[];
  mitigation: string;
  latency_ms: number;
  timestamp: string;
}

export interface Incident {
  id: string;
  agent_id: string;
  agent_name?: string;
  event_id: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  summary: string;
  runbook_steps: string[];
  status: 'open' | 'acknowledged' | 'resolved';
  action_name?: string;
  target_resource?: string;
  created_at: string;
}

export interface DashboardStats {
  fleet: {
    total_agents: number;
    protected: number;
    monitoring: number;
    at_risk: number;
  };
  telemetry: {
    total_events: number;
    allowed: number;
    reviewed: number;
    blocked: number;
    interventions_rate: number;
  };
  incidents: {
    open_count: number;
  };
  organizational_patterns: {
    category: string;
    pattern: string;
    frequency: string;
    action_status: string;
  }[];
}
