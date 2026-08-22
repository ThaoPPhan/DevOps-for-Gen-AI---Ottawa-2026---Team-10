import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Search, 
  FileCode2, 
  CheckCircle2, 
  PlaySquare, 
  Layers, 
  Terminal,
  Globe,
  Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: {
    online: boolean;
    registeredAgents: number;
    cfDomain: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemStatus }) => {
  const navItems = [
    { id: 'dashboard', label: 'Safety Dashboard', icon: Activity, badge: null },
    { id: 'review', label: '1. Risk Review', icon: Search, badge: 'Module 1' },
    { id: 'profiles', label: '2. Safety Profiles', icon: FileCode2, badge: 'Module 2' },
    { id: 'validate', label: '3. Pre-Release Validation', icon: CheckCircle2, badge: 'Module 3' },
    { id: 'simulate', label: '4. Runtime Simulator', icon: PlaySquare, badge: 'Module 4' },
    { id: 'enterprise', label: 'Enterprise Arch', icon: Layers, badge: null },
    { id: 'api', label: 'API & Gateway', icon: Terminal, badge: null },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  AgenticScale
                </span>
                <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Continuous Assurance
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">AI Agent Safety Operations Layer</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Cloudflare Edge Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Cloudflare D1 Edge</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-brand-950/40 border border-brand-800/50 text-xs text-brand-300 font-mono">
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>agenticscale.org</span>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 space-x-2 bg-slate-900/90 border-t border-slate-800 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 ${
                isActive ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
