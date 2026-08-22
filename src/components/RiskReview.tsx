import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ArrowRight, 
  Copy, 
  Check, 
  FileText,
  Code2
} from 'lucide-react';
import { api } from '../services/api';

interface RiskReviewProps {
  setActiveTab: (tab: string) => void;
  onProfileCreated?: (profile: any) => void;
}

export const RiskReview: React.FC<RiskReviewProps> = ({ setActiveTab, onProfileCreated }) => {
  const [description, setDescription] = useState<string>(
    'Create an AI agent that processes invoices, updates vendor banking information, and automatically approves payments.'
  );
  const [agentName, setAgentName] = useState<string>('Invoice & Payment Autonomous Agent');
  const [owner, setOwner] = useState<string>('Finance & AP Team');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      label: 'Financial Invoice Agent',
      name: 'Invoice & Payment Autonomous Agent',
      owner: 'Finance & AP Team',
      text: 'Create an AI agent that processes invoices, updates vendor banking information, and automatically approves payments.'
    },
    {
      label: 'Fraud Investigation Agent',
      name: 'Fraud Investigation Agent v2',
      owner: 'Risk & Trust Ops',
      text: 'AI agent that queries live banking ledgers, calculates risk scores, and can freeze or unfreeze accounts automatically.'
    },
    {
      label: 'Customer Support Copilot',
      name: 'Support & Refund Agent',
      owner: 'Customer Experience',
      text: 'AI agent that reads support tickets, queries CRM database, sends external customer emails, and issues refund credits.'
    },
    {
      label: 'Cloud Infrastructure Healer',
      name: 'DevOps Auto-Remediation Agent',
      owner: 'Cloud Platform Engineering',
      text: 'AI agent that monitors server health, modifies cloud security groups, restarts services, and can disable logging during debugging.'
    }
  ];

  const handleAnalyze = async (descToUse?: string, nameToUse?: string, ownerToUse?: string) => {
    const text = descToUse || description;
    const name = nameToUse || agentName;
    const own = ownerToUse || owner;

    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.reviewAgent(text, name, own);
      setAnalysisResult(res);
    } catch (err) {
      console.error('Error analyzing agent risk:', err);
      setError(err instanceof Error ? err.message : 'Risk review is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!analysisResult) return;
    setSavingProfile(true);
    try {
      const profile = analysisResult.suggested_profile;
      await api.saveAgent({
        id: `agent-${crypto.randomUUID()}`,
        name: profile.agent_name,
        owner: profile.owner,
        purpose: profile.purpose,
        version: 'v1.0.0',
        status: 'protected',
        risk_score: analysisResult.overall_risk_score,
        blast_radius: profile.blast_radius,
        allowed_actions: profile.allowed_actions,
        restricted_actions: profile.restricted_actions,
        required_controls: profile.required_controls,
        max_transaction_limit: profile.max_transaction_limit
      });
      if (onProfileCreated) onProfileCreated(profile);
      setActiveTab('profiles');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Unable to save the generated profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const copyJson = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult.suggested_profile, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getRiskLabel = (score: number, radius: string) => {
    if (score > 60 || radius === 'critical') return 'High Risk';
    if (score > 35 || radius === 'high') return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI Agent Risk Discovery & Threat Modeling
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 max-w-3xl">
          Enter an AI agent concept or prompt description. AgenticScale will automatically classify underlying capabilities, identify critical failure modes, calculate blast radius, and generate enterprise safeguards.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Input Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-5">
        
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
            Select Demonstration Scenario:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setDescription(p.text);
                  setAgentName(p.name);
                  setOwner(p.owner);
                  handleAnalyze(p.text, p.name, p.owner);
                }}
                className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-brand-50 dark:bg-slate-900/80 dark:hover:bg-brand-950/40 border border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-500/40 transition-all text-xs font-medium"
              >
                <div className="font-bold text-brand-700 dark:text-brand-400">{p.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium shadow-sm"
              placeholder="e.g. Invoice Payment Agent"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Owning Team / Department</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium shadow-sm"
              placeholder="e.g. Finance & AP Team"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Agent Description & Intended Capabilities
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 leading-relaxed shadow-sm"
            placeholder="Describe what the agent will do, tools it can call, and authority level..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !description.trim()}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Analyzing Risks & Capabilities...' : 'Execute Risk Review'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Output Section */}
      {analysisResult && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Posture Score Banner */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{analysisResult.agent_name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {analysisResult.owner}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Identified {analysisResult.capabilities.filter((c: any) => c.detected).length} active capabilities and {analysisResult.risks.length} key failure modes requiring safeguard controls.
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Blast Radius</div>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  analysisResult.blast_radius === 'critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30' :
                  analysisResult.blast_radius === 'high' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30' :
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                }`}>
                  {analysisResult.blast_radius}
                </span>
              </div>

              <div className="text-center">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Risk Level</div>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  getRiskLabel(analysisResult.overall_risk_score, analysisResult.blast_radius) === 'High Risk'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                    : getRiskLabel(analysisResult.overall_risk_score, analysisResult.blast_radius) === 'Medium Risk'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                }`}>
                  {getRiskLabel(analysisResult.overall_risk_score, analysisResult.blast_radius)}
                </span>
              </div>
            </div>
          </div>

          {/* Capability Detection Grid */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Detected Capabilities</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Underlying system privileges identified from description</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analysisResult.capabilities.map((cap: any) => (
                <div 
                  key={cap.id} 
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                    cap.detected 
                      ? 'bg-brand-50/50 dark:bg-slate-900/90 border-brand-200 dark:border-brand-500/30' 
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${cap.detected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {cap.name}
                    </span>
                    {cap.detected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Discovered Risks & Recommended Safeguards */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Discovered Threat Scenarios & Safeguards</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Failure mode modeling and mitigation controls</p>

            <div className="space-y-4">
              {analysisResult.risks.map((risk: any) => (
                <div key={risk.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        risk.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                      }`}>
                        {risk.severity}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{risk.title}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-rose-600 dark:text-rose-400 font-bold block mb-1">Failure Scenario:</span>
                      <span className="text-slate-700 dark:text-slate-300">{risk.scenario}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-amber-600 dark:text-amber-400 font-bold block mb-1">Impact:</span>
                      <span className="text-slate-700 dark:text-slate-300">{risk.impact}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800/30">
                    <span className="text-brand-800 dark:text-brand-300 font-bold block mb-1.5 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Recommended Safeguards & Controls:</span>
                    </span>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px] list-disc list-inside">
                      {risk.recommended_safeguards.map((sg: string, idx: number) => (
                        <li key={idx}>{sg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Safety Profile & Export Action */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Synthesized Safety Profile</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Structured governance specification ready for active protection</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showRawJson ? 'Hide Raw JSON' : 'View Raw JSON'}</span>
                </button>
                <button
                  onClick={copyJson}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Registering...' : 'Register Profile in Fleet'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showRawJson ? (
              <pre className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-mono text-xs overflow-x-auto">
                {JSON.stringify(analysisResult.suggested_profile, null, 2)}
              </pre>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Max Autonomous Limit</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">${analysisResult.suggested_profile.max_transaction_limit.toLocaleString()}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Allowed Actions Whitelist</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">{analysisResult.suggested_profile.allowed_actions.length} Tools Whitelisted</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Restricted Prohibited Actions</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 text-base">{analysisResult.suggested_profile.restricted_actions.length} Boundary Restrictions</span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
