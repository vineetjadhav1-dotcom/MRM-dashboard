import { useState } from 'react';
import { ActiveTab, UserManagementSettings, UserPermissions } from '../types';
import { 
  NAV_TABS_META, 
  saveUserManagementSettings, 
  DEFAULT_USER_PERMISSIONS 
} from '../utils/userManagement';
import { 
  X, 
  ShieldCheck, 
  User, 
  Check, 
  FileSpreadsheet, 
  Sparkles, 
  Users, 
  Trophy, 
  Lightbulb, 
  Building2, 
  TableProperties, 
  SlidersHorizontal,
  CheckCircle2,
  Info
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserManagementSettings;
  onSaveSettings: (newSettings: UserManagementSettings) => void;
}

const TAB_ICONS: Record<ActiveTab, any> = {
  projectDashboard: Sparkles,
  leader: Users,
  leaderboard: Trophy,
  insights: Lightbulb,
  vp: Building2,
  all: TableProperties,
  overview: SlidersHorizontal,
  userAccess: ShieldCheck
};

export default function UserManagementModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}: UserManagementModalProps) {
  const targetUser = 'planedge';
  const existingPerms: UserPermissions = settings.userPermissions[targetUser] || DEFAULT_USER_PERMISSIONS.planedge;

  const [selectedTabs, setSelectedTabs] = useState<ActiveTab[]>(existingPerms.allowedNavTabs);
  const [showSourceSheet, setShowSourceSheet] = useState<boolean>(existingPerms.showSourceSheet);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleTab = (tabId: ActiveTab) => {
    setSaveSuccess(false);
    setSelectedTabs(prev => {
      if (prev.includes(tabId)) {
        // Prevent deselecting all tabs
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };

  const handleSelectAllTabs = () => {
    setSaveSuccess(false);
    setSelectedTabs(NAV_TABS_META.map(t => t.id));
  };

  const handleResetDefaults = () => {
    setSaveSuccess(false);
    setSelectedTabs(DEFAULT_USER_PERMISSIONS.planedge.allowedNavTabs);
    setShowSourceSheet(DEFAULT_USER_PERMISSIONS.planedge.showSourceSheet);
  };

  const handleSave = () => {
    const newSettings: UserManagementSettings = {
      ...settings,
      userPermissions: {
        ...settings.userPermissions,
        [targetUser]: {
          allowedNavTabs: selectedTabs.length > 0 ? selectedTabs : ['projectDashboard'],
          showSourceSheet
        }
      }
    };

    saveUserManagementSettings(newSettings);
    onSaveSettings(newSettings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        id="user-management-modal"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300 border border-purple-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                User Management &amp; Access Control
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/30">
                  Admin Panel
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control which navigation titles and features are visible to users
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Target User Info Badge */}
          <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Target User:</span>
                  <code className="px-2 py-0.5 bg-slate-100 text-blue-700 rounded font-mono text-xs font-bold">
                    planedge
                  </code>
                </p>
                <p className="text-[11px] text-slate-500">Standard User • Password: 123</p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Role: Standard User
            </span>
          </div>

          {/* Section 1: Navigation Titles Visibility */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Navigation Titles Visibility
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select which dashboard tabs user <strong className="text-slate-700">planedge</strong> can view &amp; navigate
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllTabs}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {NAV_TABS_META.map((tab) => {
                const Icon = TAB_ICONS[tab.id];
                const isSelected = selectedTabs.includes(tab.id);

                return (
                  <label
                    key={tab.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-2xs ring-1 ring-blue-500/20'
                        : 'bg-slate-100/60 border-slate-200 hover:bg-white hover:border-slate-300 opacity-70'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-extrabold tracking-wide uppercase ${
                            isSelected ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {tab.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {tab.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[340px] sm:max-w-[440px]">
                          {tab.description}
                        </p>
                      </div>
                    </div>

                    <div className="ml-3 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTab(tab.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white border-slate-300 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 2: Source Sheet Visibility */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                2. Source Sheet Access Control
              </h4>
              <p className="text-[11px] text-slate-500">
                Choose whether user <strong className="text-slate-700">planedge</strong> can see the Google Sheet link in the top header
              </p>
            </div>

            <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
              showSourceSheet
                ? 'bg-white border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20'
                : 'bg-slate-100/60 border-slate-200 hover:bg-white hover:border-slate-300 opacity-70'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                  showSourceSheet ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-xs font-extrabold ${showSourceSheet ? 'text-slate-900' : 'text-slate-600'}`}>
                    Show &quot;Source Sheet&quot; Link in Header
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {showSourceSheet 
                      ? 'Enabled: Standard user can view and open the linked Google Sheet.'
                      : 'Disabled: Source Sheet link is hidden from the header for this user.'}
                  </p>
                </div>
              </div>

              <div className="ml-3 shrink-0">
                <input
                  type="checkbox"
                  checked={showSourceSheet}
                  onChange={(e) => {
                    setSaveSuccess(false);
                    setShowSourceSheet(e.target.checked);
                  }}
                  className="sr-only"
                />
                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  showSourceSheet ? 'bg-emerald-600' : 'bg-slate-300'
                }`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    showSourceSheet ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </label>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Permissions saved successfully! Applying changes...</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Permissions</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
