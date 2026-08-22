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
  LogIn,
  LogOut
} from 'lucide-react';
import { AuthSession } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  session: AuthSession | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isDark, setIsDark, session, onSignIn, onSignOut }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
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
            <nav className="hidden xl:flex items-center space-x-1">
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

            <div className="hidden xl:block w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>

            <div className="relative">
              {session?.authenticated ? <>
                <button type="button" onClick={() => setShowUserMenu((visible) => !visible)} className="h-9 w-9 sm:h-auto sm:w-auto sm:max-w-[180px] rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-left text-[11px] font-semibold text-emerald-800 transition-all hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" aria-expanded={showUserMenu} aria-label="Open account menu">
                  <span className="block text-center sm:hidden">{(session.user?.name || session.user?.email || 'S').slice(0, 1).toUpperCase()}</span>
                  <span className="hidden truncate sm:block">{session.user?.name || session.user?.email || 'Signed in'}</span>
                  <span className="hidden truncate text-[10px] font-normal opacity-75 sm:block">{session.organization?.name || 'Organization'} · {session.organization?.role || 'member'}</span>
                </button>
                {showUserMenu && <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{session.user?.email}</p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{session.organization?.name}</p>
                  <button type="button" onClick={onSignOut} className="mt-3 flex w-full items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><LogOut className="h-3.5 w-3.5" />Sign out</button>
                </div>}
              </> : <button type="button" onClick={onSignIn} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-brand-500" aria-label="Sign in to AgenticScale"><LogIn className="h-3.5 w-3.5" /><span>Sign in</span></button>}
            </div>
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
      <div className="xl:hidden flex overflow-x-auto px-4 py-2 space-x-1.5 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 scrollbar-none">
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

    </header>
  );
};
