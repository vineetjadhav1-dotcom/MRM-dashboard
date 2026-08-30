import { useState, useEffect, useMemo } from 'react';
import { useGoogleSheets } from '@/src/hooks/useGoogleSheets';
import Login from '@/src/components/Login';
import Header from '@/src/components/Header';
import Dashboard from '@/src/components/Dashboard';
import { RefreshCw } from 'lucide-react';
import { ActiveTab, AppUser, UserManagementSettings } from '@/src/types';
import { 
  getStoredUser, 
  setStoredUser, 
  getUserManagementSettings, 
  getUserEffectivePermissions,
  filterProjectsByPermissions,
  filterSoftware2ProjectsByPermissions
} from '@/src/utils/userManagement';

export default function App() {
  const {
    isLoading,
    error,
    projects,
    software2Projects,
    software3Milestones,
    isUsingDemo,
    sheetRows,
    software2SheetRows,
    headerRowIndex,
    software2HeaderRowIndex,
    mapping,
    software2Mapping,
    fetchSpreadsheetData,
    loadCustomData,
    updateMappingAndParse,
    updateSoftware2MappingAndParse,
    toggleUseDemo
  } = useGoogleSheets();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getStoredUser);
  const [userSettings, setUserSettings] = useState<UserManagementSettings>(getUserManagementSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('projectDashboard');

  // Compute effective permissions for the logged in user
  const permissions = useMemo(() => {
    return getUserEffectivePermissions(currentUser, userSettings);
  }, [currentUser, userSettings]);

  // Filter projects by user permissions (VP, Leader, Project Code scoping)
  const filteredProjects = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return projects;
    return filterProjectsByPermissions(projects, permissions);
  }, [projects, permissions, currentUser]);

  const filteredSoftware2Projects = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return software2Projects;
    return filterSoftware2ProjectsByPermissions(software2Projects, permissions);
  }, [software2Projects, permissions, currentUser]);

  // Set document title
  useEffect(() => {
    document.title = 'Planedge Executive Dashboard Portal';
  }, []);

  // Ensure activeTab is always one of the permitted tabs for standard users
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      if (!permissions.allowedNavTabs.includes(activeTab)) {
        setActiveTab(permissions.allowedNavTabs[0] || 'projectDashboard');
      }
    }
  }, [permissions, activeTab, currentUser]);

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setStoredUser(user);
    fetchSpreadsheetData();
  };

  const handleLogout = () => {
    setStoredUser(null);
    setCurrentUser(null);
  };

  const handleRefresh = () => {
    fetchSpreadsheetData();
  };

  const handleToggleDemoSetting = (useDemo: boolean) => {
    toggleUseDemo(useDemo);
  };

  const handleSaveUserSettings = (newSettings: UserManagementSettings) => {
    setUserSettings(newSettings);
  };

  // Render Login screen if user is not authenticated
  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-root-layout">
      {/* Dynamic Sync / Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2px] z-50 flex items-center justify-center transition-all" id="app-loader-overlay">
          <div className="bg-white px-6 py-5 rounded-2xl shadow-xl border border-slate-100 flex items-center space-x-4">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-xs font-bold text-slate-800">Synchronizing Live Spreadsheet...</span>
          </div>
        </div>
      )}

      {/* Corporate Dashboard Header with Dropdown Navigation Menu */}
      <Header
        currentUser={currentUser}
        permissions={permissions}
        isUsingDemo={isUsingDemo}
        isLoading={isLoading}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        onToggleDemo={handleToggleDemoSetting}
        projectsCount={filteredProjects.length}
        projects={filteredProjects}
        software2Projects={filteredSoftware2Projects}
        onLoadCustomData={loadCustomData}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Dashboard Canvas */}
      <main className="flex-1" id="main-content-area">
        <Dashboard
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          projects={filteredProjects}
          software2Projects={filteredSoftware2Projects}
          allProjects={projects}
          allSoftware2Projects={software2Projects}
          isUsingDemo={isUsingDemo}
          isLoading={isLoading}
          error={error}
          sheetRows={sheetRows}
          software2SheetRows={software2SheetRows}
          headerRowIndex={headerRowIndex}
          software2HeaderRowIndex={software2HeaderRowIndex}
          mapping={mapping}
          software2Mapping={software2Mapping}
          onUpdateMapping={updateMappingAndParse}
          onUpdateSoftware2Mapping={updateSoftware2MappingAndParse}
          onToggleDemo={handleToggleDemoSetting}
          userSettings={userSettings}
          onSaveUserSettings={handleSaveUserSettings}
          currentUser={currentUser}
          software3Milestones={software3Milestones}
          onRefresh={handleRefresh}
        />
      </main>

      {/* Footnote */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-[10px] font-medium text-slate-400 mt-12">
        <p>Monthly Review Meeting Dashboard • Planedge Corporate Portal</p>
      </footer>
    </div>
  );
}
