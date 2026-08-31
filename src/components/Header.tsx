import { useState, useRef, useEffect } from 'react';
import PlanedgeLogo from './PlanedgeLogo';
import { Project, Software2Project, ActiveTab, AppUser, UserPermissions, FiscalYearKey, Software3Milestone } from '@/src/types';
import HorizontalFilterBar from './HorizontalFilterBar';
import { 
  getFiscalYearConfig, 
  getStoredFiscalYear, 
  setStoredFiscalYear, 
  FISCAL_YEAR_KEYS 
} from '@/src/utils/fiscalYear';
import { 
  RefreshCw, 
  LogOut, 
  ExternalLink, 
  Database, 
  Sparkles, 
  Menu, 
  X, 
  Users, 
  Trophy, 
  Lightbulb, 
  Building2, 
  TableProperties, 
  SlidersHorizontal, 
  Check, 
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Calendar,
  Flag
} from 'lucide-react';

interface HeaderProps {
  currentUser: AppUser | null;
  permissions: UserPermissions;
  isUsingDemo: boolean;
  isLoading: boolean;
  onLogout: () => void;
  onRefresh: () => void;
  onToggleDemo?: (useDemo: boolean) => void;
  projectsCount: number;
  projects?: Project[];
  software2Projects?: Software2Project[];
  software3Milestones?: Software3Milestone[];
  onLoadCustomData?: (rows: string[][], rows2?: string[][]) => void;
  onOpenLogin?: () => void;
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
}

interface NavMenuItem {
  id: ActiveTab;
  label: string;
  subtitle: string;
  icon: any;
}

const ALL_NAV_MENU_ITEMS: NavMenuItem[] = [
  {
    id: 'projectDashboard',
    label: 'PROJECT DASHBOARD',
    subtitle: 'Milestones, SPI, QHSE ratings & Monthly Plan vs Actuals',
    icon: Sparkles
  },
  {
    id: 'leader',
    label: 'MRM DASHBOARD',
    subtitle: 'Leader portfolio breakdown & interactive review slide deck',
    icon: Users
  },
  {
    id: 'leaderboard',
    label: 'LEADERBOARD',
    subtitle: 'Executive benchmarking, project scores & tier rankings',
    icon: Trophy
  },
  {
    id: 'milestones',
    label: 'MILESTONE ANALYSIS',
    subtitle: 'Detailed categories, weekly plan, bottlenecks & enabler readings',
    icon: Flag
  },
  {
    id: 'insights',
    label: 'KEY INSIGHTS & FORECAST',
    subtitle: 'Multi-parameter forecasting, delay analytics & 3-layer drilldown',
    icon: Lightbulb
  },
  {
    id: 'vp',
    label: 'VP PORTFOLIOS',
    subtitle: 'VP-level project rollups, regional performance & distribution',
    icon: Building2
  },
  {
    id: 'all',
    label: 'PROJECTS REGISTRY',
    subtitle: 'Master searchable registry of all project data & statuses',
    icon: TableProperties
  },
  {
    id: 'overview',
    label: 'DATA CONFIGURATION',
    subtitle: 'Column mapping, header rows & spreadsheet source parameters',
    icon: SlidersHorizontal
  },
  {
    id: 'userAccess',
    label: 'USER ACCESS',
    subtitle: 'Manage user accounts, roles, navigation tabs & portfolio scoping',
    icon: ShieldCheck
  }
];

