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
  SlidersHorizontal,
  Sun,
  Moon,
  KeyRound,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  adminAuthenticated: boolean;
  adminConfigured: boolean;
  adminKeyStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  onAdminKeyChange: (key: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isDark, setIsDark, adminAuthenticated, adminConfigured, adminKeyStatus, onAdminKeyChange }) => {
  const [showAdminAccess, setShowAdminAccess] = React.useState(false);
  const [draftKey, setDraftKey] = React.useState('');
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'review', label: 'Risk Review', icon: Search },
    { id: 'profiles', label: 'Profiles', icon: FileCode2 },
    { id: 'validate', label: 'Validation', icon: CheckCircle2 },
    { id: 'simulate', label: 'Simulator', icon: PlaySquare },
    { id: 'enterprise', label: 'Enterprise', icon: Layers },
    { id: 'api', label: 'API Docs', icon: Terminal },
    { id: 'policies', label: 'Policies', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo on Left */}
          <button
            type="button"
            className="flex items-center space-x-2.5 cursor-pointer shrink-0" 
            onClick={() => setActiveTab('dashboard')}
            aria-label="Go to dashboard"
          >
            <ShieldCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              AgenticScale
            </span>
          </button>

          {/* Right-Aligned Menu Navigation + Theme Toggle */}
          <div className="flex items-center space-x-2">
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`h-9 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>

            {/* Theme Toggle */}
            {adminConfigured && <button
              type="button"
              onClick={() => setShowAdminAccess(true)}
              className={`h-9 px-2.5 rounded-lg border flex items-center gap-1.5 text-[11px] font-semibold transition-all ${adminAuthenticated ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'}`}
              aria-label={adminAuthenticated ? 'Manage admin operator mode' : 'Enable admin operator mode'}
              title={adminAuthenticated ? 'Admin operator mode active' : 'Enable temporary operator mode'}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{adminKeyStatus === 'checking' ? 'Checking…' : adminAuthenticated ? 'Admin' : 'Access'}</span>
            </button>}
            <button
              onClick={() => setIsDark(!isDark)}
              className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-sm shrink-0"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile nav */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2 space-x-1.5 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
          <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {showAdminAccess && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm flex items-start justify-center p-4 pt-24" role="dialog" aria-modal="true" aria-labelledby="admin-access-title">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="admin-access-title" className="font-bold text-slate-900 dark:text-white">Enable admin operator mode</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This is not a user login. The dashboard remains available read-only; operator mode is only for profile changes, validation, policy controls, and incident decisions. The key is kept only for this browser session.</p>
              </div>
              <button type="button" onClick={() => setShowAdminAccess(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Close admin access dialog">×</button>
            </div>
            <label htmlFor="admin-api-key" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Operator session key</label>
            <input
              id="admin-api-key"
              type="password"
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { onAdminKeyChange(draftKey); setDraftKey(''); setShowAdminAccess(false); } }}
              placeholder="Paste the configured operator key"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              {adminAuthenticated && <button type="button" onClick={() => { onAdminKeyChange(''); setDraftKey(''); setShowAdminAccess(false); }} className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" />Sign out</button>}
              <button type="button" onClick={() => { onAdminKeyChange(draftKey); setDraftKey(''); setShowAdminAccess(false); }} className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-500">Enable operator mode</button>
            </div>
            {adminKeyStatus === 'invalid' && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">That key could not be verified. Check the Cloudflare secret and try again.</p>}
            {adminKeyStatus === 'valid' && <p className="text-xs text-emerald-700 dark:text-emerald-300">Admin key verified for this browser session.</p>}
          </div>
        </div>
      )}
    </header>
  );
};
