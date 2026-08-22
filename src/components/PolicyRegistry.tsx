import React, { useEffect, useState } from 'react';
import { CheckCircle2, LockKeyhole, RefreshCw, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../services/api';
import { Policy } from '../types';

export const PolicyRegistry: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      setPolicies(await api.getPolicies());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Policy registry is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPolicies(); }, []);

  const togglePolicy = async (policy: Policy) => {
    if (policy.is_mutable === false) return;
    setSavingId(policy.id);
    setError(null);
    try {
      await api.updatePolicy(policy.id, policy.is_enabled !== 1);
      setPolicies((current) => current.map((item) => item.id === policy.id ? { ...item, is_enabled: item.is_enabled === 1 ? 0 : 1 } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Policy update failed.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Safety Policy Registry</h1>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-600 dark:text-slate-400">Review the policy controls applied by the gateway. Changes require admin access and are recorded in the D1 policy registry.</p>
        </div>
        <button type="button" onClick={() => void loadPolicies()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} /> Refresh
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>Disabling a configurable policy changes future gateway evaluations. The administrative-compromise policy remains mandatory and cannot be disabled.</span></div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading && policies.length === 0 ? [1, 2, 3, 4].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />) : policies.map((policy) => {
          const enabled = policy.is_enabled === 1;
          const immutable = policy.is_mutable === false;
          return <article key={policy.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-slate-500">{policy.id}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${policy.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'}`}>{policy.severity}</span></div>
                <h2 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{policy.name}</h2>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{policy.category} · Default action: {policy.default_action}</p>
              </div>
              <button type="button" onClick={() => void togglePolicy(policy)} disabled={immutable || savingId === policy.id} aria-pressed={enabled} aria-label={`${enabled ? 'Disable' : 'Enable'} ${policy.name}`} className={`shrink-0 rounded-lg p-1 transition-colors ${immutable ? 'cursor-not-allowed text-slate-400' : enabled ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {immutable ? <LockKeyhole className="h-6 w-6" /> : enabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
              </button>
            </div>
            <div className="mt-4 space-y-2 text-[11px]">
              <div className="rounded-lg bg-slate-50 p-3 font-mono text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">{policy.rule_expression}</div>
              <p className="text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-800 dark:text-slate-200">Guidance:</span> {policy.remediation_guidance}</p>
              <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">{enabled ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}{immutable ? 'Mandatory control' : enabled ? 'Enabled for gateway evaluation' : 'Disabled for future evaluations'}</div>
            </div>
          </article>;
        })}
      </div>
    </div>
  );
};
