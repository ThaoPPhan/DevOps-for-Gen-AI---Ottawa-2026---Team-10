import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { CentralDashboard } from './components/CentralDashboard';
import { RiskReview } from './components/RiskReview';
import { SafetyProfiles } from './components/SafetyProfiles';
import { ReleaseValidation } from './components/ReleaseValidation';
import { RuntimeSimulation } from './components/RuntimeSimulation';
import { EnterpriseArch } from './components/EnterpriseArch';
import { ApiDocs } from './components/ApiDocs';
import { PolicyRegistry } from './components/PolicyRegistry';
import { AlertTriangle, ArrowRight, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from './services/api';
import { AuthSession } from './types';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const PublicHome: React.FC<{ onSignIn: () => void; setActiveTab: (tab: string) => void }> = ({ onSignIn, setActiveTab }) => (
  <div className="space-y-8">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <ShieldCheck className="h-4 w-4" />
          AI agent safety assurance
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Make every agent action explainable, testable, and safe.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">AgenticScale helps teams describe agent behavior, set operating boundaries, validate releases, and monitor decisions in one place.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={onSignIn} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500">
            Sign in to workspace <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setActiveTab('enterprise')} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750">See how it works</button>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Browse the overview without signing in. Sign-in is only needed for organization data and workspace actions.</p>
      </div>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Simple workflow</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">From agent idea to protected action</h2>
        </div>
        <button type="button" onClick={() => setActiveTab('enterprise')} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-600 dark:text-brand-300">See the architecture <ArrowRight className="h-4 w-4" /></button>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          ['1', 'Describe', 'Capture what the agent does and who owns it.'],
          ['2', 'Set boundaries', 'Define allowed actions, limits, and restrictions.'],
          ['3', 'Test', 'Run normal, risky, and adversarial scenarios.'],
          ['4', 'Protect', 'Allow safe actions, hold uncertain ones, and block unsafe ones.']
        ].map(([number, title, description]) => (
          <div key={number} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-extrabold text-brand-700 shadow-sm dark:bg-slate-800 dark:text-brand-300">{number}</div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const SignInRequired: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <div className="flex min-h-[50vh] items-center justify-center py-10">
    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><LockKeyhole className="h-6 w-6" /></div>
      <h1 className="mt-5 text-2xl font-extrabold text-slate-950 dark:text-white">Sign in to open this workspace</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">This area contains organization-specific agents, policies, validations, and operational events.</p>
      <button type="button" onClick={onSignIn} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500">Continue to sign in <ArrowRight className="h-4 w-4" /></button>
    </div>
  </div>
);

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AgenticScale UI Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-2xl max-w-lg w-full border border-rose-300 dark:border-rose-800 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 p-3 rounded text-left overflow-x-auto">
              The platform hit an unexpected display error. Reload to try the page again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Platform</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const routeToTab: Record<string, string> = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/review': 'review',
    '/profile': 'profiles',
    '/profiles': 'profiles',
    '/validate': 'validate',
    '/simulate': 'simulate',
    '/enterprise': 'enterprise',
    '/api-docs': 'api',
    '/policies': 'policies'
  };
  const tabToRoute: Record<string, string> = {
    dashboard: '/',
    review: '/review',
    profiles: '/profile',
    validate: '/validate',
    simulate: '/simulate',
    enterprise: '/enterprise',
    api: '/api-docs',
    policies: '/policies'
  };
  const [activeTab, setActiveTabState] = useState<string>(() => routeToTab[window.location.pathname] || 'dashboard');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('agenticscale_theme');
    return stored === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('agenticscale_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('agenticscale_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const onPopState = () => setActiveTabState(routeToTab[window.location.pathname] || 'dashboard');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let active = true;
    api.getSession()
      .then((nextSession) => { if (active) setSession(nextSession); })
      .catch(() => { if (active) setSession({ authenticated: false, provider: 'unknown', login_url: '/cdn-cgi/access/login', user: null, organization: null }); })
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, []);

  const setActiveTab = (tab: string) => {
    const nextPath = tabToRoute[tab] || '/';
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const signIn = () => {
    window.location.href = session?.login_url || '/api/auth/login?returnTo=%2F';
  };

  const signOut = () => {
    window.location.href = '/api/auth/logout';
  };

  const hasWorkspaceAccess = Boolean(session?.authenticated || session?.demo_mode);

  if (sessionLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm text-slate-500">Loading secure workspace…</div>;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white transition-colors duration-150">
        
        {/* Top Navbar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isDark={isDark}
          setIsDark={setIsDark}
          session={session}
          onSignIn={signIn}
          onSignOut={signOut}
        />

        {/* Main Content View */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
          {activeTab === 'dashboard' && (hasWorkspaceAccess ? <CentralDashboard setActiveTab={setActiveTab} /> : <PublicHome onSignIn={signIn} setActiveTab={setActiveTab} />)}
          {activeTab === 'review' && (hasWorkspaceAccess ? <RiskReview setActiveTab={setActiveTab} /> : <SignInRequired onSignIn={signIn} />)}
          {activeTab === 'profiles' && (hasWorkspaceAccess ? <SafetyProfiles setActiveTab={setActiveTab} /> : <SignInRequired onSignIn={signIn} />)}
          {activeTab === 'validate' && (hasWorkspaceAccess ? <ReleaseValidation setActiveTab={setActiveTab} /> : <SignInRequired onSignIn={signIn} />)}
          {activeTab === 'simulate' && (hasWorkspaceAccess ? <RuntimeSimulation setActiveTab={setActiveTab} /> : <SignInRequired onSignIn={signIn} />)}
          {activeTab === 'enterprise' && <EnterpriseArch />}
          {activeTab === 'api' && <ApiDocs />}
          {activeTab === 'policies' && (hasWorkspaceAccess ? <PolicyRegistry /> : <SignInRequired onSignIn={signIn} />)}
        </main>

      </div>
    </ErrorBoundary>
  );
}

export default App;
