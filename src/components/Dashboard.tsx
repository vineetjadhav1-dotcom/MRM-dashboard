import { useState, useMemo } from 'react';
import { Project, ColumnMapping, Software2Project, Software2Mapping } from '@/src/types';
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
import AreaList from './AreaList';
import ProjectListTable from './ProjectListTable';
import ProjectDetailsModal from './ProjectDetailsModal';
import PlanVsAchDashboard from './PlanVsAchDashboard';
import ProjectDashboard from './ProjectDashboard';
import Leaderboard from './Leaderboard';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  TableProperties, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Building2,
  Database,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Info,
  AlertTriangle,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
  SlidersHorizontal,
  Trophy
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  software2Projects: Software2Project[];
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
}

type ActiveTab = 'overview' | 'vp' | 'leader' | 'area' | 'all' | 'planVsAch' | 'projectDashboard' | 'configuration' | 'leaderboard';

export default function Dashboard({
  projects,
  software2Projects,
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
  onToggleDemo
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('projectDashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Sidebar collapsible state: default narrow strip, expands on hover or toggle
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const isSidebarExpanded = isSidebarPinned || isSidebarHovered;

  // Compute all grouped data
  const metrics = useMemo(() => computeDashboardMetrics(projects), [projects]);
  const vpData = useMemo(() => groupProjectsByVP(projects), [projects]);
  const leaderData = useMemo(() => groupProjectsByLeader(projects), [projects]);
  const areaData = useMemo(() => groupProjectsByArea(projects), [projects]);

  // Transform status counts for Recharts Pie Chart
  const pieChartData = useMemo(() => {
    return [
      { name: 'Green (On Track)', value: metrics.statusCounts['Green'] || 0, color: '#10b981' },
      { name: 'Amber (At Risk)', value: metrics.statusCounts['Amber'] || 0, color: '#f59e0b' },
      { name: 'Red (Critical)', value: metrics.statusCounts['Red'] || 0, color: '#f43f5e' },
      { name: 'Gray (Other)', value: metrics.statusCounts['Gray'] || 0, color: '#94a3b8' }
    ].filter(d => d.value > 0);
  }, [metrics]);

  // Transform area data for Recharts Bar Chart (Top 6 areas by count)
  const barChartData = useMemo(() => {
    return areaData
      .slice(0, 6)
      .map(area => ({
        name: area.name.length > 15 ? `${area.name.substring(0, 12)}...` : area.name,
        'Project Count': area.projectsCount,
        'Green Projects': area.statusCounts['Green'] || 0
      }));
  }, [areaData]);

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'projectDashboard', label: 'Project Dashboard', icon: Sparkles },
    { id: 'leader', label: 'MRM Dashboard', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'overview', label: 'Data Configuration', icon: SlidersHorizontal },
    { id: 'planVsAch', label: 'Plan vs Achievement', icon: TrendingUp },
    { id: 'vp', label: 'VP Portfolios', icon: Users },
    { id: 'area', label: 'Strategic Areas', icon: Layers },
    { id: 'all', label: 'Projects Registry', icon: TableProperties }
  ];

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans" id="dashboard-main-container">
      {/* Alert Banner for errors */}
      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-800" id="dashboard-error-banner">
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

      {/* Layout Container with Compact Collapsible Left Sidebar Navigation */}
      <div className="flex flex-col lg:flex-row gap-5 items-start relative" id="dashboard-vertical-layout">
        
        {/* Compact Collapsible Sidebar Wrapper */}
        <div 
          className="w-full lg:w-14 shrink-0 sticky top-20 z-40"
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          id="dashboard-left-sidebar-wrapper"
        >
          <div 
            className={`bg-white border border-slate-200 rounded-2xl transition-all duration-300 ease-in-out ${
              isSidebarExpanded 
                ? 'w-full lg:w-60 p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/50 lg:absolute lg:left-0 lg:top-0' 
                : 'w-full lg:w-14 p-2 shadow-sm'
            }`}
            id="dashboard-left-sidebar-card"
          >
            {/* Header / Toggle controls */}
            <div className={`flex items-center border-b border-slate-100 pb-2 mb-2 ${isSidebarExpanded ? 'justify-end px-1' : 'justify-center'}`}>
              {isSidebarExpanded ? (
                <button
                  onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                  title={isSidebarPinned ? 'Unpin Sidebar' : 'Pin Sidebar Expanded'}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isSidebarPinned ? <PanelLeftClose className="w-4 h-4 text-blue-600" /> : <PanelLeftOpen className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  onClick={() => setIsSidebarPinned(true)}
                  title="Expand Navigation Menu"
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Menu className="w-5 h-5 text-indigo-600" />
                </button>
              )}
            </div>

            {/* Navigation Buttons List */}
            <nav className="space-y-1" id="dashboard-vertical-nav-menu">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.label}
                    className={`w-full flex items-center rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSidebarExpanded ? 'px-3 py-2 space-x-2.5' : 'p-2 justify-center'
                    } ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {isSidebarExpanded && (
                      <>
                        <span className="flex-1 truncate text-xs font-bold">{tab.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Primary Right Main Content Panel */}
        <div className="flex-1 w-full min-w-0 space-y-8" id="dashboard-main-content-area">
          <div className="min-h-[500px]" id="dashboard-tab-panel">
        
        {/* DATA CONFIGURATION TAB (ONLY CONFIGURATION) */}
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

        {/* PLAN VS ACHIEVEMENT DASHBOARD VIEW */}
        {activeTab === 'planVsAch' && (
          <PlanVsAchDashboard projects={projects} onProjectSelect={setSelectedProject} />
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

        {/* STRATEGIC AREA VIEW */}
        {activeTab === 'area' && (
          <AreaList areaDataList={areaData} onProjectSelect={setSelectedProject} />
        )}

        {/* ALL PROJECTS TABLE VIEW */}
        {activeTab === 'all' && (
          <ProjectListTable projects={projects} onProjectSelect={setSelectedProject} />
        )}
      </div>
      </div>
      </div>

      {/* Project detailed view modal drawer */}
      <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
