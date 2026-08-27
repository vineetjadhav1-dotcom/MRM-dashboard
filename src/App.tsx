import { useState, useEffect } from 'react';
import { useGoogleSheets } from '@/src/hooks/useGoogleSheets';
import Login from '@/src/components/Login';
import Header from '@/src/components/Header';
import Dashboard from '@/src/components/Dashboard';
import { logout } from '@/src/lib/firebase';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    projects,
    software2Projects,
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

  // Default to entering the dashboard immediately with full access
  const [hasEntered, setHasEntered] = useState<boolean>(true);

  // Set document title
  useEffect(() => {
    document.title = 'Planedge Dashboard';
  }, []);

  // If already authenticated on load, let them enter the dashboard automatically
  useEffect(() => {
    if (isAuthenticated) {
      setHasEntered(true);
      // Automatically fetch spreadsheet data once authenticated
      fetchSpreadsheetData();
    }
  }, [isAuthenticated, fetchSpreadsheetData]);

  const handleLoginSuccess = (token: string) => {
    setHasEntered(true);
    fetchSpreadsheetData(token);
  };

  const handleCustomDataLoaded = (rows: string[][], rows2?: string[][]) => {
    loadCustomData(rows, rows2);
    setHasEntered(true);
  };

  const handleViewDemo = () => {
    toggleUseDemo(true);
    setHasEntered(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setHasEntered(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleRefresh = () => {
    fetchSpreadsheetData();
  };

  const handleToggleDemoSetting = (useDemo: boolean) => {
    toggleUseDemo(useDemo);
  };

  // Render Login screen if user has not entered the dashboard yet
  if (!hasEntered) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onViewDemo={handleViewDemo} 
        onLoadData={handleCustomDataLoaded}
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

      {/* Corporate Dashboard Header */}
      <Header
        user={user}
        isUsingDemo={isUsingDemo}
        isLoading={isLoading}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        onToggleDemo={handleToggleDemoSetting}
        projectsCount={projects.length}
        projects={projects}
        software2Projects={software2Projects}
        onLoadCustomData={handleCustomDataLoaded}
        onOpenLogin={() => setHasEntered(false)}
      />

      {/* Main Dashboard Canvas */}
      <main className="flex-1" id="main-content-area">
        <Dashboard
          projects={projects}
          software2Projects={software2Projects}
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
        />
      </main>

      {/* Footnote */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-[10px] font-medium text-slate-400 mt-12">
        <p>Monthly Review Meeting Dashboard • Secure Sandbox Environment</p>
      </footer>
    </div>
  );
}
