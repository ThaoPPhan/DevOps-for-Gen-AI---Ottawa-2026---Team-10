import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Plus, 
  Save, 
  Check, 
  DollarSign
} from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';

interface ProfilesProps {
  setActiveTab: (tab: string) => void;
}

export const SafetyProfiles: React.FC<ProfilesProps> = ({ setActiveTab }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await api.getAgents();
      setAgents(data);
      if (data.length > 0 && !selectedAgent) {
        selectAgentForEdit(data[0]);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
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
  };

  const handleCreateNew = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now().toString(36)}`,
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
        required_controls: controlsText.split('\n').map(s => s.trim()).filter(Boolean)
      };

      await api.saveAgent(payload);
      setSavedSuccess(true);
      await loadAgents();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving agent profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Safety Profiles & Operating Boundaries
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Define permissions, restricted actions, transaction caps, and governance controls for enterprise agents.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
          >
            <span>+ Review From Prompt</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Agent Selection List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Agent Profiles</h2>
          
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => selectAgentForEdit(agent)}
                className={`p-3.5 rounded-xl cursor-pointer border transition-all text-xs ${
                  selectedAgent?.id === agent.id
                    ? 'bg-brand-950/40 border-brand-500/40 shadow-sm shadow-brand-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{agent.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {agent.version}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{agent.purpose}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span>Owner: {agent.owner}</span>
                  <span className="font-bold text-brand-400">${(agent.max_transaction_limit || 0).toLocaleString()} max</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Profile Editor (8 cols) */}
        <div className="lg:col-span-8">
          {selectedAgent ? (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Safety Profile: {editName}</h3>
                  <p className="text-xs text-slate-400">Owner: {editOwner} • Version {editVersion}</p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Changes'}</span>
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Owning Team</label>
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Agent Purpose & Scope</label>
                <textarea
                  rows={2}
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>

              {/* Governance Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Governance Status</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="protected">Protected (Guarded)</option>
                    <option value="monitoring">Monitoring Only</option>
                    <option value="at_risk">At-Risk</option>
                    <option value="quarantined">Quarantined (Blocked)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Risk Tier</label>
                  <select
                    value={editRiskTier}
                    onChange={(e) => setEditRiskTier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Autonomous Limit ($USD)</label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="number"
                      value={editLimit}
                      onChange={(e) => setEditLimit(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

              </div>

              {/* Whitelist & Blacklist Boundaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1 flex items-center space-x-1">
                    <span>Allowed Capabilities Whitelist</span>
                  </label>
                  <textarea
                    rows={4}
                    value={allowedActionsText}
                    onChange={(e) => setAllowedActionsText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                    placeholder="read_invoice&#10;extract_metadata"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-rose-400 block mb-1 flex items-center space-x-1">
                    <span>Restricted Actions / Blacklist</span>
                  </label>
                  <textarea
                    rows={4}
                    value={restrictedActionsText}
                    onChange={(e) => setRestrictedActionsText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-rose-500 leading-relaxed"
                    placeholder="disable_audit_logging&#10;delete_audit_records"
                  />
                </div>
              </div>

              {/* Required Controls */}
              <div>
                <label className="text-xs font-semibold text-brand-300 block mb-1">
                  Required Governance Controls
                </label>
                <textarea
                  rows={3}
                  value={controlsText}
                  onChange={(e) => setControlsText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  placeholder="human_approval_over_5k&#10;vendor_bank_change_dual_control"
                />
              </div>

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
