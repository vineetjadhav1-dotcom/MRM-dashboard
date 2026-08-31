import { useState, useMemo, FormEvent, useRef, ChangeEvent } from 'react';
import { ActiveTab, AppUser, UserManagementSettings, UserPermissions, Project, Software2Project } from '../types';
import { 
  NAV_TABS_META, 
  saveUserManagementSettings, 
  DEFAULT_USER_PERMISSIONS 
} from '../utils/userManagement';
import { isTempProject } from '../utils/customOrder';
import { 
  ShieldCheck, 
  UserPlus, 
  User, 
  Check, 
  Trash2, 
  FileSpreadsheet, 
  Sparkles, 
  Users, 
  Trophy, 
  Lightbulb, 
  Building2, 
  TableProperties, 
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  Layers,
  RefreshCw,
  Printer,
  ChevronRight,
  Filter,
  AlertCircle,
  UploadCloud,
  FileText,
  Search,
  Download,
  FolderGit2,
  Calendar,
  Flag
} from 'lucide-react';

interface UserManagementViewProps {
  settings: UserManagementSettings;
  onSaveSettings: (newSettings: UserManagementSettings) => void;
  projects?: Project[];
  software2Projects?: Software2Project[];
  currentUser: AppUser | null;
}

const TAB_ICONS: Record<ActiveTab, any> = {
  projectDashboard: Sparkles,
  leader: Users,
  leaderboard: Trophy,
  insights: Lightbulb,
  vp: Building2,
  milestones: Flag,
  all: TableProperties,
  overview: SlidersHorizontal,
  userAccess: ShieldCheck
};

