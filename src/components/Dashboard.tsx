import { useState, useMemo } from 'react';
import { 
  Project, 
  ColumnMapping, 
  Software2Project, 
  Software2Mapping, 
  ActiveTab, 
  AppUser, 
  UserManagementSettings 
} from '@/src/types';
import { 
  computeDashboardMetrics, 
  groupProjectsByVP, 
  groupProjectsByLeader, 
  groupProjectsByArea 
} from '@/src/utils/sheetParser';
import DashboardMetricsCards from './DashboardMetricsCards';
import ColumnMapper from './ColumnMapper';
import VPList from './VPList';
import LeaderList from './LeaderList';
import ProjectListTable from './ProjectListTable';
import ProjectDetailsModal from './ProjectDetailsModal';
import ProjectDashboard from './ProjectDashboard';
import Leaderboard from './Leaderboard';
import KeyInsights from './KeyInsights';
import UserManagementView from './UserManagementView';
import { Info } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  software2Projects: Software2Project[];
  allProjects?: Project[];
  allSoftware2Projects?: Software2Project[];
  isUsingDemo: boolean;
  isLoading: boolean;
  error: string | null;
  sheetRows: string[][];
  software2SheetRows: string[][];
  headerRowIndex: number;
  software2HeaderRowIndex: number;
  mapping: ColumnMapping;
  software2Mapping: Software2Mapping;
  onUpdateMapping: (newMapping: ColumnMapping, newHeaderIdx: number) => void;
  onUpdateSoftware2Mapping: (newMapping: Software2Mapping, newHeaderIdx: number) => void;
  onToggleDemo: (useDemo: boolean) => void;
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  userSettings?: UserManagementSettings;
  onSaveUserSettings?: (newSettings: UserManagementSettings) => void;
  currentUser?: AppUser | null;
}

export default function Dashboard({
  projects,
  software2Projects,
  allProjects = [],
  allSoftware2Projects = [],
  isUsingDemo,
  isLoading,
  error,
  sheetRows,
  software2SheetRows,
  headerRowIndex,
  software2HeaderRowIndex,
  mapping,
  software2Mapping,
  onUpdateMapping,
  onUpdateSoftware2Mapping,
  onToggleDemo,
  activeTab = 'projectDashboard',
  onSelectTab,
  userSettings,
  onSaveUserSettings,
  currentUser = null
}: DashboardProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Compute all grouped data (using filtered projects)
  const metrics = useMemo(() => computeDashboardMetrics(projects), [projects]);
  const vpData = useMemo(() => groupProjectsByVP(projects), [projects]);
  const leaderData = useMemo(() => groupProjectsByLeader(projects), [projects]);
  const areaData = useMemo(() => groupProjectsByArea(projects), [projects]);

  return (
    <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 font-sans space-y-4" id="dashboard-main-container">
      {/* Alert Banner for errors */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-800" id="dashboard-error-banner">
          <div className="flex items-start space-x-3">
            <Info className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-rose-900">Database Access Issue</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
              <p className="mt-2 text-slate-500">
                You are currently viewing <span className="font-semibold text-slate-700">Sample Mockup Data</span> below so you can see how the meeting report works. Make sure to log in with an authorized account or check your spreadsheet sharing settings to enable Live synchronization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Main Content Area */}
      <div className="w-full min-w-0" id="dashboard-main-content-area">
        <div className="min-h-[500px]" id="dashboard-tab-panel">
        
          {/* DATA CONFIGURATION TAB */}
          {activeTab === 'overview' && (
            <div className="w-full" id="data-configuration-panel">
              <ColumnMapper
                sheetRows={sheetRows}
                headerRowIndex={headerRowIndex}
                mapping={mapping}
                onUpdateMapping={onUpdateMapping}
                software2SheetRows={software2SheetRows}
                software2HeaderRowIndex={software2HeaderRowIndex}
                software2Mapping={software2Mapping}
                onUpdateSoftware2Mapping={onUpdateSoftware2Mapping}
                isUsingDemo={isUsingDemo}
              />
            </div>
          )}

          {/* USER ACCESS & MANAGEMENT TAB (ADMIN ONLY) */}
          {activeTab === 'userAccess' && userSettings && onSaveUserSettings && (
            <div className="w-full" id="user-access-panel">
              <UserManagementView
                settings={userSettings}
                onSaveSettings={onSaveUserSettings}
                projects={allProjects.length > 0 ? allProjects : projects}
                software2Projects={allSoftware2Projects.length > 0 ? allSoftware2Projects : software2Projects}
                currentUser={currentUser}
              />
            </div>
          )}

          {/* EXECUTIVE BENCHMARKING LEADERBOARD VIEW */}
          {activeTab === 'leaderboard' && (
            <Leaderboard 
              projects={projects} 
              software2Projects={software2Projects} 
              vpData={vpData} 
              leaderData={leaderData} 
              onSelectProject={setSelectedProject} 
            />
          )}

          {/* KEY INSIGHTS & FORECAST VIEW (3-LAYER FILTER & MULTI-PARAM FORECAST) */}
          {activeTab === 'insights' && (
            <KeyInsights 
              projects={software2Projects} 
              allProjects={projects} 
              onSelectProject={setSelectedProject} 
            />
          )}

          {/* PROJECT DASHBOARD (SOFTWARE2) VIEW */}
          {activeTab === 'projectDashboard' && (
            <ProjectDashboard 
              projects={software2Projects} 
              allProjects={projects}
              sheetRows={software2SheetRows}
              headerRowIndex={software2HeaderRowIndex}
              mapping={software2Mapping}
              onUpdateMapping={onUpdateSoftware2Mapping}
              isUsingDemo={isUsingDemo}
            />
          )}

          {/* VP PORTFOLIO VIEW */}
          {activeTab === 'vp' && (
            <VPList vpDataList={vpData} onProjectSelect={setSelectedProject} />
          )}

          {/* LEADER PERFORMANCE VIEW */}
          {activeTab === 'leader' && (
            <LeaderList leaderDataList={leaderData} software2Projects={software2Projects} onProjectSelect={setSelectedProject} />
          )}

          {/* ALL PROJECTS TABLE VIEW */}
          {activeTab === 'all' && (
            <ProjectListTable projects={projects} onProjectSelect={setSelectedProject} />
          )}
        </div>
      </div>

      {/* Project detailed view modal drawer */}
      <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
