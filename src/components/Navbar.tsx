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
  LogOut,
  ChevronDown,
  Menu,
  X
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

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };

const workspaceItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'review', label: 'Risk Review', icon: Search },
  { id: 'profiles', label: 'Profiles', icon: FileCode2 },
  { id: 'validate', label: 'Validation', icon: CheckCircle2 }
];

const operationsItems: NavItem[] = [
  { id: 'simulate', label: 'Simulator', icon: PlaySquare },
  { id: 'policies', label: 'Policies', icon: SlidersHorizontal }
];

const resourceItems: NavItem[] = [
  { id: 'enterprise', label: 'Enterprise', icon: Layers },
  { id: 'api', label: 'API Docs', icon: Terminal }
];

const allItems = [...workspaceItems, ...operationsItems, ...resourceItems];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isDark, setIsDark, session, onSignIn, onSignOut }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const activeItem = allItems.find((item) => item.id === activeTab) || workspaceItems[0];
  const ActiveIcon = activeItem.icon;
  const moreIsActive = [...operationsItems, ...resourceItems].some((item) => item.id === activeTab);

  const navigate = (tab: string) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
    setShowMobileMenu(false);
    setShowUserMenu(false);
  };

  const renderNavButton = (item: NavItem, compact = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigate(item.id)}
        className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${compact ? 'w-full px-3 py-2.5 text-left' : 'h-9 px-3'} ${
          isActive
            ? 'border border-brand-200 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <button
            type="button"
            className="flex shrink-0 cursor-pointer items-center space-x-2.5"
            onClick={() => navigate('dashboard')}
            aria-label="Go to dashboard"
          >
            <ShieldCheck className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">AgenticScale</span>
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {workspaceItems.map((item) => renderNavButton(item))}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreMenu((visible) => !visible)}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
                    moreIsActive
                      ? 'border border-brand-200 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={showMoreMenu}
                >
                  More <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-11 z-50 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900" role="menu">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operations</p>
                    {operationsItems.map((item) => renderNavButton(item, true))}
                    <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                    <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Resources</p>
                    {resourceItems.map((item) => renderNavButton(item, true))}
                  </div>
                )}
              </div>
            </nav>

            <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-800 lg:block" />

            <div className="relative">
              {session?.authenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((visible) => !visible)}
                    className="h-9 w-9 max-w-[180px] rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-left text-[11px] font-semibold text-emerald-800 transition-all hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 sm:h-auto sm:w-auto"
                    aria-expanded={showUserMenu}
                    aria-label="Open account menu"
                  >
                    <span className="block text-center sm:hidden">{(session.user?.name || session.user?.email || 'S').slice(0, 1).toUpperCase()}</span>
                    <span className="hidden truncate sm:block">{session.user?.name || session.user?.email || 'Signed in'}</span>
                    <span className="hidden truncate text-[10px] font-normal opacity-75 sm:block">{session.organization?.name || 'Organization'} · {session.organization?.role || 'member'}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{session.user?.email}</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{session.organization?.name}</p>
                      <button type="button" onClick={onSignOut} className="mt-3 flex w-full items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><LogOut className="h-3.5 w-3.5" />Sign out</button>
                    </div>
                  )}
                </>
              ) : (
                <button type="button" onClick={onSignIn} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-brand-500" aria-label="Sign in to AgenticScale"><LogIn className="h-3.5 w-3.5" /><span>Sign in</span></button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition-all hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => setShowMobileMenu((visible) => !visible)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            aria-expanded={showMobileMenu}
            aria-controls="mobile-navigation"
          >
            {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            Menu
          </button>
          <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ActiveIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            {activeItem.label}
          </span>
        </div>
        {showMobileMenu && (
          <nav id="mobile-navigation" className="mx-auto max-w-7xl border-t border-slate-200 px-4 pb-3 pt-2 sm:px-6" aria-label="Mobile navigation">
            <p className="px-1 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            <div className="grid grid-cols-2 gap-1">{workspaceItems.map((item) => renderNavButton(item, true))}</div>
            <p className="px-1 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operations</p>
            <div className="grid grid-cols-2 gap-1">{operationsItems.map((item) => renderNavButton(item, true))}</div>
            <p className="px-1 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Resources</p>
            <div className="grid grid-cols-2 gap-1">{resourceItems.map((item) => renderNavButton(item, true))}</div>
          </nav>
        )}
      </div>
    </header>
  );
};
