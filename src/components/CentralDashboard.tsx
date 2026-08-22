import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Server, 
  TrendingUp, 
  ArrowRight, 
  ChevronRight, 
  Filter, 
  Check,
  Radio
} from 'lucide-react';
import { Agent, SafetyEvent, Incident, DashboardStats } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onSelectAgent?: (agent: Agent) => void;
}

const DEFAULT_STATS: DashboardStats = {
  fleet: { total_agents: 4, protected: 2, monitoring: 1, at_risk: 1 },
  telemetry: { total_events: 5, allowed: 2, reviewed: 1, blocked: 2, interventions_rate: 60 },
  incidents: { open_count: 1 },
  organizational_patterns: [
    {
      category: 'Financial Operations',
      pattern: 'High-value disbursements exceeding threshold & unverified vendor bank updates',
      frequency: 'High',
      action_status: 'Guarded by dual-approval threshold & verification policy'
    },
    {
      category: 'Infrastructure & DevOps',
      pattern: 'Attempts to disable audit logging and modify IAM during auto-healing cycles',
      frequency: 'Medium',
      action_status: 'Permanently blocked by perimeter policy'
    },
    {
      category: 'Customer Experience Copilots',
      pattern: 'Unsanitized PII and credit card tokens in outbound communications',
      frequency: 'Medium',
      action_status: 'Sanitized and filtered via DLP boundary'
    }
  ]
};

