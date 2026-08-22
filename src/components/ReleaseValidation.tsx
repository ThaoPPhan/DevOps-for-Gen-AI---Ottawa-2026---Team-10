import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  History, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api, ValidationHistoryRecord } from '../services/api';
import { Agent } from '../types';

interface ValidationProps {
  setActiveTab: (tab: string) => void;
}

export const ReleaseValidation: React.FC<ValidationProps> = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-fraud-02');
  const [agentName, setAgentName] = useState<string>('Fraud Analysis Agent');
  const [version, setVersion] = useState<string>('v2.0.0-rc1');
  const [running, setRunning] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<any | null>(null);
  const [history, setHistory] = useState<ValidationHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedSuite, setExpandedSuite] = useState<number | null>(null);
  const [candidateAgents, setCandidateAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState<boolean>(true);
  const [releasePending, setReleasePending] = useState<boolean>(false);
  const [releaseNote, setReleaseNote] = useState<string>('');

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const data = await api.getAgents();
      setCandidateAgents(data);
      const selected = data.find((agent) => agent.id === selectedAgentId) || data[0];
      if (selected) {
        setSelectedAgentId(selected.id);
        setAgentName(selected.name);
        setVersion(selected.version);
      }
    } catch (err) {
      console.error('Error fetching validation candidates:', err);
      setError(err instanceof Error ? err.message : 'Validation candidates are unavailable.');
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getValidationHistory();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching validation history:', err);
      setError(err instanceof Error ? err.message : 'Validation history is unavailable.');
    }
  };

  useEffect(() => {
    loadHistory();
    loadAgents();
  }, []);

  const handleRunValidation = async (agentId?: string, name?: string, ver?: string) => {
    const aid = agentId || selectedAgentId;
    const aname = name || agentName;
    const aver = ver || version;

    if (!aid || !aver.trim()) {
      setError('Select an agent and enter a release version before running validation.');
      return;
    }

    setRunning(true);
    setCurrentReport(null);
    setError(null);
    try {
      const report = await api.validateAgent(aid, aname, aver);
      setCurrentReport(report);
      setReleaseNote('');
      await loadHistory();
    } catch (err) {
      console.error('Error running validation suite:', err);
      setError(err instanceof Error ? err.message : 'Validation could not be completed.');
    } finally {
      setRunning(false);
    }
  };

  const handleReleaseDecision = async (decision: 'approve' | 'reject') => {
    if (!currentReport?.run_id) return;
    setReleasePending(true);
    setError(null);
    try {
      const result = await api.releaseValidation(currentReport.run_id, decision, releaseNote);
      setCurrentReport((previous: any) => ({ ...previous, release_decision: result.release_decision, agent_status: result.agent_status }));
      await Promise.all([loadHistory(), loadAgents()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Release decision could not be recorded.');
    } finally {
      setReleasePending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pre-Release Behavioral Safety Validation
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 max-w-3xl">
          Validate agent safety behavior across normal, ambiguous, adversarial prompt injection, and permission abuse boundary tests before promoting a profile to protected status.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Target Agent Selector & Trigger */}
      <div className="glass-panel p-6 rounded-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Select Candidate AI Agent & Release Version:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {loadingAgents ? <p className="text-xs text-slate-500">Loading registered profiles…</p> : candidateAgents.length === 0 ? <p className="text-xs text-slate-500">No active profiles are available for validation.</p> : candidateAgents.map((ag) => (
                <button
                  type="button"
                  key={ag.id}
                  onClick={() => {
                    setSelectedAgentId(ag.id);
                    setAgentName(ag.name);
                    setVersion(ag.version);
                  }}
                  className={`p-3 text-left rounded-xl border transition-all text-xs ${
                    selectedAgentId === ag.id
                      ? 'bg-brand-50 border-brand-300 dark:bg-brand-950/50 dark:border-brand-500/50 shadow-sm'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{ag.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {ag.version}
                    </span>
                  </div>
                  <div className="text-[11px] text-brand-700 dark:text-brand-400 font-semibold mt-1">{ag.status === 'quarantined' ? 'Quarantined' : ag.status === 'at_risk' ? 'At-Risk Candidate' : ag.status === 'protected' ? 'Protected Profile' : 'Monitoring Profile'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="self-end md:self-center">
            <label htmlFor="validation-version" className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Candidate version</label>
            <input id="validation-version" value={version} onChange={(event) => setVersion(event.target.value)} className="w-full mb-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white" placeholder="v2.1.0-rc1" />
            <button
              type="button"
              onClick={() => handleRunValidation()}
              disabled={running}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              {running ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{running ? 'Executing Test Scenarios...' : 'Run Pre-Flight Test Suite'}</span>
            </button>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2"><History className="w-4 h-4 text-slate-400" /> Validation history</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Historical runs are loaded independently of a new test run.</p>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800"><tr><th className="py-2.5 px-3">Agent</th><th className="py-2.5 px-3">Version</th><th className="py-2.5 px-3">Assessment</th><th className="py-2.5 px-3">Release</th><th className="py-2.5 px-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">{history.slice(0, 20).map((h) => <tr key={h.id}><td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{h.agent_name || h.agent_id}</td><td className="py-2.5 px-3 font-mono">{h.version}</td><td className="py-2.5 px-3"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${h.status === 'passed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'}`}>{h.status === 'passed' ? 'Passed' : 'Review Required'}</span></td><td className="py-2.5 px-3"><span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${h.release_decision === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : h.release_decision === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{h.release_decision || 'Pending'}</span></td><td className="py-2.5 px-3 text-slate-500">{new Date(h.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
        </div>
      )}

      {/* Validation Results Report */}
      {currentReport && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Executive Summary Card */}
          <div className={`p-6 sm:p-8 rounded-2xl border transition-all ${
            currentReport.overall_status === 'passed'
              ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-500/30'
              : 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/20 dark:border-amber-500/30'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  {currentReport.overall_status === 'passed' ? (
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      AI Release Safety Review: {currentReport.agent_name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Version: {currentReport.version}
                    </p>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl text-xs font-medium ${
                  currentReport.overall_status === 'passed'
                    ? 'bg-emerald-100/60 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-amber-100/60 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40'
                }`}>
                  <span className="font-bold block mb-1">Release Recommendation:</span>
                  <span>{currentReport.recommendation}</span>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Release decision</div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {currentReport.release_decision === 'approved' ? 'Approved — profile promoted to Protected.' : currentReport.release_decision === 'rejected' ? 'Rejected — profile was not promoted.' : 'Pending human approval.'}
                      </div>
                    </div>
                    {currentReport.release_decision === 'pending' && (
                      <div className="flex flex-wrap gap-2">
                        {currentReport.overall_status === 'passed' && <button type="button" onClick={() => handleReleaseDecision('approve')} disabled={releasePending} className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{releasePending ? 'Recording…' : 'Approve release'}</button>}
                        <button type="button" onClick={() => handleReleaseDecision('reject')} disabled={releasePending} className="rounded-lg border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/30">Reject release</button>
                      </div>
                    )}
                  </div>
                  <input value={releaseNote} onChange={(event) => setReleaseNote(event.target.value)} placeholder="Decision note (optional)" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                  <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">Approval records the human decision and promotes this profile; it does not automatically execute or replay an action.</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 self-start md:self-center">
                <div className="text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Assurance Status</div>
                  <span className={`inline-block mt-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase ${
                    currentReport.overall_status === 'passed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                  }`}>
                    {currentReport.overall_status === 'passed' ? 'Safe to Release' : 'Review Required'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Test Suites Breakdown */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Behavioral Test Suite Results</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Detailed inspection of individual boundary test cases and telemetry observations</p>

            <div className="space-y-3">
              {currentReport.suites.map((suite: any, idx: number) => {
                const isExpanded = expandedSuite === idx || expandedSuite === null;
                const allPassed = suite.passed_count === suite.total_count;

                return (
                  <div key={idx} className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSuite(isExpanded ? -1 : idx)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        {allPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        )}
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{suite.name}</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{suite.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`font-mono font-semibold text-xs ${allPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          {suite.passed_count}/{suite.total_count} Passed
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-800/60 space-y-2.5 bg-white/50 dark:bg-slate-950/40">
                        {suite.tests.map((test: any) => (
                          <div 
                            key={test.id}
                            className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                              test.status === 'passed'
                                ? 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-slate-200">{test.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                test.status === 'passed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                              }`}>
                                Expected: {test.expected_decision} | Actual: {test.actual_decision}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">{test.description}</p>
                            <p className={`text-[11px] font-mono ${
                              test.status === 'passed' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'
                            }`}>
                              Observation: {test.observation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
