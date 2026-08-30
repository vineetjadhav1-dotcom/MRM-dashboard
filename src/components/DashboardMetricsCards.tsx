import { DashboardMetrics } from '@/src/types';
import { formatBudgetDisplay } from '@/src/utils/sheetParser';
import { 
  FolderGit2, 
  Users, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Building,
  Briefcase,
  HardHat
} from 'lucide-react';

interface DashboardMetricsCardsProps {
  metrics: DashboardMetrics;
}

export default function DashboardMetricsCards({ metrics }: DashboardMetricsCardsProps) {
  const { 
    totalProjects, 
    totalVPs, 
    totalLeaders, 
    totalAreas, 
    statusCounts,
    totalAreaSqft = 0,
    totalAreaUnderConstruction = 0,
    totalBudgetUnderManagement = 0,
    totalBudgetUnderConstruction = 0,
    projectsUnderConstructionCount = 0
  } = metrics;

  const greenCount = statusCounts['Green'] || 0;
  const amberCount = statusCounts['Amber'] || 0;
  const redCount = statusCounts['Red'] || 0;
  const grayCount = statusCounts['Gray'] || 0;

  const greenPct = totalProjects > 0 ? Math.round((greenCount / totalProjects) * 100) : 0;
  const amberPct = totalProjects > 0 ? Math.round((amberCount / totalProjects) * 100) : 0;
  const redPct = totalProjects > 0 ? Math.round((redCount / totalProjects) * 100) : 0;
  const grayPct = totalProjects > 0 ? Math.round((grayCount / totalProjects) * 100) : 0;

  return (
    <div className="space-y-6 font-sans" id="metrics-dashboard-box">
      {/* 2 Primary Executive Showcase Cards: Under Management vs Under Construction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="executive-summary-panels">
        {/* 1. Under Management Panel */}
        <div className="bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">1. Under Management</h4>
                <p className="text-[10px] text-slate-400">Total portfolio active scope</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-extrabold">
              All Stages
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">No. of Projects</span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">{totalProjects}</span>
              <span className="text-[9px] text-slate-400">Total portfolio</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Area</span>
              <span className="text-base sm:text-lg font-black text-indigo-700 block mt-0.5 truncate">
                {totalAreaSqft > 0 ? totalAreaSqft.toLocaleString() : '0'}{' '}
                <span className="text-[10px] font-bold text-slate-500">Sqft</span>
              </span>
              <span className="text-[9px] text-slate-400">Mapped spatial</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Budget</span>
              <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5 truncate">
                {totalBudgetUnderManagement > 0 ? formatBudgetDisplay(totalBudgetUnderManagement) : 'N/A'}
              </span>
              <span className="text-[9px] text-slate-400">Portfolio budget</span>
            </div>
          </div>
        </div>

        {/* 2. Under Construction Panel */}
        <div className="bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 border border-emerald-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100/70 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                <HardHat className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">2. Under Construction</h4>
                <p className="text-[10px] text-emerald-600 font-medium">Start • Ongoing • Finishing • Nearing Comp</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full text-[10px] font-extrabold">
              Active Sites
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">No. of Projects</span>
              <span className="text-2xl font-black text-emerald-800 block mt-0.5">{projectsUnderConstructionCount}</span>
              <span className="text-[9px] text-emerald-600/80">In construction</span>
            </div>

            <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Const. Area</span>
              <span className="text-base sm:text-lg font-black text-emerald-700 block mt-0.5 truncate">
                {totalAreaUnderConstruction > 0 ? totalAreaUnderConstruction.toLocaleString() : '0'}{' '}
                <span className="text-[10px] font-bold text-emerald-600/70">Sqft</span>
              </span>
              <span className="text-[9px] text-slate-400">Active site area</span>
            </div>

            <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Const. Budget</span>
              <span className="text-base sm:text-lg font-black text-emerald-800 block mt-0.5 truncate">
                {totalBudgetUnderConstruction > 0 ? formatBudgetDisplay(totalBudgetUnderConstruction) : '₹ 0 Cr.'}
              </span>
              <span className="text-[9px] text-slate-400">Construction budget</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leadership & Vertical Coverage Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reporting VPs</span>
            <span className="text-2xl font-extrabold text-slate-900 block mt-1">{totalVPs}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Executive sponsors</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Leaders</span>
            <span className="text-2xl font-extrabold text-slate-900 block mt-1">{totalLeaders}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Active operational leads</p>
          </div>
          <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strategic Verticals</span>
            <span className="text-2xl font-extrabold text-slate-900 block mt-1">{totalAreas}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Unique focus domains</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* RAG Health Status Rollup Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="rag-rollup-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center">
              <Activity className="w-4 h-4 mr-1.5 text-slate-500" />
              Overall Project RAG Health Index
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Aggregate delivery metrics for this monthly cycle</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Green: {greenCount} ({greenPct}%)
            </span>
            <span className="flex items-center text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Amber: {amberCount} ({amberPct}%)
            </span>
            <span className="flex items-center text-rose-600">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Red: {redCount} ({redPct}%)
            </span>
            {grayCount > 0 && (
              <span className="flex items-center text-slate-500">
                <HelpCircle className="w-3.5 h-3.5 mr-1" /> Other: {grayCount} ({grayPct}%)
              </span>
            )}
          </div>
        </div>

        {/* Visual Percent Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex" id="rag-percent-bar">
          {greenCount > 0 && (
            <div 
              style={{ width: `${greenPct}%` }} 
              className="bg-emerald-500 h-full transition-all" 
              title={`Green: ${greenPct}%`} 
            />
          )}
          {amberCount > 0 && (
            <div 
              style={{ width: `${amberPct}%` }} 
              className="bg-amber-400 h-full transition-all" 
              title={`Amber: ${amberPct}%`} 
            />
          )}
          {redCount > 0 && (
            <div 
              style={{ width: `${redPct}%` }} 
              className="bg-rose-500 h-full transition-all" 
              title={`Red: ${redPct}%`} 
            />
          )}
          {grayCount > 0 && (
            <div 
              style={{ width: `${grayPct}%` }} 
              className="bg-slate-400 h-full transition-all" 
              title={`Other: ${grayPct}%`} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
