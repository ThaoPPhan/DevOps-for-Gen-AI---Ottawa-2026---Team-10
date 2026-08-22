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
import { api } from '../services/api';

interface ValidationProps {
  setActiveTab: (tab: string) => void;
}

export const ReleaseValidation: React.FC<ValidationProps> = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-fraud-02');
  const [agentName, setAgentName] = useState<string>('Fraud Analysis Agent');
  const [version, setVersion] = useState<string>('v2.0.0-rc1');
  const [running, setRunning] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedSuite, setExpandedSuite] = useState<number | null>(null);

  const candidateAgents = [
    { id: 'agent-fraud-02', name: 'Fraud Analysis Agent', version: 'v2.0.0-rc1', badge: 'Pre-Release Candidate' },
    { id: 'agent-invoice-01', name: 'Invoice & Payment Agent', version: 'v1.4.2', badge: 'Production Certified' },
    { id: 'agent-support-01', name: 'Customer Support Copilot', version: 'v3.1.0', badge: 'Production Active' },
    { id: 'agent-devops-01', name: 'Infrastructure Auto-Healer', version: 'v1.1.0', badge: 'High Privilege Candidate' }
  ];

  const loadHistory = async () => {
    try {
      const data = await api.getValidationHistory();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching validation history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
    handleRunValidation('agent-fraud-02', 'Fraud Analysis Agent', 'v2.0.0-rc1');
  }, []);

  const handleRunValidation = async (agentId?: string, name?: string, ver?: string) => {
    const aid = agentId || selectedAgentId;
    const aname = name || agentName;
    const aver = ver || version;

    setRunning(true);
    setCurrentReport(null);
    try {
      const report = await api.validateAgent(aid, aname, aver);
      setCurrentReport(report);
      await loadHistory();
    } catch (err) {
      console.error('Error running validation suite:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Pre-Release Behavioral Safety Validation
        </h1>
        <p className="text-slate-400 text-sm mt-1.5 max-w-3xl">
          Validate agent safety behavior across normal, ambiguous, adversarial prompt injection, and permission abuse boundary tests before authorizing deployment to production.
        </p>
      </div>

      {/* Target Agent Selector & Trigger */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Select Candidate AI Agent & Release Version:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {candidateAgents.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => {
                    setSelectedAgentId(ag.id);
                    setAgentName(ag.name);
                    setVersion(ag.version);
                    handleRunValidation(ag.id, ag.name, ag.version);
                  }}
                  className={`p-3 text-left rounded-xl border transition-all text-xs ${
                    selectedAgentId === ag.id
                      ? 'bg-brand-950/50 border-brand-500/50 shadow-sm shadow-brand-500/20'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{ag.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ag.version}
                    </span>
                  </div>
                  <div className="text-[11px] text-brand-400 mt-1">{ag.badge}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="self-end md:self-center">
            <button
              onClick={() => handleRunValidation()}
              disabled={running}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              {running ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{running ? 'Executing Test Scenarios...' : 'Run Pre-Flight Test Suite'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Results Report */}
      {currentReport && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Executive Summary Card */}
          <div className={`p-6 sm:p-8 rounded-2xl border transition-all ${
            currentReport.overall_status === 'passed'
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  {currentReport.overall_status === 'passed' ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-extrabold text-white">
                      AI Release Safety Review: {currentReport.agent_name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Version: {currentReport.version}
                    </p>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl text-xs font-medium ${
                  currentReport.overall_status === 'passed'
                    ? 'bg-emerald-950/50 text-emerald-200 border border-emerald-800/40'
                    : 'bg-amber-950/50 text-amber-200 border border-amber-800/40'
                }`}>
                  <span className="font-bold block mb-1">Release Recommendation:</span>
                  <span>{currentReport.recommendation}</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 self-start md:self-center">
                <div className="text-center">
                  <div className="text-xs text-slate-400 font-medium">Assurance Status</div>
                  <span className={`inline-block mt-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase ${
                    currentReport.overall_status === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {currentReport.overall_status === 'passed' ? 'Safe to Release' : 'Review Required'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Test Suites Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Behavioral Test Suite Results</h3>
            <p className="text-xs text-slate-400">Detailed inspection of individual boundary test cases and telemetry observations</p>

            <div className="space-y-3">
              {currentReport.suites.map((suite: any, idx: number) => {
                const isExpanded = expandedSuite === idx || expandedSuite === null;
                const allPassed = suite.passed_count === suite.total_count;

                return (
                  <div key={idx} className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                    <div 
                      onClick={() => setExpandedSuite(isExpanded ? -1 : idx)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-all text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        {allPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <div>
                          <span className="font-bold text-white text-sm">{suite.name}</span>
                          <p className="text-[11px] text-slate-400">{suite.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`font-mono font-semibold text-xs ${allPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {suite.passed_count}/{suite.total_count} Passed
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-800/60 space-y-2.5 bg-slate-950/40">
                        {suite.tests.map((test: any) => (
                          <div 
                            key={test.id}
                            className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                              test.status === 'passed'
                                ? 'bg-slate-900/60 border-slate-800'
                                : 'bg-amber-950/20 border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200">{test.name}</span>
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                                test.status === 'passed'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                Expected: {test.expected_decision} | Actual: {test.actual_decision}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{test.description}</p>
                            <p className={`text-[11px] font-mono ${
                              test.status === 'passed' ? 'text-emerald-400' : 'text-amber-300'
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

          {/* Historical Pre-Release Runs */}
          {history.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
                <History className="w-4 h-4 text-slate-400" />
                <span>Pre-Release Validation Run History</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">Historical audit records stored in database</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Run ID</th>
                      <th className="py-2.5 px-3">Agent</th>
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">Pre-Release Assessment</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{h.id}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{h.agent_name || h.agent_id}</td>
                        <td className="py-2.5 px-3 font-mono">{h.version}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            h.status === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {h.status === 'passed' ? 'Passed' : 'Review Required'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {new Date(h.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