export default function Header({
  currentUser,
  permissions,
  isLoading,
  onLogout,
  onRefresh,
  projectsCount,
  projects = [],
  software2Projects = [],
  software3Milestones = [],
  activeTab = 'projectDashboard',
  onSelectTab
}: HeaderProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeFiscalYear, setActiveFiscalYear] = useState<FiscalYearKey>(() => getStoredFiscalYear());
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const handleFyChanged = () => setActiveFiscalYear(getStoredFiscalYear());
    window.addEventListener('mrm-fiscal-year-changed', handleFyChanged);
    return () => window.removeEventListener('mrm-fiscal-year-changed', handleFyChanged);
  }, []);

  const handleFiscalYearChange = (newFy: FiscalYearKey) => {
    setActiveFiscalYear(newFy);
    setStoredFiscalYear(newFy);
  };

  // Filter navigation items according to permissions
  const visibleNavItems = ALL_NAV_MENU_ITEMS.filter(item => {
    if (isAdmin) return true;
    if (item.id === 'userAccess') return false; // Only admin sees User Access tab
    return permissions.allowedNavTabs.includes(item.id);
  });

  const activeMenuItem = ALL_NAV_MENU_ITEMS.find(item => item.id === activeTab) || ALL_NAV_MENU_ITEMS[0];
  const ActiveIcon = activeMenuItem.icon;

  // Permissions
  const canViewSourceSheet = isAdmin || permissions.showSourceSheet;
  const canSyncSheet = isAdmin || permissions.canSyncSheet !== false;
  const canChangeFiscalYear = isAdmin || permissions.canChangeFiscalYear !== false;

  // Close nav on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setIsNavOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNavOpen(false);
      }
    };
    if (isNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNavOpen]);

  const handleSelectOption = (tabId: ActiveTab) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    }
    setIsNavOpen(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-white" ref={navContainerRef}>
      {/* Top Header Bar */}
      <header className="border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 bg-white font-sans relative z-30" id="app-header">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-2.5 sm:gap-4 flex-wrap">
          
          {/* Left Side: Logo + Full Header Title */}
          <div className="flex items-center space-x-3 shrink-0" id="header-title-container">
            <PlanedgeLogo size="header" />

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Planedge Executive Dashboard
                </h1>

                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <Database className="w-3 h-3 mr-1 text-emerald-600" />
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Active Option Name + Direct Sync + Source Sheet + User Profile + Menu */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 ml-auto" id="header-top-right-corner">
            
            {/* Fiscal Year Switcher Dropdown Control */}
            {canChangeFiscalYear ? (
              <div 
                className="relative flex items-center bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 hover:from-blue-100 hover:to-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-xl px-2.5 sm:px-3 py-1 shadow-2xs transition-all group cursor-pointer"
                id="header-fiscal-year-selector"
                title="Select Active Reporting Fiscal Year Range"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0 mr-1.5" />
                <select
                  value={activeFiscalYear}
                  onChange={(e) => handleFiscalYearChange(e.target.value as FiscalYearKey)}
                  aria-label="Select Fiscal Year"
                  className="bg-transparent text-xs font-black text-indigo-950 focus:outline-none cursor-pointer pr-4 appearance-none hover:text-indigo-700 font-sans"
                >
                  {FISCAL_YEAR_KEYS.map((fy) => {
                    const cfg = getFiscalYearConfig(fy);
                    return (
                      <option key={fy} value={fy} className="text-slate-900 bg-white font-bold py-1">
                        {cfg.label} ({cfg.startMonthKey}–{cfg.endMonthKey})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 pointer-events-none absolute right-2.5 shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </div>
            ) : (
              <div 
                className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1 shadow-2xs text-slate-700"
                id="header-fiscal-year-display"
                title="Active Reporting Fiscal Year"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs font-black text-slate-800 font-sans">
                  {getFiscalYearConfig(activeFiscalYear).label} ({getFiscalYearConfig(activeFiscalYear).startMonthKey}–{getFiscalYearConfig(activeFiscalYear).endMonthKey})
                </span>
              </div>
            )}

            {/* Direct Synchronize Spreadsheet Data Button */}
            {canSyncSheet && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-2.5 sm:px-3 py-1 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
                title="Synchronize Live Spreadsheet Data directly from Google Sheets"
                id="sync-spreadsheet-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Syncing...' : 'Sync Sheet'}</span>
              </button>
            )}

            {/* Source Sheet Link */}
            {canViewSourceSheet && (
              <a
                href="https://docs.google.com/spreadsheets/d/1BDEpLJk9tIo9Y-CxJYksR2GRjaCuQalr1p2ZNTI5AJA/edit?gid=0#gid=0"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center px-2.5 sm:px-3 py-1 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                id="view-sheet-header-link"
                title="Open Google Sheet in new tab"
              >
                <span>Source Sheet</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-400" />
              </a>
            )}

            {/* User Profile Widget */}
            {currentUser && (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 py-0.5 shadow-2xs" id="user-profile-widget">
                <div 
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[11px] font-bold uppercase shadow-2xs shrink-0"
                  style={{ backgroundColor: currentUser.avatarBg || (isAdmin ? '#6366f1' : '#0284c7') }}
                >
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="text-left hidden sm:block">
                  <div className="flex items-center space-x-1">
                    <p className="text-xs font-extrabold text-slate-800 tracking-tight truncate max-w-[90px] md:max-w-[120px]">
                      {currentUser.displayName}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  id="logout-btn"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Attachment Style Hamburger Menu Toggle Button */}
            <button
              type="button"
              id="header-hamburger-menu-button"
              onClick={() => setIsNavOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={isNavOpen}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
              title={isNavOpen ? 'Close Menu' : 'Open Navigation Menu'}
            >
              {isNavOpen ? (
                <X className="w-4 h-4 text-slate-800" />
              ) : (
                <Menu className="w-4 h-4 text-slate-800" />
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Horizontal Navigation Bar (Direct 1-Click Access) */}
      <nav className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 lg:px-8 py-1 overflow-x-auto scrollbar-none shadow-inner" id="horizontal-nav-bar" aria-label="Main Navigation">
        <div className="max-w-[1536px] mx-auto flex items-center space-x-1.5 sm:space-x-2 min-w-max">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isUserAccessTab = item.id === 'userAccess';

            return (
              <button
                key={item.id}
                type="button"
                id={`navbar-tab-${item.id}`}
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : isUserAccessTab
                    ? 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 hover:text-white border border-purple-800/40'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={item.subtitle}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : isUserAccessTab ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="tracking-wide uppercase text-[11px] sm:text-xs">
                  {item.label}
                </span>
                {isUserAccessTab && (
                  <span className="text-[8px] font-black px-1 py-0.2 rounded bg-purple-500/30 text-purple-200">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Dedicated 1-Click Horizontal Filter Bar */}
      {activeTab && (
        <HorizontalFilterBar
          activeTab={activeTab}
          projects={projects}
          software2Projects={software2Projects}
          software3Milestones={software3Milestones}
        />
      )}

      {/* Dimmed Backdrop Overlay (Behind the dropdown panel) */}
      {isNavOpen && (
        <div 
          className="fixed inset-0 top-[60px] bg-slate-950/25 backdrop-blur-[1px] z-30 transition-opacity"
          onClick={() => setIsNavOpen(false)} 
        />
      )}

      {/* Downward Expanding Dropdown Navigation Menu */}
      {isNavOpen && (
        <div 
          id="dropdown-navigation-menu-panel"
          className="relative z-40 w-full bg-white border-b border-slate-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="max-w-[1536px] mx-auto divide-y divide-slate-200">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isUserAccessTab = item.id === 'userAccess';

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`dropdown-nav-item-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOption(item.id);
                  }}
                  className={`w-full text-left px-5 sm:px-8 py-3.5 sm:py-4 transition-colors cursor-pointer flex items-center justify-between group ${
                    isActive 
                      ? 'bg-blue-50/70 text-blue-900 font-bold border-l-4 border-blue-600' 
                      : isUserAccessTab
                        ? 'bg-purple-50/40 hover:bg-purple-50 text-slate-800 hover:text-purple-900'
                        : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-xl transition-colors shrink-0 ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : isUserAccessTab
                          ? 'bg-purple-100 text-purple-700 group-hover:bg-purple-200'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm sm:text-base font-extrabold tracking-wide uppercase block ${
                          isActive 
                            ? 'text-blue-900' 
                            : isUserAccessTab
                              ? 'text-purple-900 group-hover:text-purple-950'
                              : 'text-slate-800 group-hover:text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                        {isUserAccessTab && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 uppercase tracking-wider">
                            Admin Only
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-blue-600 translate-x-1' : 'text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Bar inside Dropdown */}
          <div className="px-5 sm:px-8 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Tracking <strong className="text-slate-800 font-bold">{projectsCount}</strong> Projects in Master Sheet</span>
            {isAdmin && (
              <span className="text-[11px] text-purple-600 font-bold">
                Administrator Mode Active
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
