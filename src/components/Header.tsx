import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import PlanedgeLogo from './PlanedgeLogo';
import { Project, Software2Project, ActiveTab } from '@/src/types';
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
  ChevronRight 
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  isUsingDemo: boolean;
  isLoading: boolean;
  onLogout: () => void;
  onRefresh: () => void;
  onToggleDemo: (useDemo: boolean) => void;
  projectsCount: number;
  projects?: Project[];
  software2Projects?: Software2Project[];
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

const NAV_MENU_ITEMS: NavMenuItem[] = [
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
  }
];

export default function Header({
  user,
  isLoading,
  onLogout,
  onRefresh,
  projectsCount,
  activeTab = 'projectDashboard',
  onSelectTab
}: HeaderProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  const activeMenuItem = NAV_MENU_ITEMS.find(item => item.id === activeTab) || NAV_MENU_ITEMS[0];
  const ActiveIcon = activeMenuItem.icon;

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
      <header className="border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 bg-white font-sans relative z-30" id="app-header">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left Side: Logo + Full Header Title */}
          <div className="flex items-center space-x-3.5 shrink-0" id="header-title-container">
            <PlanedgeLogo size="md" />

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Planedge Dashboard
                </h1>

                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <Database className="w-3 h-3 mr-1 text-emerald-600" />
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Active Option Name + Sync Sheet + Source Sheet + User + Hamburger Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0" id="header-top-right-corner">
            
            {/* Active Selected Option Indicator (Clickable to open menu) */}
            <button 
              type="button"
              onClick={() => setIsNavOpen(prev => !prev)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-900 shadow-2xs transition-colors cursor-pointer"
              id="active-option-indicator"
              title={`Current View: ${activeMenuItem.label} (Click to switch view)`}
            >
              <ActiveIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold tracking-wide uppercase truncate max-w-[130px] sm:max-w-[220px]">
                {activeMenuItem.label}
              </span>
            </button>

            {/* Direct Synchronize Spreadsheet Data Button (Immediate direct refresh) */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 sm:px-3.5 py-1.5 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
              title="Synchronize Live Spreadsheet Data directly from Google Sheets"
              id="sync-spreadsheet-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Sync Sheet'}</span>
            </button>

            {/* Source Sheet Link */}
            <a
              href="https://docs.google.com/spreadsheets/d/1BDEpLJk9tIo9Y-CxJYksR2GRjaCuQalr1p2ZNTI5AJA/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
              id="view-sheet-header-link"
              title="Open Google Sheet in new tab"
            >
              <span>Source Sheet</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
            </a>

            {/* User Profile Widget */}
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-2xs" id="user-profile-widget">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#8b6559] text-white flex items-center justify-center text-xs sm:text-sm font-bold uppercase shadow-2xs shrink-0">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-extrabold text-slate-800 tracking-tight truncate max-w-[110px] md:max-w-[140px]">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[110px] md:max-w-[140px]">
                      {user.email || ''}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  id="logout-btn"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : null}

            {/* Attachment Style Hamburger Menu Toggle Button */}
            <button
              type="button"
              id="header-hamburger-menu-button"
              onClick={() => setIsNavOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={isNavOpen}
              className="p-2 sm:p-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
              title={isNavOpen ? 'Close Menu' : 'Open Navigation Menu'}
            >
              {isNavOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Dimmed Backdrop Overlay (Behind the dropdown panel) */}
      {isNavOpen && (
        <div 
          className="fixed inset-0 top-[65px] bg-slate-950/25 backdrop-blur-[1px] z-30 transition-opacity"
          onClick={() => setIsNavOpen(false)} 
        />
      )}

      {/* Downward Expanding Dropdown Navigation Menu (Sample Attachment Style) */}
      {isNavOpen && (
        <div 
          id="dropdown-navigation-menu-panel"
          className="relative z-40 w-full bg-white border-b border-slate-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="max-w-[1536px] mx-auto divide-y divide-slate-200">
            {NAV_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`dropdown-nav-item-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOption(item.id);
                  }}
                  className={`w-full text-left px-5 sm:px-8 py-4 sm:py-4.5 transition-colors cursor-pointer flex items-center justify-between group ${
                    isActive 
                      ? 'bg-blue-50/70 text-blue-900 font-bold border-l-4 border-blue-600' 
                      : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-xl transition-colors shrink-0 ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div>
                      <span className={`text-sm sm:text-base font-extrabold tracking-wide uppercase block ${
                        isActive ? 'text-blue-900' : 'text-slate-800 group-hover:text-slate-900'
                      }`}>
                        {item.label}
                      </span>
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
            <span className="text-[11px] text-slate-400">Click any option to switch dashboard view</span>
          </div>
        </div>
      )}
    </div>
  );
}