export default function UserManagementView({
  settings,
  onSaveSettings,
  projects = [],
  software2Projects = [],
  currentUser
}: UserManagementViewProps) {
  // Extract all distinct VPs
  const allVPs = useMemo(() => {
    const vps = new Set<string>();
    projects.forEach(p => { if (p.vp && p.vp.trim()) vps.add(p.vp.trim()); });
    software2Projects.forEach(p => { if (p.vp && p.vp.trim()) vps.add(p.vp.trim()); });
    return Array.from(vps).sort();
  }, [projects, software2Projects]);

  // Extract all distinct Leaders
  const allLeaders = useMemo(() => {
    const leaders = new Set<string>();
    projects.forEach(p => { if (p.leader && p.leader.trim()) leaders.add(p.leader.trim()); });
    software2Projects.forEach(p => { if (p.leader && p.leader.trim()) leaders.add(p.leader.trim()); });
    return Array.from(leaders).sort();
  }, [projects, software2Projects]);

  // Extract unique projects list (combining primary and software2)
  const allProjectItems = useMemo(() => {
    const map = new Map<string, { code: string; name: string; leader: string; vp: string }>();
    projects.forEach(p => {
      const code = p.code ? p.code.trim() : '';
      if (code && !isTempProject(code)) {
        map.set(code, {
          code,
          name: p.name || code,
          leader: p.leader || '',
          vp: p.vp || ''
        });
      }
    });
    software2Projects.forEach(p => {
      const code = p.code ? p.code.trim() : '';
      if (code && !isTempProject(code) && !map.has(code)) {
        map.set(code, {
          code,
          name: p.name || code,
          leader: p.leader || '',
          vp: p.vp || ''
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [projects, software2Projects]);

  // Selected user to manage
  const [selectedUsername, setSelectedUsername] = useState<string>('planedge');

  // Sub-tabs for permission editor
  const [editorTab, setEditorTab] = useState<'nav' | 'scoping' | 'features'>('nav');

  // Project search query within scoping
  const [projectSearch, setProjectSearch] = useState('');

  // Create User Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [createError, setCreateError] = useState<string | null>(null);

  // Bulk Import Users Form State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Success Feedback
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const selectedUser = settings.users.find(u => u.username.toLowerCase() === selectedUsername.toLowerCase()) || settings.users[0];
  const userPerms: UserPermissions = settings.userPermissions[selectedUser.username.toLowerCase()] || DEFAULT_USER_PERMISSIONS[selectedUser.username.toLowerCase()] || {
    allowedNavTabs: ['projectDashboard', 'leader'],
    showSourceSheet: true,
    canSyncSheet: true,
    canExportReport: true,
    canEditConfig: false,
    canChangeFiscalYear: true,
    allowedVPs: ['all'],
    allowedLeaders: ['all'],
    allowedProjectCodes: ['all']
  };

  // Local state for editing currently selected user permissions
  const [localTabs, setLocalTabs] = useState<ActiveTab[]>(userPerms.allowedNavTabs);
  const [localShowSourceSheet, setLocalShowSourceSheet] = useState<boolean>(userPerms.showSourceSheet);
  const [localCanSync, setLocalCanSync] = useState<boolean>(userPerms.canSyncSheet ?? true);
  const [localCanExport, setLocalCanExport] = useState<boolean>(userPerms.canExportReport ?? true);
  const [localCanEditConfig, setLocalCanEditConfig] = useState<boolean>(userPerms.canEditConfig ?? false);
  const [localCanChangeFiscalYear, setLocalCanChangeFiscalYear] = useState<boolean>(userPerms.canChangeFiscalYear ?? true);
  const [localVPs, setLocalVPs] = useState<string[]>(userPerms.allowedVPs || ['all']);
  const [localLeaders, setLocalLeaders] = useState<string[]>(userPerms.allowedLeaders || ['all']);
  const [localProjects, setLocalProjects] = useState<string[]>(userPerms.allowedProjectCodes || ['all']);

  // Synchronize local states whenever selected user changes
  const handleSelectUser = (u: AppUser) => {
    setSelectedUsername(u.username);
    const p = settings.userPermissions[u.username.toLowerCase()] || DEFAULT_USER_PERMISSIONS[u.username.toLowerCase()] || {
      allowedNavTabs: ['projectDashboard', 'leader'],
      showSourceSheet: true,
      canSyncSheet: true,
      canExportReport: true,
      canEditConfig: false,
      canChangeFiscalYear: true,
      allowedVPs: ['all'],
      allowedLeaders: ['all'],
      allowedProjectCodes: ['all']
    };
    setLocalTabs(p.allowedNavTabs);
    setLocalShowSourceSheet(p.showSourceSheet);
    setLocalCanSync(p.canSyncSheet ?? true);
    setLocalCanExport(p.canExportReport ?? true);
    setLocalCanEditConfig(p.canEditConfig ?? false);
    setLocalCanChangeFiscalYear(p.canChangeFiscalYear ?? true);
    setLocalVPs(p.allowedVPs || ['all']);
    setLocalLeaders(p.allowedLeaders || ['all']);
    setLocalProjects(p.allowedProjectCodes || ['all']);
    setSaveToast(null);
  };

  const handleToggleTab = (tabId: ActiveTab) => {
    setLocalTabs(prev => {
      if (prev.includes(tabId)) {
        if (prev.length === 1) return prev; // At least one tab must remain
        return prev.filter(t => t !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };

  const handleToggleVP = (vp: string) => {
    setLocalVPs(prev => {
      if (vp === 'all') {
        return ['all'];
      }
      const withoutAll = prev.filter(v => v !== 'all');
      if (withoutAll.includes(vp)) {
        const next = withoutAll.filter(v => v !== vp);
        return next.length === 0 ? ['all'] : next;
      } else {
        const next = [...withoutAll, vp];
        if (next.length === allVPs.length) return ['all'];
        return next;
      }
    });
  };

  const handleToggleLeader = (leader: string) => {
    setLocalLeaders(prev => {
      if (leader === 'all') {
        return ['all'];
      }
      const withoutAll = prev.filter(l => l !== 'all');
      if (withoutAll.includes(leader)) {
        const next = withoutAll.filter(l => l !== leader);
        return next.length === 0 ? ['all'] : next;
      } else {
        const next = [...withoutAll, leader];
        if (next.length === allLeaders.length) return ['all'];
        return next;
      }
    });
  };

  const handleToggleProject = (code: string) => {
    setLocalProjects(prev => {
      if (code === 'all') {
        return ['all'];
      }
      const withoutAll = prev.filter(c => c !== 'all');
      if (withoutAll.includes(code)) {
        const next = withoutAll.filter(c => c !== code);
        return next.length === 0 ? ['all'] : next;
      } else {
        const next = [...withoutAll, code];
        if (next.length === allProjectItems.length) return ['all'];
        return next;
      }
    });
  };

  const handleApplyPreset = (preset: 'full' | 'executive' | 'restricted') => {
    if (preset === 'full') {
      setLocalTabs(NAV_TABS_META.map(t => t.id).filter(id => id !== 'userAccess'));
      setLocalShowSourceSheet(true);
      setLocalCanSync(true);
      setLocalCanExport(true);
      setLocalCanEditConfig(true);
      setLocalCanChangeFiscalYear(true);
      setLocalVPs(['all']);
      setLocalLeaders(['all']);
      setLocalProjects(['all']);
    } else if (preset === 'executive') {
      setLocalTabs(['projectDashboard', 'leader', 'leaderboard', 'insights', 'vp']);
      setLocalShowSourceSheet(true);
      setLocalCanSync(true);
      setLocalCanExport(true);
      setLocalCanEditConfig(false);
      setLocalCanChangeFiscalYear(true);
      setLocalVPs(['all']);
      setLocalLeaders(['all']);
      setLocalProjects(['all']);
    } else if (preset === 'restricted') {
      setLocalTabs(['projectDashboard', 'leader']);
      setLocalShowSourceSheet(false);
      setLocalCanSync(false);
      setLocalCanExport(false);
      setLocalCanEditConfig(false);
      setLocalCanChangeFiscalYear(false);
    }
  };

  const handleSaveUserPermissions = async () => {
    const updatedPermissions: UserPermissions = {
      allowedNavTabs: localTabs.length > 0 ? localTabs : ['projectDashboard'],
      showSourceSheet: localShowSourceSheet,
      canSyncSheet: localCanSync,
      canExportReport: localCanExport,
      canEditConfig: localCanEditConfig,
      canChangeFiscalYear: localCanChangeFiscalYear,
      allowedVPs: localVPs.length > 0 ? localVPs : ['all'],
      allowedLeaders: localLeaders.length > 0 ? localLeaders : ['all'],
      allowedProjectCodes: localProjects.length > 0 ? localProjects : ['all']
    };

    const newSettings: UserManagementSettings = {
      ...settings,
      userPermissions: {
        ...settings.userPermissions,
        [selectedUser.username.toLowerCase()]: updatedPermissions
      }
    };

    onSaveSettings(newSettings);
    const synced = await saveUserManagementSettings(newSettings);
    if (synced) {
      setSaveToast(`✓ Permissions updated & synced to Cloud Firestore for "${selectedUser.username}"!`);
    } else {
      setSaveToast(`Permissions updated locally for "${selectedUser.username}". (Cloud sync in progress)`);
    }
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername || !newPassword.trim() || !newDisplayName.trim()) {
      setCreateError('Please fill in all required fields.');
      return;
    }

    if (settings.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setCreateError(`Username "${cleanUsername}" already exists. Please choose a different username.`);
      return;
    }

    const colors = ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
    const randomColor = colors[settings.users.length % colors.length];

    const newUser: AppUser = {
      id: cleanUsername,
      username: cleanUsername,
      password: newPassword.trim(),
      displayName: newDisplayName.trim(),
      role: newRole,
      avatarBg: randomColor,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const newSettings: UserManagementSettings = {
      users: [...settings.users, newUser],
      userPermissions: {
        ...settings.userPermissions,
        [cleanUsername]: {
          allowedNavTabs: newRole === 'admin' 
            ? NAV_TABS_META.map(t => t.id)
            : ['projectDashboard', 'leader'],
          showSourceSheet: true,
          canSyncSheet: true,
          canExportReport: true,
          canEditConfig: newRole === 'admin',
          allowedVPs: ['all'],
          allowedLeaders: ['all'],
          allowedProjectCodes: ['all']
        }
      }
    };

    onSaveSettings(newSettings);
    setShowCreateModal(false);
    setNewUsername('');
    setNewPassword('');
    setNewDisplayName('');
    setNewRole('user');
    setSelectedUsername(cleanUsername);
    await saveUserManagementSettings(newSettings);
    setSaveToast(`✓ User "${cleanUsername}" created & synced to Cloud Firestore!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (usernameToDelete.toLowerCase() === 'admin') {
      alert('The primary administrator account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${usernameToDelete}"?`)) {
      const remainingUsers = settings.users.filter(u => u.username.toLowerCase() !== usernameToDelete.toLowerCase());
      const remainingPerms = { ...settings.userPermissions };
      delete remainingPerms[usernameToDelete.toLowerCase()];

      const newSettings: UserManagementSettings = {
        users: remainingUsers,
        userPermissions: remainingPerms
      };

      onSaveSettings(newSettings);
      setSelectedUsername(remainingUsers[0]?.username || 'admin');
      await saveUserManagementSettings(newSettings);
      setSaveToast(`✓ User "${usernameToDelete}" deleted & synced to Cloud Firestore.`);
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  // Parse Bulk Import Input
  const handleBulkImport = async () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Please paste user credentials or upload a CSV file.');
      return;
    }

    const lines = importText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const newUsersList: AppUser[] = [];
    const newPermissionsDict = { ...settings.userPermissions };
    const colors = ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

    let addedCount = 0;
    const existingUsernames = new Set(settings.users.map(u => u.username.toLowerCase()));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip CSV header row if present
      if (i === 0 && (line.toLowerCase().startsWith('username,') || line.toLowerCase().startsWith('user,'))) {
        continue;
      }

      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) continue;

      const uName = parts[0].toLowerCase().replace(/\s+/g, '');
      const uPass = parts[1];
      const uDisplayName = parts[2] || parts[0];
      const uRoleRaw = (parts[3] || 'user').toLowerCase();
      const uRole: 'user' | 'admin' = uRoleRaw === 'admin' ? 'admin' : 'user';

      if (!uName || !uPass) continue;

      if (existingUsernames.has(uName)) {
        // Update password & name for existing user
        const existingIdx = settings.users.findIndex(u => u.username.toLowerCase() === uName);
        if (existingIdx !== -1) {
          settings.users[existingIdx].password = uPass;
          settings.users[existingIdx].displayName = uDisplayName;
          settings.users[existingIdx].role = uRole;
        }
      } else {
        existingUsernames.add(uName);
        const randomColor = colors[(settings.users.length + newUsersList.length) % colors.length];
        newUsersList.push({
          id: uName,
          username: uName,
          password: uPass,
          displayName: uDisplayName,
          role: uRole,
          avatarBg: randomColor,
          createdAt: new Date().toISOString().split('T')[0]
        });

        newPermissionsDict[uName] = {
          allowedNavTabs: uRole === 'admin' 
            ? NAV_TABS_META.map(t => t.id)
            : ['projectDashboard', 'leader', 'leaderboard', 'milestones', 'insights', 'vp', 'all', 'overview'],
          showSourceSheet: true,
          canSyncSheet: true,
          canExportReport: true,
          canEditConfig: uRole === 'admin',
          allowedVPs: ['all'],
          allowedLeaders: ['all'],
          allowedProjectCodes: ['all']
        };
        addedCount++;
      }
    }

    if (addedCount === 0 && newUsersList.length === 0) {
      setImportError('No valid new users found to import. Format: username,password,displayName,role');
      return;
    }

    const newSettings: UserManagementSettings = {
      users: [...settings.users, ...newUsersList],
      userPermissions: newPermissionsDict
    };

    onSaveSettings(newSettings);
    setShowImportModal(false);
    setImportText('');
    await saveUserManagementSettings(newSettings);
    setSaveToast(`✓ Successfully imported ${addedCount} user accounts & synced to Cloud Firestore!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sample = `username,password,displayName,role\njohn,pass123,John Doe,user\nrajesh_pm,planedge123,Rajesh Kumar,user\nsarah_j,secure456,Sarah Jenkins,admin`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'planedge_users_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered projects for search
  const filteredProjectItems = useMemo(() => {
    if (!projectSearch.trim()) return allProjectItems;
    const q = projectSearch.toLowerCase();
    return allProjectItems.filter(p => 
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.leader.toLowerCase().includes(q) ||
      p.vp.toLowerCase().includes(q)
    );
  }, [allProjectItems, projectSearch]);

  return (
    <div className="space-y-6 max-w-[1536px] mx-auto font-sans" id="user-management-center">
      
      {/* Top Banner Header - Uniform Light Grey Block */}
      <div className="bg-slate-100/80 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex items-center justify-between flex-wrap gap-4" id="user-management-center-banner">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-700 border border-purple-200 shadow-2xs shrink-0">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                User Management &amp; Access Control
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                Admin Center
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium max-w-2xl leading-relaxed">
              Create multiple user accounts, import bulk logins, and precisely control navigation tabs, VP portfolios, leader scoping, and project-level visibility.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Bulk Import Button */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
            id="import-users-btn"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Import Users (CSV)</span>
          </button>

          {/* Create User Button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            id="create-new-user-btn"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create User</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Grid: User List on Left (1 col), Permission Config on Right (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Users Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                User Accounts ({settings.users.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">Select to configure</span>
            </div>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {settings.users.map(u => {
                const isSelected = selectedUser.username.toLowerCase() === u.username.toLowerCase();
                const isItemAdmin = u.role === 'admin';
                const uPerms = settings.userPermissions[u.username.toLowerCase()];
                const enabledTabsCount = isItemAdmin ? NAV_TABS_META.length : (uPerms?.allowedNavTabs?.length || 0);

                return (
                  <div
                    key={u.id || u.username}
                    onClick={() => handleSelectUser(u)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-2xs"
                        style={{ backgroundColor: u.avatarBg || (isItemAdmin ? '#6366f1' : '#0284c7') }}
                      >
                        {u.username.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className={`text-xs font-extrabold truncate ${
                            isSelected ? 'text-blue-950' : 'text-slate-900'
                          }`}>
                            {u.displayName || u.username}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            isItemAdmin ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {isItemAdmin ? 'Admin' : 'User'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium mt-0.5">
                          <span>@{u.username}</span>
                          <span>•</span>
                          <span>{enabledTabsCount} tabs active</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {!isItemAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(u.username);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Granular Permission Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            
            {/* Selected User Overview Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-11 h-11 rounded-2xl text-white flex items-center justify-center font-bold text-base uppercase shadow-md shrink-0"
                  style={{ backgroundColor: selectedUser.avatarBg || (selectedUser.role === 'admin' ? '#6366f1' : '#0284c7') }}
                >
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedUser.displayName}
                    </h3>
                    <code className="text-xs font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      @{selectedUser.username}
                    </code>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {selectedUser.role === 'admin' ? 'Administrator' : 'Standard User'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize access rights, allowed navigation modules, and portfolio scoping below.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              {selectedUser.role !== 'admin' && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('full')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('executive')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Executive
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('restricted')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Restricted
                  </button>
                </div>
              )}
            </div>

            {/* Sub-tabs for Permissions Area */}
            <div className="flex border-b border-slate-200 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => setEditorTab('nav')}
                className={`pb-3 px-4 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  editorTab === 'nav'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. Navigation Titles ({localTabs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('scoping')}
                className={`pb-3 px-4 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  editorTab === 'scoping'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>2. VP, Leader &amp; Project Scoping</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('features')}
                className={`pb-3 px-4 border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  editorTab === 'features'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>3. Feature Permissions</span>
              </button>
            </div>

            {/* TAB 1: NAVIGATION TITLES */}
            {editorTab === 'nav' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Select which navigation tabs will appear in the Dropdown Menu for this user:
                  </span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setLocalTabs(NAV_TABS_META.map(t => t.id).filter(id => selectedUser.role === 'admin' ? true : id !== 'userAccess'))}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Enable All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {NAV_TABS_META.map(tab => {
                    const Icon = TAB_ICONS[tab.id];
                    const isSelected = localTabs.includes(tab.id);

                    return (
                      <label
                        key={tab.id}
                        className={`flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-blue-500 shadow-2xs ring-1 ring-blue-500/20'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300 opacity-60'
                        }`}
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <span className={`text-xs font-extrabold uppercase block truncate ${
                              isSelected ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              {tab.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {tab.category}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                              {tab.description}
                            </p>
                          </div>
                        </div>

                        <div className="ml-2 shrink-0 mt-0.5">
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
            )}

            {/* TAB 2: VP, LEADER & PROJECT SCOPING */}
            {editorTab === 'scoping' && (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
                
                {/* 1. VP Scoping */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        1. VP Portfolio Access ({localVPs.includes('all') ? 'All VPs' : `${localVPs.length} Selected`})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Restrict this user to specific VP portfolios, or grant access to All VPs.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocalVPs(['all'])}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                        localVPs.includes('all')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {localVPs.includes('all') ? '✓ All VPs Allowed' : 'Allow All VPs'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allVPs.map(vp => {
                      const isVpSelected = localVPs.includes('all') || localVPs.includes(vp);

                      return (
                        <button
                          type="button"
                          key={vp}
                          onClick={() => handleToggleVP(vp)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isVpSelected
                              ? 'bg-emerald-50/60 border-emerald-400 text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{vp}</span>
                          {isVpSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Leader Scoping */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        2. Project Leader Access ({localLeaders.includes('all') ? 'All Leaders' : `${localLeaders.length} Selected`})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Restrict this user to specific Project Leaders, or grant access to All Leaders.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocalLeaders(['all'])}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                        localLeaders.includes('all')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {localLeaders.includes('all') ? '✓ All Leaders Allowed' : 'Allow All Leaders'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allLeaders.map(leader => {
                      const isLeaderSelected = localLeaders.includes('all') || localLeaders.includes(leader);

                      return (
                        <button
                          type="button"
                          key={leader}
                          onClick={() => handleToggleLeader(leader)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isLeaderSelected
                              ? 'bg-emerald-50/60 border-emerald-400 text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{leader}</span>
                          {isLeaderSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Project-Level Scoping */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
                        3. Project-Level Access Control ({localProjects.includes('all') ? 'All Projects' : `${localProjects.length} Selected`})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Choose exactly which individual projects this user can view on the dashboard.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocalProjects(['all'])}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                        localProjects.includes('all')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {localProjects.includes('all') ? '✓ All Projects Allowed' : 'Allow All Projects'}
                    </button>
                  </div>

                  {/* Project Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search projects by Code, Name, Leader, or VP..."
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Projects List Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {filteredProjectItems.map(proj => {
                      const isProjSelected = localProjects.includes('all') || localProjects.includes(proj.code);

                      return (
                        <button
                          type="button"
                          key={proj.code}
                          onClick={() => handleToggleProject(proj.code)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start justify-between cursor-pointer ${
                            isProjSelected
                              ? 'bg-white border-blue-500 shadow-2xs text-slate-900 ring-1 ring-blue-500/20'
                              : 'bg-slate-100/70 border-slate-200 text-slate-500 hover:bg-white'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-blue-700 text-[11px] bg-blue-50 px-1.5 py-0.2 rounded">
                                {proj.code}
                              </span>
                              <span className="font-bold truncate text-xs text-slate-800">
                                {proj.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1 truncate">
                              <span>VP: {proj.vp || 'N/A'}</span>
                              <span>•</span>
                              <span>Leader: {proj.leader || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="shrink-0 mt-0.5">
                            {isProjSelected ? (
                              <Check className="w-4 h-4 text-blue-600" />
                            ) : (
                              <div className="w-4 h-4 rounded border border-slate-300" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: FEATURE & ACTION PERMISSIONS */}
            {editorTab === 'features' && (
              <div className="space-y-3">
                {/* 1. Source Sheet Link */}
                <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  localShowSourceSheet ? 'bg-white border-blue-500 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${localShowSourceSheet ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Show &quot;Source Sheet&quot; Link in Header</p>
                      <p className="text-[11px] text-slate-500">Allow user to open the linked Google Spreadsheet.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localShowSourceSheet}
                    onChange={(e) => setLocalShowSourceSheet(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                {/* 2. Live Sync Permission */}
                <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  localCanSync ? 'bg-white border-blue-500 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${localCanSync ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Allow Live Sheet Synchronization</p>
                      <p className="text-[11px] text-slate-500">User can click &quot;Sync Sheet&quot; to fetch live spreadsheet updates.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localCanSync}
                    onChange={(e) => setLocalCanSync(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                {/* 3. Export PDF Permission */}
                <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  localCanExport ? 'bg-white border-blue-500 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${localCanExport ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Allow MRM Presentation PDF Export</p>
                      <p className="text-[11px] text-slate-500">Enable generating multi-page executive review PDF presentations.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localCanExport}
                    onChange={(e) => setLocalCanExport(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                {/* 4. Configuration Editing */}
                <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  localCanEditConfig ? 'bg-white border-blue-500 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${localCanEditConfig ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Allow Editing Column Mappings &amp; Settings</p>
                      <p className="text-[11px] text-slate-500">Permit user to alter spreadsheet column indices and header rows.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localCanEditConfig}
                    onChange={(e) => setLocalCanEditConfig(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                {/* 5. Fiscal Year Selection Permission */}
                <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  localCanChangeFiscalYear ? 'bg-white border-blue-500 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${localCanChangeFiscalYear ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Allow Fiscal Year Selection</p>
                      <p className="text-[11px] text-slate-500">Permit user to switch the active reporting fiscal year range (e.g. FY 26-27, FY 27-28, etc.).</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localCanChangeFiscalYear}
                    onChange={(e) => setLocalCanChangeFiscalYear(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-400">
                Changes apply instantly for user <strong className="text-slate-800">{selectedUser.username}</strong>
              </span>

              <button
                type="button"
                onClick={handleSaveUserPermissions}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Permissions for @{selectedUser.username}</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* CREATE NEW USER MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New User Account</h3>
                  <p className="text-[11px] text-slate-500">Add credentials and role for dashboard access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. jdoe or leader_pune"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Assign user password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full / Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. John Doe (VP Infrastructure)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      newRole === 'user'
                        ? 'bg-sky-50 border-sky-400 text-sky-800 ring-1 ring-sky-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Standard User
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'bg-purple-50 border-purple-400 text-purple-800 ring-1 ring-purple-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT USERS MODAL DIALOG */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bulk Import User Logins</h3>
                  <p className="text-[11px] text-slate-500">Upload CSV or paste user credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{importError}</span>
              </div>
            )}

            {/* Instruction Format Box */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900">CSV Format:</span>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Download Sample CSV
                </button>
              </div>
              <code className="text-[11px] font-mono text-blue-800 block bg-white/80 p-1.5 rounded border border-blue-100">
                username,password,displayName,role
              </code>
            </div>

            {/* File Upload Option */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-white rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Choose .CSV File to Upload</span>
              </button>
            </div>

            {/* Textarea for Pasting Rows */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Or Paste Credentials (one per line):
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`john,pass123,John Doe,user\nrajesh_pm,planedge123,Rajesh Kumar,user\nsarah_j,secure456,Sarah Jenkins,admin`}
                rows={5}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import Users</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
