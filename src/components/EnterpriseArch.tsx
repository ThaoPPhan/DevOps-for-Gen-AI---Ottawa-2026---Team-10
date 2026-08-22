import React from 'react';
import { 
  Cloud, 
  Zap, 
  Database, 
  Radio, 
  FileCheck
} from 'lucide-react';

export const EnterpriseArch: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Enterprise Architecture & Scaling Roadmap
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 max-w-3xl">
          Architectural evolution mapping lightweight edge guarantees into enterprise-scale multi-cloud AI agent safety infrastructure.
        </p>
      </div>

      {/* Cloudflare vs Enterprise Mapping Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Component Architecture Matrix</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Architecture Layer</th>
                <th className="py-3 px-4 text-brand-700 dark:text-brand-400 font-bold">Edge Prototype (Current Live)</th>
                <th className="py-3 px-4 text-indigo-700 dark:text-indigo-400 font-bold">Enterprise Expansion (Future Scale)</th>
                <th className="py-3 px-4">Key Safety Guarantee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Cloud className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Frontend Dashboard</span>
                </td>
                <td className="py-3.5 px-4 text-brand-700 dark:text-brand-300 font-mono">Cloudflare Pages (Global CDN)</td>
                <td className="py-3.5 px-4 text-indigo-700 dark:text-indigo-300 font-mono">Cloudflare Pages / AWS S3 + CloudFront</td>
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">Edge-hosted access; measure performance per deployment</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>API & Safety Gateway</span>
                </td>
                <td className="py-3.5 px-4 text-brand-700 dark:text-brand-300 font-mono">Cloudflare Workers / Pages Functions</td>
                <td className="py-3.5 px-4 text-indigo-700 dark:text-indigo-300 font-mono">Cloudflare Workers + AWS Lambda</td>
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">Deterministic policy enforcement with explicit auth and error boundaries</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Database & Storage</span>
                </td>
                <td className="py-3.5 px-4 text-brand-700 dark:text-brand-300 font-mono">Cloudflare D1 (SQLite Edge DB) + KV</td>
                <td className="py-3.5 px-4 text-indigo-700 dark:text-indigo-300 font-mono">Cloudflare D1 + AWS DynamoDB + Aurora Serverless</td>
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">D1 audit records with KV-backed rate limiting</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>Event Telemetry & Alerting</span>
                </td>
                <td className="py-3.5 px-4 text-brand-700 dark:text-brand-300 font-mono">D1 telemetry + optional alert webhook</td>
                <td className="py-3.5 px-4 text-indigo-700 dark:text-indigo-300 font-mono">AWS EventBridge + SNS + OpenTelemetry (OTel)</td>
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">Recorded incidents with optional outbound notification</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 9-Step Continuous Assurance Lifecycle */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Continuous AI Agent Safety Lifecycle</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {[
            { step: '1', title: 'Agent Idea Conceived', desc: 'Developer proposes an AI financial invoice & payment agent.' },
            { step: '2', title: 'Risk Discovery', desc: 'AgenticScale identifies financial impact, prompt injection, and vendor mutation risks.' },
            { step: '3', title: 'Safeguards Generated', desc: 'Dual-approval gates, phone verification, and $5k transaction limits configured.' },
            { step: '4', title: 'Safety Profile Created', desc: 'Structured governance profile stored permanently in Cloudflare D1.' },
            { step: '5', title: 'Pre-Release Validated', desc: 'Behavioral test suites verify boundaries before production release certification.' },
            { step: '6', title: 'Adversarial Attack Intercepted', desc: 'Agent encounters urgent fraudulent bank update and injected memo.' },
            { step: '7', title: 'In-Flight Gateway Evaluation', desc: 'AgenticScale Gateway intercepts action and flags REVIEW / BLOCK at edge.' },
            { step: '8', title: 'Runbook & Human Decision', desc: 'Incident created with a runbook; authorized operators can acknowledge, approve, reject, or resolve it.' },
            { step: '9', title: 'Fleet Observability', desc: 'Central dashboard aggregates D1 safety posture through short-interval polling.' },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-300 dark:border-brand-500/30 flex items-center justify-center font-mono font-bold text-[10px]">
                  {item.step}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 text-xs text-brand-900 dark:text-brand-200 font-medium">
          💡 <span className="font-bold text-slate-900 dark:text-white">Guiding Principle:</span> AI agents accelerate critical business processes, but organizations need continuous safety assurance to scale AI adoption responsibly.
        </div>
      </div>

    </div>
  );
};
