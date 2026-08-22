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
  Clock,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { Agent, SafetyEvent, Incident, DashboardStats } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onSelectAgent?: (agent: Agent) => void;
}

export const CentralDashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterDecision, setFilterDecision] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, agentsData, eventsData, incidentsData] = await Promise.all([
        api.getDashboardStats(),
        api.getAgents(),
        api.getEvents({ decision: filterDecision || undefined, limit: 15 }),
        api.getIncidents()
      ]);
      setStats(statsData);
      setAgents(agentsData);
      setEvents(eventsData);
      setIncidents(incidentsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Auto-refresh telemetry
    return () => clearInterval(interval);
  }, [filterDecision]);

  const handleResolveIncident = async (id: string) => {
    setResolvingId(id);
    try {
      await api.resolveIncident(id, 'resolved');
      await loadData();
      setSelectedIncident(null);
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" /> ALLOW
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> REVIEW REQUIRED
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
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
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Protected</span>;
      case 'monitoring':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">Monitoring</span>;
      case 'at_risk':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">At-Risk</span>;
      case 'quarantined':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">Quarantined</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Hero Banner with Quick Actions */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-mono mb-3">
              <span>Cloudflare D1 & Workers Assurance Layer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Agent Continuous Safety Operations
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Centralized visibility, pre-flight safety gates, and deterministic runtime guardrails across enterprise AI agents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('review')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2"
            >
              <span>+ Risk Review New Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('simulate')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-2"
            >
              <span>Launch Live Simulator</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="glass-card p-5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Fleet Agents</span>
            <Server className="w-4 h-4 text-brand-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{stats?.fleet.total_agents ?? agents.length}</span>
            <span className="text-xs text-emerald-400 font-medium">100% telemetry synced</span>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{stats?.fleet.protected ?? 2} Protected</span>
            <span>•</span>
            <span className="text-blue-400 font-semibold">{stats?.fleet.monitoring ?? 1} Monitoring</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{stats?.fleet.at_risk ?? 1} At Risk</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Safety Interventions</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{stats?.telemetry.interventions_rate ?? 60}%</span>
            <span className="text-xs text-slate-400 font-medium">of risky actions filtered</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span className="text-amber-400 font-semibold">{stats?.telemetry.reviewed ?? 1} Held for Review</span>
            <span className="mx-1">•</span>
            <span className="text-rose-400 font-semibold">{stats?.telemetry.blocked ?? 2} Blocked</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Open Incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-400">{incidents.filter(i => i.status === 'open').length}</span>
            <span className="text-xs text-slate-400 font-medium">Require remediation</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Automated runbooks generated for all P1/P2 events</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gateway Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">11ms</span>
            <span className="text-xs text-slate-400 font-medium">Cloudflare edge eval</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Zero impact on agent LLM loop execution</span>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Fleet Inventory + Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Fleet Inventory (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">AI Agent Inventory</h2>
                <p className="text-xs text-slate-400">Continuous governance status and blast radius allocation</p>
              </div>
              <button 
                onClick={() => setActiveTab('profiles')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
              >
                <span>Manage Profiles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  className="glass-card p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{agent.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {agent.version}
                      </span>
                      {getStatusBadge(agent.status)}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{agent.purpose}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
                      <span>Owner: {agent.owner}</span>
                      <span>•</span>
                      <span>Limit: ${agent.max_transaction_limit.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-300">Risk Score</div>
                      <div className={`text-sm font-extrabold ${agent.risk_score > 60 ? 'text-rose-400' : agent.risk_score > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {agent.risk_score}/100
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('simulate')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 transition-all"
                    >
                      Simulate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organizational Insights & Patterns (Module 5) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-1">Organization-Level AI Safety Insights</h2>
            <p className="text-xs text-slate-400 mb-4">Recurring vulnerability patterns detected across multiple AI agent departments</p>

            <div className="space-y-3">
              {stats?.organizational_patterns.map((pat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-300">{pat.category}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Frequency: {pat.frequency}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium">⚠️ {pat.pattern}</p>
                  <p className="text-[11px] text-emerald-400 font-mono">🛡️ Active Assurance: {pat.action_status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Safety Events Telemetry Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Live Safety Events</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </h2>
                <p className="text-xs text-slate-400">Gateway audit feed & real-time interventions</p>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterDecision}
                  onChange={(e) => setFilterDecision(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Decisions</option>
                  <option value="ALLOW">ALLOW</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="BLOCK">BLOCK</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
              {events.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No events recorded matching filter.
                </div>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{evt.agent_name || evt.agent_id}</span>
                        <span className="font-mono text-[10px] text-slate-400">{evt.action_name}()</span>
                      </div>
                      {getDecisionBadge(evt.decision)}
                    </div>

                    <p className="text-slate-300 text-[11px] line-clamp-2 bg-slate-950/60 p-2 rounded border border-slate-800/50 font-mono">
                      {evt.payload_summary}
                    </p>

                    <div className="space-y-1 text-[11px]">
                      {evt.reasons.map((r, i) => (
                        <div key={i} className="text-slate-400 flex items-start space-x-1.5">
                          <span className="text-brand-400 font-bold">•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Latency: {evt.latency_ms}ms</span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Open Incidents Drawer / Section */}
      {incidents.filter(i => i.status !== 'resolved').length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-rose-900/50 bg-rose-950/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Active Safety Incidents & Operational Runbooks</h3>
                <p className="text-xs text-slate-400">Actions flagged or blocked by AgenticScale requiring human resolution</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.filter(i => i.status !== 'resolved').map((inc) => (
              <div key={inc.id} className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/40 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {inc.severity}
                    </span>
                    <span className="font-bold text-white">{inc.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(inc.created_at).toLocaleTimeString()}</span>
                </div>

                <p className="text-slate-300 text-xs">{inc.summary}</p>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="text-brand-300 font-semibold mb-1">Operational Runbook Remediation:</div>
                  {inc.runbook_steps.map((step, idx) => (
                    <div key={idx} className="text-slate-300">{step}</div>
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
