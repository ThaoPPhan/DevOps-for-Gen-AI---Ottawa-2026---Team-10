import { Agent, Policy, SafetyEvent, Incident, DashboardStats } from '../types';

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
  safety_score: number;
  recommendation: string;
  details_json: Record<string, unknown>;
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
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  getHealth: () => requestJson<{ status: string; database: { status: string } }>('/health'),

  reviewAgent: (description: string, agentName?: string, owner?: string) => requestJson('/review', {
    method: 'POST',
    body: JSON.stringify({ description, agent_name: agentName, owner })
  }),

  getAgents: () => requestJson<Agent[]>('/agents'),

  saveAgent: (agentData: Partial<Agent>) => requestJson<{ success: boolean; id: string }>('/agents', {
    method: 'POST',
    body: JSON.stringify(agentData)
  }),

  getPolicies: () => requestJson<Policy[]>('/policies'),

  validateAgent: (agentId: string, agentName: string, version: string) => requestJson('/validate', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId, agent_name: agentName, version })
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
  })
};
