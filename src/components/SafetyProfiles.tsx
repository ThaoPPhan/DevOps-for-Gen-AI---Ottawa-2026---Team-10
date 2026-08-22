import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Plus, 
  Save, 
  Check, 
  DollarSign,
  Archive,
} from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';

interface ProfilesProps {
  setActiveTab: (tab: string) => void;
}

export const SafetyProfiles: React.FC<ProfilesProps> = ({ setActiveTab }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [archivedAgents, setArchivedAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Edit form state
  const [editName, setEditName] = useState<string>('');
  const [editOwner, setEditOwner] = useState<string>('');
  const [editPurpose, setEditPurpose] = useState<string>('');
  const [editVersion, setEditVersion] = useState<string>('v1.0.0');
  const [editStatus, setEditStatus] = useState<'protected' | 'monitoring' | 'at_risk' | 'quarantined'>('protected');
  const [editRiskTier, setEditRiskTier] = useState<string>('medium');
  const [editBlastRadius, setEditBlastRadius] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [editLimit, setEditLimit] = useState<number>(5000);
  const [allowedActionsText, setAllowedActionsText] = useState<string>('');
  const [restrictedActionsText, setRestrictedActionsText] = useState<string>('');
  const [controlsText, setControlsText] = useState<string>('');
  const [changeReason, setChangeReason] = useState<string>('');
  const [profileHistory, setProfileHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const loadProfileHistory = async (agentId: string) => {
    setHistoryLoading(true);
    try {
      setProfileHistory(await api.getProfileHistory(agentId));
    } catch (err) {
      console.error('Error fetching profile history:', err);
      setProfileHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAgents({ includeArchived: true });
      const activeAgents = data.filter((agent) => !agent.archived_at);
      const archived = data.filter((agent) => Boolean(agent.archived_at));
      setAgents(activeAgents);
      setArchivedAgents(archived);
      const refreshedSelection = selectedAgent ? activeAgents.find((agent) => agent.id === selectedAgent.id) : activeAgents[0];
      if (refreshedSelection) {
        setSelectedAgent(refreshedSelection);
        if (!selectedAgent) {
          selectAgentForEdit(refreshedSelection);
        } else {
          void loadProfileHistory(refreshedSelection.id);
        }
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'Agent profiles are unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const selectAgentForEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditName(agent.name);
    setEditOwner(agent.owner);
    setEditPurpose(agent.purpose);
    setEditVersion(agent.version);
    setEditStatus(agent.status);
    setEditRiskTier(agent.risk_score > 60 ? 'high' : agent.risk_score > 30 ? 'medium' : 'low');
    setEditBlastRadius(agent.blast_radius);
    setEditLimit(agent.max_transaction_limit);
    setAllowedActionsText(agent.allowed_actions.join('\n'));
    setRestrictedActionsText(agent.restricted_actions.join('\n'));
    setControlsText(agent.required_controls.join('\n'));
    setChangeReason('');
    void loadProfileHistory(agent.id);
  };

  const handleCreateNew = () => {
    const newAgent: Agent = {
      id: `agent-${crypto.randomUUID()}`,
      name: 'New Custom AI Agent',
      owner: 'Engineering & Operations',
      purpose: 'Autonomous operational workflow',
      version: 'v1.0.0',
      status: 'monitoring',
      risk_score: 30,
      blast_radius: 'medium',
      allowed_actions: ['read_data', 'query_metrics', 'notify_slack'],
      restricted_actions: ['disable_audit_logging', 'raw_sql_execution'],
      required_controls: ['audit_logging', 'rate_limiting'],
      max_transaction_limit: 1000
    };
    setSelectedAgent(newAgent);
    selectAgentForEdit(newAgent);
  };

  const handleSave = async () => {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      const score = editRiskTier === 'high' ? 75 : editRiskTier === 'medium' ? 45 : 15;
      const payload: Partial<Agent> = {
        id: selectedAgent.id,
        name: editName,
        owner: editOwner,
        purpose: editPurpose,
        version: editVersion,
        status: editStatus,
        risk_score: score,
        blast_radius: editBlastRadius,
        max_transaction_limit: editLimit,
        allowed_actions: allowedActionsText.split('\n').map(s => s.trim()).filter(Boolean),
        restricted_actions: restrictedActionsText.split('\n').map(s => s.trim()).filter(Boolean),
        required_controls: controlsText.split('\n').map(s => s.trim()).filter(Boolean),
        risk_categories: selectedAgent.risk_categories || [],
        monitoring_requirements: selectedAgent.monitoring_requirements || [],
        change_reason: changeReason || 'Profile updated through governance console.'
      };

      await api.saveAgent(payload);
      setSavedSuccess(true);
      await loadAgents();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving agent profile:', err);
      setError(err instanceof Error ? err.message : 'Unable to save the profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedAgent || !agents.some((agent) => agent.id === selectedAgent.id)) return;
    if (!window.confirm(`Archive ${selectedAgent.name}? It will leave the active fleet but remain in history.`)) return;
    setSaving(true);
    setError(null);
    try {
      await api.archiveAgent(selectedAgent.id);
      setSelectedAgent(null);
      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive the profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (agent: Agent) => {
    setSaving(true);
    setError(null);
    try {
      await api.restoreAgent(agent.id);
      await loadAgents();
      selectAgentForEdit({ ...agent, archived_at: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to restore the profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Safety profiles
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            Set what each agent can do, what it must not do, and when a person must approve an action.
          </p>
        </div>

              <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
          >
            <span>Review from prompt</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Agent Selection List (4 cols) */}
        <div className="lg:col-span-4 min-w-0 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active profiles</h2>
          
          <div className="space-y-2">
            {!loading && agents.length === 0 && !error && (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No agent profiles are registered yet.
              </p>
            )}
            {agents.map((agent) => (
              <button
                type="button"
                key={agent.id}
                onClick={() => selectAgentForEdit(agent)}
                className={`w-full text-left p-3.5 rounded-xl cursor-pointer border transition-all text-xs ${
                  selectedAgent?.id === agent.id
                    ? 'bg-brand-50/80 border-brand-300 dark:bg-brand-950/40 dark:border-brand-500/40 shadow-sm'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{agent.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {agent.version}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{agent.purpose}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-500">
                  <span>Owner: {agent.owner}</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">${(agent.max_transaction_limit || 0).toLocaleString()} max</span>
                </div>
              </button>
            ))}
          </div>

          {archivedAgents.length > 0 && <div className="mt-6 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archived</h2>
            {archivedAgents.map((agent) => <div key={agent.id} className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">{agent.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Archived {agent.archived_at ? new Date(agent.archived_at).toLocaleString() : ''}</div>
                </div>
                <button type="button" onClick={() => handleRestore(agent)} disabled={saving} className="shrink-0 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-950/30">Restore</button>
              </div>
            </div>)}
          </div>}
        </div>

        {/* Right: Active Profile Editor (8 cols) */}
        <div className="lg:col-span-8 min-w-0">
          {selectedAgent ? (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit profile: {editName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{editOwner} · {editVersion}</p>
                </div>

                <div className="flex items-center gap-2">
                  {agents.some((agent) => agent.id === selectedAgent.id) && <button
                    type="button"
                    onClick={handleArchive}
                    disabled={saving}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center space-x-1.5 transition-all"
                  >
                    {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-agent-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Agent Name</label>
                  <input
                    id="profile-agent-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="profile-owner" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Owning Team</label>
                  <input
                    id="profile-owner"
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-purpose" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Agent Purpose & Scope</label>
                <textarea
                  id="profile-purpose"
                  rows={2}
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 leading-relaxed shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="profile-version" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Version</label>
                <input id="profile-version" value={editVersion} onChange={(e) => setEditVersion(e.target.value)} placeholder="v1.0.0" className="w-full sm:w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500" />
              </div>

              {/* Governance Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                
                <div>
                  <label htmlFor="profile-status" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Governance Status</label>
                  <select
                    id="profile-status"
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
                  >
                    <option value="protected">Protected</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="at_risk">At-Risk</option>
                    <option value="quarantined">Quarantined</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="profile-risk-tier" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Risk Tier</label>
                  <select
                    id="profile-risk-tier"
                    value={editRiskTier}
                    onChange={(e) => setEditRiskTier(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="profile-limit" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Autonomous Limit ($USD)</label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="profile-limit"
                      type="number"
                      value={editLimit}
                      onChange={(e) => setEditLimit(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono shadow-sm"
                    />
                  </div>
                </div>

              </div>

              {/* Whitelist & Blacklist Boundaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label htmlFor="profile-allowed-actions" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1 flex items-center space-x-1">
                    <span>Allowed actions</span>
                  </label>
                  <textarea
                    id="profile-allowed-actions"
                    rows={4}
                    value={allowedActionsText}
                    onChange={(e) => setAllowedActionsText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 leading-relaxed shadow-sm"
                    placeholder="read_invoice&#10;extract_metadata"
                  />
                </div>

                <div>
                    <label htmlFor="profile-restricted-actions" className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1 flex items-center space-x-1">
                    <span>Blocked actions</span>
                  </label>
                  <textarea
                    id="profile-restricted-actions"
                    rows={4}
                    value={restrictedActionsText}
                    onChange={(e) => setRestrictedActionsText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-rose-500 leading-relaxed shadow-sm"
                    placeholder="disable_audit_logging&#10;delete_audit_records"
                  />
                </div>
              </div>

              {/* Required Controls */}
              <div>
                <label htmlFor="profile-controls" className="text-xs font-bold text-brand-700 dark:text-brand-300 block mb-1">
                  Required safeguards
                </label>
                <textarea
                  id="profile-controls"
                  rows={3}
                  value={controlsText}
                  onChange={(e) => setControlsText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500 shadow-sm"
                  placeholder="human_approval_over_5k&#10;vendor_bank_change_dual_control"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="profile-change-reason" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Change reason</label>
                  <input id="profile-change-reason" value={changeReason} onChange={(e) => setChangeReason(e.target.value)} placeholder="Why is this boundary changing?" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>

              <details className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 dark:text-white">View profile history</summary>
                {historyLoading ? <p className="text-xs text-slate-500 mt-2">Loading profile history…</p> : profileHistory.length === 0 ? <p className="text-xs text-slate-500 mt-2">No version history is available yet.</p> : <div className="mt-2 space-y-2">{profileHistory.slice(0, 5).map((entry) => <div key={entry.id} className="rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-3 py-2 text-[11px]"><div className="flex flex-wrap justify-between gap-2"><span className="font-mono font-semibold">{entry.version}</span><span className="text-slate-500">{new Date(entry.created_at).toLocaleString()}</span></div><div className="text-slate-600 dark:text-slate-400 mt-1">{entry.change_reason || 'Profile change recorded.'}</div></div>)}</div>}
              </details>

            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-500 text-xs">
              Select or create an agent profile to begin editing.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