export const CentralDashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterDecision, setFilterDecision] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, agentsData, eventsData, incidentsData] = await Promise.all([
        api.getDashboardStats().catch(() => DEFAULT_STATS),
        api.getAgents().catch(() => []),
        api.getEvents({ decision: filterDecision || undefined, limit: 10 }).catch(() => []),
        api.getIncidents().catch(() => [])
      ]);
      if (statsData && statsData.fleet) setStats(statsData);
      if (Array.isArray(agentsData) && agentsData.length > 0) setAgents(agentsData);
      if (Array.isArray(eventsData)) setEvents(eventsData);
      if (Array.isArray(incidentsData)) setIncidents(incidentsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [filterDecision]);

  const handleResolveIncident = async (id: string) => {
    setResolvingId(id);
    try {
      await api.resolveIncident(id, 'resolved');
      await loadData();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'ALLOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
            <CheckCircle className="w-3 h-3 mr-1" /> ALLOW
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 shrink-0">
            <AlertTriangle className="w-3 h-3 mr-1" /> REVIEW REQUIRED
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 shrink-0">
            <XCircle className="w-3 h-3 mr-1" /> BLOCKED
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'protected':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Protected</span>;
      case 'monitoring':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">Monitoring</span>;
      case 'at_risk':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">At-Risk</span>;
      case 'quarantined':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">Quarantined</span>;
      default:
        return null;
    }
  };

  const getRiskTierBadge = (agent: Agent) => {
    const isHigh = agent.risk_score > 60 || agent.blast_radius === 'critical' || agent.status === 'at_risk';
    const isMed = agent.risk_score > 30 || agent.blast_radius === 'high' || agent.blast_radius === 'medium';
    
    if (isHigh) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
          High Risk
        </span>
      );
    } else if (isMed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
          Medium Risk
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
          Low Risk
        </span>
      );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AI Agent Continuous Safety Operations
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 max-w-2xl">
              Centralized visibility, pre-flight behavioral validation, and real-time safety guardrails across enterprise AI agents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('review')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2"
            >
              <span>+ Risk Review New Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('simulate')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-2"
            >
              <span>Launch Simulator</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Fleet Agents</span>
            <Server className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats?.fleet?.total_agents ?? (agents.length || 4)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.fleet?.protected ?? 2} Protected</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{stats?.fleet?.monitoring ?? 1} Monitoring</span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats?.fleet?.at_risk ?? 1} At Risk</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Safety Interventions</span>
            <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats?.telemetry?.interventions_rate ?? 60}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Actions Filtered</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats?.telemetry?.reviewed ?? 1} Held for Review</span>
            <span className="mx-1">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{stats?.telemetry?.blocked ?? 2} Blocked</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {(incidents || []).filter(i => i.status === 'open').length || 1}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Require Action</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Remediation runbooks active</span>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Fleet Inventory + Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Fleet Inventory & Organizational Patterns (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Agent Inventory</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Governance status, owners, and operating boundaries</p>
              </div>
              <button 
                onClick={() => setActiveTab('profiles')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center space-x-1"
              >
                <span>View All Profiles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {(agents.length > 0 ? agents : [
                {
                  id: 'agent-invoice-01',
                  name: 'Invoice & Payment Agent',
                  owner: 'Finance & AP Team',
                  purpose: 'Process supplier invoices, extract payment details, and approve low-risk disbursements',
                  version: 'v1.4.2',
                  status: 'protected' as const,
                  risk_score: 42,
                  blast_radius: 'high' as const,
                  allowed_actions: ['read_invoice', 'extract_metadata'],
                  restricted_actions: ['disable_audit_logging'],
                  required_controls: ['human_approval_over_5k'],
                  max_transaction_limit: 5000
                },
                {
                  id: 'agent-fraud-02',
                  name: 'Fraud Analysis Agent',
                  owner: 'Risk & Trust Team',
                  purpose: 'Continuously inspect transaction patterns, score anomalies, and quarantine suspicious wallets',
                  version: 'v2.0.0-rc1',
                  status: 'monitoring' as const,
                  risk_score: 68,
                  blast_radius: 'critical' as const,
                  allowed_actions: ['inspect_transaction'],
                  restricted_actions: ['delete_audit_records'],
                  required_controls: ['dual_custody_for_unfreeze'],
                  max_transaction_limit: 0
                }
              ]).map((agent) => (
                <div 
                  key={agent.id}
                  className="glass-card p-4 rounded-xl hover:border-brand-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{agent.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {agent.version}
                      </span>
                      {getStatusBadge(agent.status)}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{agent.purpose}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                      <span>Owner: {agent.owner}</span>
                      <span>•</span>
                      <span>Limit: ${(agent.max_transaction_limit || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Risk Tier</div>
                      {getRiskTierBadge(agent)}
                    </div>
                    <button
                      onClick={() => setActiveTab('simulate')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:hover:bg-brand-600/40 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 transition-all"
                    >
                      Simulate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organizational Insights & Patterns */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Organization-Wide AI Safety Patterns</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Recurring behavioral anomalies detected across multi-department agent deployments</p>

            <div className="space-y-3">
              {(stats?.organizational_patterns || DEFAULT_STATS.organizational_patterns).map((pat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-700 dark:text-brand-300">{pat.category}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                      Frequency: {pat.frequency}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">⚠️ {pat.pattern}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">🛡️ Safeguard: {pat.action_status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Safety Events Telemetry Feed (5 cols) */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Live Safety Events</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                    Live
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gateway audit feed & real-time interventions</p>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterDecision}
                  onChange={(e) => setFilterDecision(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500 shadow-sm"
                >
                  <option value="">All Decisions</option>
                  <option value="ALLOW">ALLOW</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="BLOCK">BLOCK</option>
                </select>
              </div>
            </div>

            {/* Events Cards (No awkward internal clipping) */}
            <div className="space-y-4 pt-1">
              {(events.length > 0 ? events.slice(0, 4) : [
                {
                  id: 'evt-1001',
                  agent_id: 'agent-invoice-01',
                  agent_name: 'Invoice & Payment Agent',
                  action_name: 'read_invoice',
                  target_resource: 's3://invoices/inv-2026-8812.pdf',
                  payload_summary: 'Extracted total: $1,240.00 from Acme Logistics Inc. Validated tax ID.',
                  decision: 'ALLOW' as const,
                  risk_score: 10,
                  reasons: ['Action matches approved capability whitelist', 'Amount within pre-authorized autonomy limit ($5,000)'],
                  mitigation: 'Automatic audit record committed',
                  latency_ms: 11,
                  timestamp: new Date().toISOString()
                },
                {
                  id: 'evt-1002',
                  agent_id: 'agent-invoice-01',
                  agent_name: 'Invoice & Payment Agent',
                  action_name: 'update_vendor_account',
                  target_resource: 'vendor_db:id_9941',
                  payload_summary: 'URGENT: Changed routing to 021000021 acct #992144129. Attempted $45,000 disbursement.',
                  decision: 'REVIEW' as const,
                  risk_score: 89,
                  reasons: ['High Financial Impact ($45,000 exceeds $5,000 limit)', 'Vendor Banking Info Mutation without MFA dual-custody'],
                  mitigation: 'Execution paused. Notification dispatched to Finance Approver. Out-of-band verification required.',
                  latency_ms: 16,
                  timestamp: new Date().toISOString()
                }
              ]).map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs shadow-sm"
                >
                  {/* Row 1: Agent Name & Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {evt.agent_name || evt.agent_id}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  {/* Row 2: Action Tool Badge & Decision Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[60%]">
                      {evt.action_name}()
                    </span>
                    {getDecisionBadge(evt.decision)}
                  </div>

                  {/* Row 3: Action Description */}
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60 leading-relaxed break-words">
                    {evt.payload_summary}
                  </div>

                  {/* Row 4: Policy Reasons / Violations */}
                  {Array.isArray(evt.reasons) && evt.reasons.length > 0 && (
                    <div className="space-y-1 text-[11px]">
                      {evt.reasons.map((r, i) => (
                        <div key={i} className="text-slate-600 dark:text-slate-400 flex items-start space-x-1.5">
                          <span className="text-brand-600 dark:text-brand-400 font-bold leading-none mt-0.5">•</span>
                          <span className="leading-snug">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row 5: Clean Mitigation Banner */}
                  {evt.mitigation && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      <span className="font-semibold text-slate-800 dark:text-slate-300">Enforcement: </span>
                      <span>{evt.mitigation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom link to Simulator */}
            <div className="pt-2 text-center">
              <button
                onClick={() => setActiveTab('simulate')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold inline-flex items-center space-x-1"
              >
                <span>Test Actions in Runtime Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Open Incidents Drawer / Section */}
      {(incidents || []).filter(i => i.status !== 'resolved').length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Safety Incidents & Operational Runbooks</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Actions flagged or blocked by AgenticScale requiring human resolution</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(incidents || []).filter(i => i.status !== 'resolved').map((inc) => (
              <div key={inc.id} className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/40 space-y-3 text-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                      {inc.severity}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{inc.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(inc.created_at).toLocaleTimeString()}</span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 text-xs">{inc.summary}</p>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                  <div className="text-brand-700 dark:text-brand-300 font-semibold mb-1">Operational Runbook Remediation:</div>
                  {(Array.isArray(inc.runbook_steps) ? inc.runbook_steps : []).map((step, idx) => (
                    <div key={idx} className="text-slate-700 dark:text-slate-300">{step}</div>
                  ))}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleResolveIncident(inc.id)}
                    disabled={resolvingId === inc.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{resolvingId === inc.id ? 'Resolving...' : 'Acknowledge & Resolve'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
