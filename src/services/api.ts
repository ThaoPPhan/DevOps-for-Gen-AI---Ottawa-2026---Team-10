import { Agent, Policy, SafetyEvent, Incident, DashboardStats } from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async reviewAgent(description: string, agentName?: string, owner?: string) {
    const res = await fetch(`${API_BASE}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, agent_name: agentName, owner })
    });
    return res.json();
  },

  async getAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE}/agents`);
    return res.json();
  },

  async saveAgent(agentData: Partial<Agent>) {
    const res = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData)
    });
    return res.json();
  },

  async getPolicies(): Promise<Policy[]> {
    const res = await fetch(`${API_BASE}/policies`);
    return res.json();
  },

  async validateAgent(agentId: string, agentName: string, version: string) {
    const res = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, agent_name: agentName, version })
    });
    return res.json();
  },

  async getValidationHistory() {
    const res = await fetch(`${API_BASE}/validate/history`);
    return res.json();
  },

  async evaluateGateway(payload: {
    agent_id: string;
    action_name: string;
    target_resource?: string;
    payload?: Record<string, any>;
    prompt_input?: string;
    summary?: string;
  }) {
    const res = await fetch(`${API_BASE}/gateway/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return res.json();
  },

  async getEvents(params?: { decision?: string; agent_id?: string; limit?: number }): Promise<SafetyEvent[]> {
    const query = new URLSearchParams();
    if (params?.decision) query.set('decision', params.decision);
    if (params?.agent_id) query.set('agent_id', params.agent_id);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/events?${query.toString()}`);
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    return res.json();
  },

  async resolveIncident(id: string, status: string = 'resolved') {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  }
};
