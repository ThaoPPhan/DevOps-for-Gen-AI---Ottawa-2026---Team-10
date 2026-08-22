import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { CentralDashboard } from './components/CentralDashboard';
import { RiskReview } from './components/RiskReview';
import { SafetyProfiles } from './components/SafetyProfiles';
import { ReleaseValidation } from './components/ReleaseValidation';
import { RuntimeSimulation } from './components/RuntimeSimulation';
import { EnterpriseArch } from './components/EnterpriseArch';
import { ApiDocs } from './components/ApiDocs';
import { ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

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
            <h2 className="text-xl font-bold">Rendering Recovered</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 p-3 rounded text-left overflow-x-auto">
              {this.state.error?.message || 'An unexpected error occurred during rendering'}
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white transition-colors duration-150">
        
        {/* Top Navbar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isDark={isDark}
          setIsDark={setIsDark}
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
        </main>

        {/* Minimal Clean Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 mt-12 text-xs text-slate-500 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="font-bold text-slate-800 dark:text-slate-300">AgenticScale</span>
              <span>— AI Agent Safety Operations</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              &copy; {new Date().getFullYear()} AgenticScale. All rights reserved.
            </div>
          </div>
        </footer>

      </div>
    </ErrorBoundary>
  );
}

export default App;
