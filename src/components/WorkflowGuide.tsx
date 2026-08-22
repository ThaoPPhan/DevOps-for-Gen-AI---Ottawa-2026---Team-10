import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

interface WorkflowGuideProps {
  setActiveTab: (tab: string) => void;
}

const workflowSteps = [
  {
    title: 'Describe',
    summary: 'Tell us what the agent does.',
    detail: 'Start with the agent’s purpose, tools, and level of authority.',
    icon: Search,
    color: 'text-brand-600 dark:text-brand-400',
  },
  {
    title: 'Set boundaries',
    summary: 'Choose what it can and cannot do.',
    detail: 'Set allowed actions, blocked actions, limits, and approval rules.',
    icon: SlidersHorizontal,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    title: 'Test',
    summary: 'Check normal and risky behavior.',
    detail: 'Run safety checks before the agent is trusted with live work.',
    icon: CheckCircle2,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Protect',
    summary: 'Every action gets a clear decision.',
    detail: 'The gateway allows safe actions, holds uncertain ones, and blocks unsafe ones.',
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
];

export const WorkflowGuide: React.FC<WorkflowGuideProps> = ({ setActiveTab }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % workflowSteps.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const selectedStep = workflowSteps[activeStep];

  return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8" aria-labelledby="workflow-guide-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="workflow-guide-title" className="text-lg font-bold text-slate-900 dark:text-white">How AgenticScale works</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A simple path from an agent idea to protected live actions.</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Simple overview</span>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              return (
                <React.Fragment key={step.title}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(index)}
                    aria-pressed={isActive}
                    className={`min-w-0 flex-1 rounded-xl border p-3 text-left transition-all ${isActive ? 'workflow-active border-brand-300 bg-brand-50/80 dark:border-brand-500/50 dark:bg-brand-950/40' : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm dark:bg-slate-950 ${step.color}`}>{index + 1}</span>
                      <Icon className={`h-4 w-4 shrink-0 ${step.color}`} />
                      <span className="whitespace-normal text-xs font-bold leading-tight text-slate-900 dark:text-white">{step.title}</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">{step.summary}</p>
                  </button>
                  {index < workflowSteps.length - 1 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 dark:text-slate-700 sm:block" aria-hidden="true" />}
                  {index < workflowSteps.length - 1 && <ArrowDown className="mx-auto h-4 w-4 shrink-0 text-slate-300 dark:text-slate-700 sm:hidden" aria-hidden="true" />}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/20 dark:text-brand-200" aria-live="polite">
            <span className="font-bold">{selectedStep.title}:</span> {selectedStep.detail}
          </div>
        </div>

        <details open className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 lg:col-span-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 dark:text-white">Getting started</summary>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">New here? Follow these three steps first.</p>
          <div className="mt-3 space-y-2">
            <button type="button" onClick={() => setActiveTab('review')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-brand-300">
              <span className="font-mono text-slate-400">1</span><span className="flex-1">Review an agent</span><ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setActiveTab('profiles')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-brand-300">
              <span className="font-mono text-slate-400">2</span><span className="flex-1">Set the safety profile</span><ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setActiveTab('validate')} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-brand-300">
              <span className="font-mono text-slate-400">3</span><span className="flex-1">Run safety checks</span><PlayCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </details>
      </div>
    </section>
  );
};
