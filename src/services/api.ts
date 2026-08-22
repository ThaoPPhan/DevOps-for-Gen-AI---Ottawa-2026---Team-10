import { Agent, Policy, SafetyEvent, Incident, DashboardStats, AuthSession } from '../types';

const API_BASE = '/api';

export interface ValidationHistoryRecord {
  id: string;
  agent_id: string;
  agent_name?: string;
  version: string;
  status: 'passed' | 'flagged' | 'failed';
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  flagged_tests?: number;
  safety_score: number;
  recommendation: string;
  release_decision?: 'pending' | 'approved' | 'rejected';
  release_note?: string | null;
  released_by?: string | null;
  released_at?: string | null;
  details_json: Record<string, unknown>;
  created_at: string;
}

export interface ProfileVersionRecord {
  id: string;
  agent_id: string;
  version: string;
  snapshot_json: Record<string, unknown>;
  changed_by: string;
  change_reason?: string | null;
  created_at: string;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {})
    }
  });

  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const serverMessage = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed with status ${response.status}.`;
    const message = response.status === 401 && /AUTH_REQUIRED|signed-in|organization login/i.test(serverMessage)
      ? 'Sign in through your organization login to continue.'
      : serverMessage;
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  getSession: () => requestJson<AuthSession>('/auth/session'),
  getHealth: () => requestJson<{ status: string; database: { status: string }; capabilities?: { admin_auth_configured?: boolean; gateway_auth_configured?: boolean; organization_auth_configured?: boolean; demo_mode_available?: boolean; provider?: string } }>('/health'),

  reviewAgent: (description: string, agentName?: string, owner?: string) => requestJson('/review', {
    method: 'POST',
    body: JSON.stringify({ description, agent_name: agentName, owner })
  }),

  verifyAdminKey: () => requestJson<{ authenticated: boolean; message: string }>('/auth/admin', {
    method: 'POST',
    body: JSON.stringify({})
  }),

  getAgents: (options?: { includeArchived?: boolean }) => requestJson<Agent[]>(`/agents${options?.includeArchived ? '?include_archived=true' : ''}`),

  saveAgent: (agentData: Partial<Agent>) => requestJson<{ success: boolean; id: string }>('/agents', {
    method: 'POST',
    body: JSON.stringify(agentData)
  }),

  getProfileHistory: (agentId: string) => requestJson<ProfileVersionRecord[]>(`/agents/${encodeURIComponent(agentId)}/history`),

  archiveAgent: (agentId: string) => requestJson<{ success: boolean }>(`/agents/${encodeURIComponent(agentId)}/archive`, {
    method: 'POST',
    body: JSON.stringify({})
  }),

  restoreAgent: (agentId: string) => requestJson<{ success: boolean }>(`/agents/${encodeURIComponent(agentId)}/restore`, {
    method: 'POST',
    body: JSON.stringify({})
  }),

  getPolicies: () => requestJson<Policy[]>('/policies'),

  updatePolicy: (policyId: string, enabled: boolean) => requestJson<{ success: boolean; id: string; is_enabled: boolean }>(`/policies/${encodeURIComponent(policyId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_enabled: enabled })
  }),

  validateAgent: (agentId: string, agentName: string, version: string) => requestJson('/validate', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId, agent_name: agentName, version })
  }),

  releaseValidation: (runId: string, decision: 'approve' | 'reject', note?: string) => requestJson<{ success: boolean; release_decision: 'approved' | 'rejected'; agent_status?: string; message: string }>(`/validate/${encodeURIComponent(runId)}/release`, {
    method: 'POST',
    body: JSON.stringify({ decision, note })
  }),

  getValidationHistory: () => requestJson<ValidationHistoryRecord[]>('/validate/history'),

  evaluateGateway: (payload: {
    agent_id: string;
    action_name: string;
    target_resource: string;
    payload?: Record<string, unknown>;
    prompt_input?: string;
    summary?: string;
  }) => requestJson('/gateway/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getDashboardStats: () => requestJson<DashboardStats>('/dashboard/stats'),

  getEvents: (params?: { decision?: string; agent_id?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.decision) query.set('decision', params.decision);
    if (params?.agent_id) query.set('agent_id', params.agent_id);
    if (params?.limit) query.set('limit', String(params.limit));
    return requestJson<SafetyEvent[]>(`/events?${query.toString()}`);
  },

  getIncidents: () => requestJson<Incident[]>('/incidents'),

  resolveIncident: (id: string, status: 'acknowledged' | 'resolved' = 'resolved') => requestJson<{ success: boolean }>(`/incidents/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ status })
  }),

  incidentAction: (id: string, action: 'acknowledge' | 'approve' | 'reject' | 'resolve', note?: string) => requestJson<{ success: boolean; status: string; resolution: string }>(`/incidents/${encodeURIComponent(id)}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, note })
  })
};
