import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { CentralDashboard } from './components/CentralDashboard';
import { RiskReview } from './components/RiskReview';
import { SafetyProfiles } from './components/SafetyProfiles';
import { ReleaseValidation } from './components/ReleaseValidation';
import { RuntimeSimulation } from './components/RuntimeSimulation';
import { EnterpriseArch } from './components/EnterpriseArch';
import { ApiDocs } from './components/ApiDocs';
import { api } from './services/api';
import { ShieldCheck, GitBranch, Globe, AlertTriangle, RefreshCw } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-2xl max-w-lg w-full border border-rose-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Rendering Recovered</h2>
            <p className="text-xs text-slate-400 font-mono bg-slate-900 p-3 rounded text-left overflow-x-auto">
              {this.state.error?.message || 'An unexpected error occurred during rendering'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold transition-all flex items-center space-x-2 mx-auto"
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
  const [systemStatus, setSystemStatus] = useState({
    online: true,
    registeredAgents: 4,
    cfDomain: 'agenticscale.org'
  });

  useEffect(() => {
    api.getHealth()
      .then((data) => {
        if (data) {
          setSystemStatus({
            online: data.status === 'online',
            registeredAgents: data.database?.registered_agents || 4,
            cfDomain: 'agenticscale.org'
          });
        }
      })
      .catch((err) => console.error('Health check error:', err));
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
        
        {/* Top Navbar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          systemStatus={systemStatus} 
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

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="font-bold text-slate-300">AgenticScale</span>
              <span>— Continuous Safety Assurance Platform for AI Agents</span>
            </div>

            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-1.5 font-mono text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Cloudflare D1 Production</span>
              </span>
              <a 
                href="https://github.com/kelvin-ling/AgenticScale" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-slate-300 transition-colors flex items-center space-x-1"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
              <a 
                href="https://agenticscale.org" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-slate-300 transition-colors flex items-center space-x-1 text-brand-400"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>agenticscale.org</span>
              </a>
            </div>

          </div>
        </footer>

      </div>
    </ErrorBoundary>
  );
}

export default App;
