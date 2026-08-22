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
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from './services/api';
import { AuthSession } from './types';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

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

  const signOut = () => {
    window.location.href = '/cdn-cgi/access/logout';
  };

  if (sessionLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm text-slate-500">Loading secure workspace…</div>;
  }

  if (!session?.authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-xl">
          <ShieldCheck className="mx-auto h-12 w-12 text-brand-600 dark:text-brand-400" />
          <h1 className="mt-5 text-2xl font-extrabold">Sign in to AgenticScale</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Use your organization account to view its agents, safety events, incidents, and policies.</p>
          <a href={session?.login_url || '/cdn-cgi/access/login'} className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500">Continue to secure login</a>
          <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">Access is limited to invited organization members.</p>
        </div>
      </div>
    );
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
          onSignOut={signOut}
        />

        {/* Main Content View */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
          {activeTab === 'dashboard' && <CentralDashboard setActiveTab={setActiveTab} />}
          {activeTab === 'review' && <RiskReview setActiveTab={setActiveTab} />}
          {activeTab === 'profiles' && <SafetyProfiles setActiveTab={setActiveTab} />}
          {activeTab === 'validate' && <ReleaseValidation setActiveTab={setActiveTab} />}
          {activeTab === 'simulate' && <RuntimeSimulation setActiveTab={setActiveTab} />}
          {activeTab === 'enterprise' && <EnterpriseArch />}
          {activeTab === 'api' && <ApiDocs />}
          {activeTab === 'policies' && <PolicyRegistry />}
        </main>

      </div>
    </ErrorBoundary>
  );
}

export default App;
