import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CentralDashboard } from './components/CentralDashboard';
import { RiskReview } from './components/RiskReview';
import { SafetyProfiles } from './components/SafetyProfiles';
import { ReleaseValidation } from './components/ReleaseValidation';
import { RuntimeSimulation } from './components/RuntimeSimulation';
import { EnterpriseArch } from './components/EnterpriseArch';
import { ApiDocs } from './components/ApiDocs';
import { ShieldCheck, Heart, GitBranch, Globe } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemStatus, setSystemStatus] = useState({
    online: true,
    registeredAgents: 4,
    cfDomain: 'agenticscale.org'
  });

  useEffect(() => {
    // Health check
    api.getHealth()
      .then((data) => {
        setSystemStatus({
          online: data.status === 'online',
          registeredAgents: data.database?.registered_agents || 4,
          cfDomain: 'agenticscale.org'
        });
      })
      .catch((err) => console.error('Health check error:', err));
  }, []);

  return (
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
  );
}

export default App;
