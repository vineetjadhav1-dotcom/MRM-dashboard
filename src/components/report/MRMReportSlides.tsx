import React from 'react';
import { Project, Software2Project } from '@/src/types';
import PlanedgePdfLogo from './PlanedgePdfLogo';
import { getFiscalYearConfig, getStoredFiscalYear } from '@/src/utils/fiscalYear';
import { formatDateToDdMmmYy } from '@/src/utils/sheetParser';
import { 
  Building, 
  Briefcase, 
  TrendingUp, 
  Gauge, 
  Calendar, 
  ShieldCheck, 
  Search,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  Users,
  ShieldAlert,
  Zap,
  Home
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LabelList 
} from 'recharts';

export interface LeaderStats {
  totalArea: number;
  areaUnderConstruction: number;
  totalBudgetUnderManagement?: number;
  totalBudgetUnderConstruction?: number;
  projectsUnderConstructionCount?: number;
  activeProjectsCount?: number;
  avgSpi: number | null;
  milestones: { plan: number; ach: number; pct: number; fr: number };
  vowd: { plan: number; ach: number; pct: number; fr: number };
  labour: { plan: number; ach: number; pct: number; fr: number };
  stageCounts: {
    upcoming: number;
    design: number;
    excavation: number;
    constructionStart: number;
    ongoing: number;
    finishing: number;
    nearingCompletion: number;
    handover: number;
    hold: number;
  };
  leaderQualityRating: number | null;
  leaderSafetyRating: number | null;
  leaderAvgQhseRating: number | null;
  speedOfConstruction: number;
  labourProductivity: number;
  labourEfficiency: number;
  onTrackCount: number;
  upcomingProjectNames: string[];
  designProjectNames: string[];
  excavationProjectNames: string[];
  constructionStartProjectNames: string[];
  ongoingProjectNames: string[];
  finishingProjectNames: string[];
  nearingCompletionProjectNames: string[];
  handoverProjectNames: string[];
  holdProjectNames: string[];
}

export interface ProgressCurveMonthData {
  month: string;
  Plan: number;
  PlanR0: number;
  PlanR1: number;
  Achievement: number | null;
  'Achievement %': number | null;
  CumPlanR0: number;
  CumPlanR1: number;
  CumPlan: number;
  CumAchievement: number | null;
  'CumAchievement %': number | null;
}

// Helpers
const formatDaysUnit = (val: string | undefined | null): string => {
  if (!val) return '0 Days';
  const clean = val.trim();
  if (clean.toLowerCase().includes('day')) return clean;
  if (!isNaN(parseFloat(clean))) return `${clean} Days`;
  return clean;
};

const formatValue = (val: number, isCurrency: boolean) => {
  if (isCurrency) {
    const formatted = val % 1 === 0 ? val.toLocaleString() : val.toFixed(2);
    return `₹ ${formatted} Cr.`;
  }
  return Math.round(val).toLocaleString();
};

const getPercent = (pct: string | undefined, plan: string | undefined, ach: string | undefined): string => {
  if (pct && pct.trim()) {
    const clean = pct.trim();
    if (clean.endsWith('%')) return clean;
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) {
      if (parsed <= 1.0 && parsed > 0) return `${Math.round(parsed * 100)}%`;
      return `${Math.round(parsed)}%`;
    }
    return clean;
  }
  const pVal = parseFloat((plan || '').replace(/[$,%\s]/g, '')) || 0;
  const aVal = parseFloat((ach || '').replace(/[$,%\s]/g, '')) || 0;
  if (pVal > 0) return `${Math.round((aVal / pVal) * 100)}%`;
  return '0%';
};

const METRIC_CONFIGS: Record<string, { label: string; shortLabel: string; isCurrency: boolean; unit: string; colorPlan: string; colorAch: string }> = {
  vowd: { label: 'VOWD', shortLabel: 'VOWD', isCurrency: true, unit: '₹ Cr.', colorPlan: '#818cf8', colorAch: '#4f46e5' },
  milestone: { label: 'Milestones', shortLabel: 'Milestones', isCurrency: false, unit: 'Nos.', colorPlan: '#38bdf8', colorAch: '#0284c7' },
  labour: { label: 'Labour', shortLabel: 'Labour', isCurrency: false, unit: 'Labours', colorPlan: '#c084fc', colorAch: '#7e22ce' },
  ur: { label: 'Unit Delivery - Residential', shortLabel: 'Unit Delivery - Residential', isCurrency: false, unit: 'Units', colorPlan: '#fb923c', colorAch: '#c2410c' },
  uc: { label: 'Unit Delivery - Commercial', shortLabel: 'Unit Delivery - Commercial', isCurrency: false, unit: 'Sqft', colorPlan: '#fcd34d', colorAch: '#b45309' }
};

/* -------------------------------------------------------------
 * 1. COVER SLIDE COMPONENT
 * ------------------------------------------------------------- */
export function CoverSlide({
  title,
  completedMonth,
  teamName = 'Team KM'
}: {
  title?: string;
  completedMonth?: string;
  teamName: string;
}) {
  // Derive previous completed month (e.g. July 26 if active is Aug 26)
  const monthText = React.useMemo(() => {
    if (completedMonth) return completedMonth;
    if (title && title.includes(' - ')) {
      const parts = title.split(' - ');
      if (parts[1]) return parts[1].trim();
    }
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = lastMonthDate.toLocaleString('en-US', { month: 'long' });
    const year2Digit = lastMonthDate.getFullYear().toString().slice(-2);
    return `${monthName} ${year2Digit}`;
  }, [completedMonth, title]);

  return (
    <div 
      className="report-slide relative flex flex-col justify-between p-12 overflow-hidden select-none font-sans" 
      style={{ width: '1122px', height: '794px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
        {/* Line 1: Planedge Monthly Review Meeting (MRM) on single line */}
        <h1 
          className="text-3xl sm:text-4xl font-extrabold tracking-tight whitespace-nowrap text-center" 
          style={{ color: '#0f172a', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}
        >
          Planedge Monthly Review Meeting (MRM)
        </h1>

        {/* Line 2: Previously completed month (e.g. July 26) */}
        <div 
          className="inline-flex items-center px-6 py-2 rounded-full border shadow-2xs"
          style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}
        >
          <span className="text-xl font-extrabold tracking-wide" style={{ color: '#4338ca' }}>
            {monthText}
          </span>
        </div>

        {/* Team Name */}
        <h2 className="text-3xl font-black tracking-tight pt-4" style={{ color: '#0f172a' }}>
          {teamName}
        </h2>
      </div>

      <div className="flex justify-end items-end">
        <PlanedgePdfLogo className="scale-125 origin-bottom-right" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 2. SUMMARY SLIDE COMPONENT (VP OR LEADER)
 * ------------------------------------------------------------- */
export function SummarySlide({
  title,
  subtitle,
  projectsCount,
  onTrackCount,
  stats
}: {
  title: string;
  subtitle: string;
  projectsCount: number;
  onTrackCount: number;
  stats: LeaderStats;
}) {
  return (
    <div 
      className="report-slide relative flex flex-col justify-between p-7 overflow-hidden select-none font-sans" 
      style={{ width: '1122px', height: '794px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      <div className="space-y-3 flex-1">
        {/* Header Dark Bar */}
        <div 
          className="rounded-2xl px-5 py-3 flex items-center justify-between shadow-xs"
          style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
        >
          <div>
            <h3 className="text-base font-black tracking-tight" style={{ color: '#ffffff' }}>{title}</h3>
            <p className="text-[10px] mt-0.5" style={{ color: '#cbd5e1' }}>{subtitle}</p>
          </div>
          <div 
            className="rounded-xl px-3 py-1.5 text-right border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <span className="text-[8px] font-bold uppercase tracking-widest block" style={{ color: '#a5b4fc' }}>Health Standing</span>
            <span className="text-xs font-black" style={{ color: '#ffffff' }}>{onTrackCount} / {projectsCount} On Track</span>
          </div>
        </div>

        {/* Primary KPI Highlights: 1. Under Management vs 2. Under Construction */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Under Management */}
          <div 
            className="rounded-2xl p-3.5 space-y-2 border"
            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#0f172a' }}>1. Under Management</span>
              </div>
              <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#eef2ff', color: '#4338ca' }}>
                All Stages
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-2 bg-white border" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-[8px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Projects</span>
                <span className="text-sm font-black block mt-0.5" style={{ color: '#0f172a' }}>{projectsCount}</span>
              </div>
              <div className="rounded-xl p-2 bg-white border" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-[8px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Total Area</span>
                <span className="text-sm font-black block mt-0.5 truncate" style={{ color: '#4338ca' }}>
                  {stats.totalArea > 0 ? stats.totalArea.toLocaleString() : '0'} <span className="text-[8px] font-bold" style={{ color: '#64748b' }}>Sqft</span>
                </span>
              </div>
              <div className="rounded-xl p-2 bg-white border" style={{ borderColor: '#e2e8f0' }}>
                <span className="text-[8px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Total Budget</span>
                <span className="text-sm font-black block mt-0.5 truncate" style={{ color: '#0f172a' }}>
                  {stats.totalBudgetUnderManagement && stats.totalBudgetUnderManagement > 0 ? formatValue(stats.totalBudgetUnderManagement, true) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Under Construction */}
          <div 
            className="rounded-2xl p-3.5 space-y-2 border"
            style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
          >
            <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: '#dcfce7' }}>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                  <Building className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#064e3b' }}>2. Under Construction</span>
              </div>
              <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                Start • Ongoing • Finishing • Near Comp
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-2 bg-white border" style={{ borderColor: '#bbf7d0' }}>
                <span className="text-[8px] font-black uppercase tracking-wider block" style={{ color: '#059669' }}>Projects</span>
                <span className="text-sm font-black block mt-0.5" style={{ color: '#064e3b' }}>{stats.projectsUnderConstructionCount || 0}</span>
              </div>
              <div className="rounded-xl p-2 bg-white border" style={{ borderColor: '#bbf7d0' }}>
                <span className="text-[8px] font-black uppercase tracking-wider block" style={{ color: '#059669' }}>Const. Area</span>
                <span className="text-sm font-black block mt-0.5 truncate" style={{ color: '#047857' }}>
                  {stats.areaUnderConstruction > 0 ? stats.areaUnderConstruction.toLocaleString() : '0'} <span className="text-[8px] font-bold" style={{ color: '#059669' }}>Sqft</span>
                </span>
              </div>
              <div className="rounded-xl p-2 bg-white border" style={{ borderColor: '#bbf7d0' }}>
                <span className="text-[8px] font-black uppercase tracking-wider block" style={{ color: '#059669' }}>Const. Budget</span>
                <span className="text-sm font-black block mt-0.5 truncate" style={{ color: '#064e3b' }}>
                  {stats.totalBudgetUnderConstruction && stats.totalBudgetUnderConstruction > 0 ? formatValue(stats.totalBudgetUnderConstruction, true) : '₹ 0 Cr.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage-wise Project Distribution (9 Stages) */}
        <div 
          className="rounded-2xl p-3 space-y-2 border"
          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: '#1e293b' }}>Stage-wise Project Distribution</span>
          <div className="grid grid-cols-9 gap-2">
            {[
              { label: 'Upcoming', count: stats.stageCounts.upcoming, bg: '#f8fafc', border: '#e2e8f0', color: '#334155' },
              { label: 'Design', count: stats.stageCounts.design, bg: '#eef2ff', border: '#c7d2fe', color: '#4338ca' },
              { label: 'Excavation', count: stats.stageCounts.excavation, bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
              { label: 'Start', count: stats.stageCounts.constructionStart, bg: '#ecfeff', border: '#a5f3fc', color: '#0e7490' },
              { label: 'Ongoing', count: stats.stageCounts.ongoing, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
              { label: 'Finishing', count: stats.stageCounts.finishing, bg: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9' },
              { label: 'Nearing Comp', count: stats.stageCounts.nearingCompletion, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
              { label: 'Handover', count: stats.stageCounts.handover, bg: '#f0fdfa', border: '#99f6e4', color: '#0f766e' },
              { label: 'On Hold', count: stats.stageCounts.hold, bg: '#fff1f2', border: '#fecdd3', color: '#be123c' }
            ].map((stage, i) => (
              <div 
                key={i} 
                className="p-1.5 rounded-xl border text-center"
                style={{ backgroundColor: stage.bg, borderColor: stage.border, color: stage.color }}
              >
                <span className="text-[8px] font-black uppercase tracking-tight block opacity-80">{stage.label}</span>
                <span className="text-sm font-black block mt-0.5">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Columns: Stage Project Names */}
        <div className="grid grid-cols-3 gap-3">
          {/* Column 1: Design & Excavation */}
          <div 
            className="rounded-2xl p-3 space-y-2 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <span className="text-[8.5px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Design &amp; Excavation Stage Projects</span>
            <div className="space-y-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wide block mb-1" style={{ color: '#4338ca' }}>
                  ● Design Stage ({stats.designProjectNames.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-[46px] overflow-hidden">
                  {stats.designProjectNames.length > 0 ? (
                    stats.designProjectNames.slice(0, 6).map((name, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-0.5 text-[8.5px] font-bold rounded border truncate max-w-[150px]"
                        style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] italic" style={{ color: '#94a3b8' }}>No projects</span>
                  )}
                  {stats.designProjectNames.length > 6 && (
                    <span 
                      className="px-1.5 py-0.5 text-[8px] font-black rounded border"
                      style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
                    >
                      +{stats.designProjectNames.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-wide block mb-1" style={{ color: '#b45309' }}>
                  ● Excavation Stage ({stats.excavationProjectNames.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-[46px] overflow-hidden">
                  {stats.excavationProjectNames.length > 0 ? (
                    stats.excavationProjectNames.slice(0, 6).map((name, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-0.5 text-[8.5px] font-bold rounded border truncate max-w-[150px]"
                        style={{ backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] italic" style={{ color: '#94a3b8' }}>No projects</span>
                  )}
                  {stats.excavationProjectNames.length > 6 && (
                    <span 
                      className="px-1.5 py-0.5 text-[8px] font-black rounded border"
                      style={{ backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}
                    >
                      +{stats.excavationProjectNames.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Handover Stage */}
          <div 
            className="rounded-2xl p-3 space-y-2 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <span className="text-[8.5px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Handover Stage Projects</span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wide block mb-1" style={{ color: '#0f766e' }}>
                ● Handover Stage ({stats.handoverProjectNames.length})
              </span>
              <div className="flex flex-wrap gap-1 max-h-[96px] overflow-hidden">
                {stats.handoverProjectNames.length > 0 ? (
                  stats.handoverProjectNames.slice(0, 10).map((name, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 text-[8.5px] font-bold rounded border truncate max-w-[150px]"
                      style={{ backgroundColor: '#f0fdfa', color: '#0f766e', borderColor: '#99f6e4' }}
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] italic" style={{ color: '#94a3b8' }}>No projects in Handover Stage</span>
                )}
                {stats.handoverProjectNames.length > 10 && (
                  <span 
                    className="px-1.5 py-0.5 text-[8px] font-black rounded border"
                    style={{ backgroundColor: '#f0fdfa', color: '#0f766e', borderColor: '#99f6e4' }}
                  >
                    +{stats.handoverProjectNames.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Other (On Hold) */}
          <div 
            className="rounded-2xl p-3 space-y-2 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Other</span>
              <span 
                className="text-[8px] font-black px-1.5 py-0.2 rounded border uppercase"
                style={{ backgroundColor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' }}
              >
                On Hold
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wide block mb-1" style={{ color: '#be123c' }}>
                ● On Hold Stage Projects ({stats.holdProjectNames.length})
              </span>
              <div className="flex flex-wrap gap-1 max-h-[96px] overflow-hidden">
                {stats.holdProjectNames.length > 0 ? (
                  stats.holdProjectNames.slice(0, 10).map((name, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 text-[8.5px] font-bold rounded border truncate max-w-[150px]"
                      style={{ backgroundColor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' }}
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] italic" style={{ color: '#94a3b8' }}>No projects in On Hold Stage</span>
                )}
                {stats.holdProjectNames.length > 10 && (
                  <span 
                    className="px-1.5 py-0.5 text-[8px] font-black rounded border"
                    style={{ backgroundColor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' }}
                  >
                    +{stats.holdProjectNames.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Execution Targets Overview (7 Structured Cards) */}
        <div 
          className="rounded-2xl p-3 space-y-2 border"
          style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          <span className="text-[9px] font-black uppercase tracking-wider block" style={{ color: '#334155' }}>Execution Targets Overview</span>
          
          <div className="grid grid-cols-4 gap-2.5">
            {/* Milestones */}
            <div 
              className="p-2.5 rounded-xl space-y-1 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase" style={{ color: '#334155' }}>
                <span>Milestones Target</span>
                <span 
                  className="px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
                >
                  {stats.milestones.pct}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black" style={{ color: '#0f172a' }}>{stats.milestones.ach}</span>
                <span className="text-[9px] font-bold" style={{ color: '#64748b' }}>/ {stats.milestones.plan} Planned</span>
              </div>
              <div 
                className="flex items-center justify-between text-[8px] font-bold px-2 py-0.8 rounded-lg border"
                style={{ backgroundColor: '#eef2ff', color: '#312e81', borderColor: '#c7d2fe' }}
              >
                <span>Next Month Forecast:</span>
                <span 
                  className="font-black px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#ffffff', borderColor: '#c7d2fe' }}
                >
                  {stats.milestones.fr}
                </span>
              </div>
            </div>

            {/* VOWD */}
            <div 
              className="p-2.5 rounded-xl space-y-1 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase" style={{ color: '#334155' }}>
                <span>Value of Work Done</span>
                <span 
                  className="px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}
                >
                  {stats.vowd.pct}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black" style={{ color: '#0f172a' }}>{formatValue(stats.vowd.ach, true)}</span>
                <span className="text-[9px] font-bold" style={{ color: '#64748b' }}>/ {formatValue(stats.vowd.plan, true)}</span>
              </div>
              <div 
                className="flex items-center justify-between text-[8px] font-bold px-2 py-0.8 rounded-lg border"
                style={{ backgroundColor: '#f5f3ff', color: '#4c1d95', borderColor: '#ddd6fe' }}
              >
                <span>Next Month Forecast:</span>
                <span 
                  className="font-black px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#ffffff', borderColor: '#ddd6fe' }}
                >
                  {formatValue(stats.vowd.fr, true)}
                </span>
              </div>
            </div>

            {/* Labour */}
            <div 
              className="p-2.5 rounded-xl space-y-1 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase" style={{ color: '#334155' }}>
                <span>Labour</span>
                <span 
                  className="px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                >
                  {stats.labour.pct}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black" style={{ color: '#0f172a' }}>{stats.labour.ach.toLocaleString()}</span>
                <span className="text-[9px] font-bold" style={{ color: '#64748b' }}>/ {stats.labour.plan.toLocaleString()} Planned</span>
              </div>
              <div 
                className="flex items-center justify-between text-[8px] font-bold px-2 py-0.8 rounded-lg border"
                style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', borderColor: '#bfdbfe' }}
              >
                <span>Next Month Forecast:</span>
                <span 
                  className="font-black px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#ffffff', borderColor: '#bfdbfe' }}
                >
                  {stats.labour.fr.toLocaleString()}
                </span>
              </div>
            </div>

            {/* SPI */}
            <div 
              className="p-2.5 rounded-xl space-y-1 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase" style={{ color: '#334155' }}>
                <span>Schedule Performance</span>
                <span 
                  className="text-[9px] font-black px-1.5 py-0.2 rounded border"
                  style={{
                    backgroundColor: stats.avgSpi === null ? '#f1f5f9' : stats.avgSpi >= 1.0 ? '#ecfdf5' : stats.avgSpi >= 0.85 ? '#fffbeb' : '#fff1f2',
                    color: stats.avgSpi === null ? '#64748b' : stats.avgSpi >= 1.0 ? '#047857' : stats.avgSpi >= 0.85 ? '#b45309' : '#be123c',
                    borderColor: stats.avgSpi === null ? '#e2e8f0' : stats.avgSpi >= 1.0 ? '#a7f3d0' : stats.avgSpi >= 0.85 ? '#fde68a' : '#fecdd3'
                  }}
                >
                  {stats.avgSpi !== null ? stats.avgSpi.toFixed(2) : 'N/A'}
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-black" style={{ color: '#0f172a' }}>{stats.avgSpi !== null ? stats.avgSpi.toFixed(2) : 'N/A'}</span>
                {stats.avgSpi !== null && (
                  <span 
                    className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: stats.avgSpi >= 1.0 ? '#10b981' : stats.avgSpi >= 0.85 ? '#f59e0b' : '#f43f5e' }}
                  >
                    {stats.avgSpi >= 1.0 ? 'On Track' : stats.avgSpi >= 0.85 ? 'Behind' : 'Slippage'}
                  </span>
                )}
              </div>
              <p className="text-[8px] font-bold" style={{ color: '#94a3b8' }}>Portfolio Average SPI rating</p>
            </div>
          </div>

          {/* Row 2: Speed of Construction, Labour Output, Quality & Safety */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* Speed of Construction */}
            <div 
              className="p-2.5 rounded-xl space-y-1 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase" style={{ color: '#334155' }}>
                <span>Speed of Construction</span>
                <span 
                  className="px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                >
                  Speed
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black" style={{ color: '#0f172a' }}>{stats.speedOfConstruction > 0 ? stats.speedOfConstruction.toFixed(2) : '0'}</span>
                <span className="text-[9px] font-bold" style={{ color: '#64748b' }}>Rs./Sqft</span>
              </div>
            </div>

            {/* Labour Output (Productivity + Efficiency) */}
            <div 
              className="col-span-2 p-2.5 rounded-xl space-y-1 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase border-b pb-1" style={{ color: '#334155', borderColor: '#f1f5f9' }}>
                <span>Labour Output</span>
                <span 
                  className="px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
                >
                  Labour KPI
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <span className="text-[8px] font-black uppercase block" style={{ color: '#475569' }}>Labour Productivity</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-base font-black" style={{ color: '#0f172a' }}>{Math.round(stats.labourProductivity).toLocaleString()}</span>
                    <span className="text-[8px] font-bold" style={{ color: '#64748b' }}>Rs./Lab/Day</span>
                  </div>
                </div>
                <div className="border-l pl-2" style={{ borderColor: '#e2e8f0' }}>
                  <span className="text-[8px] font-black uppercase block" style={{ color: '#475569' }}>Labour Efficiency</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-base font-black" style={{ color: '#0f172a' }}>{stats.labourEfficiency.toFixed(2)}</span>
                    <span className="text-[8px] font-bold" style={{ color: '#64748b' }}>Cr. per 100 labours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality & Safety Ratings */}
            <div 
              className="p-2.5 rounded-xl space-y-1 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase border-b pb-1" style={{ color: '#334155', borderColor: '#f1f5f9' }}>
                <span>Quality &amp; Safety</span>
                <span 
                  className="px-1.5 py-0.2 rounded border"
                  style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}
                >
                  QHSE KPI
                </span>
              </div>
              <div className="space-y-0.5 text-[8.5px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: '#64748b' }}>Quality:</span>
                  <span 
                    className="font-black px-1.5 py-0.2 rounded"
                    style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                  >
                    {stats.leaderQualityRating !== null ? stats.leaderQualityRating.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: '#64748b' }}>Safety:</span>
                  <span 
                    className="font-black px-1.5 py-0.2 rounded"
                    style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                  >
                    {stats.leaderSafetyRating !== null ? stats.leaderSafetyRating.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center font-black pt-0.5 border-t" style={{ color: '#0f172a', borderColor: '#f1f5f9' }}>
                  <span>Avg QHSE:</span>
                  <span 
                    className="px-1.5 py-0.2 rounded border"
                    style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
                  >
                    {stats.leaderAvgQhseRating !== null ? stats.leaderAvgQhseRating.toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-end pt-1">
        <PlanedgePdfLogo />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 3. PROGRESS CURVE SLIDE COMPONENT
 * ------------------------------------------------------------- */
export function ProgressCurveSlide({
  projectsCount,
  metricKey,
  baselinePlan = 'r0',
  monthlyData
}: {
  projectsCount: number;
  metricKey: 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc';
  baselinePlan?: 'r0' | 'r1' | 'both';
  monthlyData: ProgressCurveMonthData[];
}) {
  const config = METRIC_CONFIGS[metricKey] || METRIC_CONFIGS.vowd;

  const lastCompletedMonthIndex = React.useMemo(() => {
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i] && monthlyData[i].Achievement !== null && monthlyData[i].Achievement !== undefined && monthlyData[i].Achievement > 0) {
        return i;
      }
    }
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i] && monthlyData[i].Achievement !== null && monthlyData[i].Achievement !== undefined) {
        return i;
      }
    }
    return 3;
  }, [monthlyData]);

  // Render Bar Plan Label (R0/R1)
  const renderBarPlanLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const cx = (x ?? 0) + (width ? width / 2 : 0);
    const cy = (y ?? 0) - 5;
    return (
      <text
        x={cx}
        y={cy}
        fill="#475569"
        fontSize={10}
        fontWeight={800}
        textAnchor="middle"
      >
        {formatted}
      </text>
    );
  };

  // Render Bar Ach Label with percentage badge format
  const renderBarAchLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    let text = String(formatted);
    const row = monthlyData[index];
    if (row && row['Achievement %'] !== null && row['Achievement %'] !== undefined && row['Achievement %'] > 0) {
      text = `${formatted} (${row['Achievement %']}%)`;
    }
    const cx = (x ?? 0) + (width ? width / 2 : 0);
    const cy = (y ?? 0) - 5;
    return (
      <text
        x={cx}
        y={cy}
        fill={config.colorAch}
        fontSize={10}
        fontWeight={800}
        textAnchor="middle"
      >
        {text}
      </text>
    );
  };

  // Render Cum Plan Label (Mar 27 & Last Completed Month)
  const renderCumPlanLineLabel = (props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;
    const isLastCompleted = index === lastCompletedMonthIndex;
    const isMar27 = index === monthlyData.length - 1;
    if (!isLastCompleted && !isMar27) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const posX = x ?? 0;
    const posY = y ?? 0;
    return (
      <g>
        <rect
          x={posX - 24}
          y={posY - 24}
          width={48}
          height={18}
          rx={4}
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth={1.5}
        />
        <text
          x={posX}
          y={posY - 11}
          fill="#1e293b"
          fontSize={10}
          fontWeight={800}
          textAnchor="middle"
        >
          {formatted}
        </text>
      </g>
    );
  };

  // Render Cum Ach Label with cumulative percentage
  const renderCumAchLineLabel = (props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;
    const isLastCompleted = index === lastCompletedMonthIndex;
    if (!isLastCompleted) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const row = monthlyData[index];
    const pct = row ? row['CumAchievement %'] : 0;
    const labelText = pct && pct > 0 ? `${formatted} (${pct}%)` : `${formatted}`;

    const posX = x ?? 0;
    const posY = y ?? 0;
    return (
      <g>
        <rect
          x={posX - 38}
          y={posY + 8}
          width={76}
          height={20}
          rx={5}
          fill="#1e1b4b"
          stroke="#4f46e5"
          strokeWidth={1.5}
        />
        <text
          x={posX}
          y={posY + 22}
          fill="#ffffff"
          fontSize={10}
          fontWeight={800}
          textAnchor="middle"
        >
          {labelText}
        </text>
      </g>
    );
  };

  return (
    <div 
      className="report-slide relative flex flex-col justify-between p-8 overflow-hidden select-none font-sans" 
      style={{ width: '1122px', height: '794px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      <div className="space-y-4 flex-1">
        {/* Header with Title and Tabs */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#f1f5f9' }}>
          <div>
            <h4 className="text-base font-black flex items-center gap-1.5" style={{ color: '#0f172a' }}>
              <TrendingUp className="w-4 h-4" style={{ color: '#4f46e5' }} />
              <span>{getFiscalYearConfig(getStoredFiscalYear()).label} Monthly Progress Curve</span>
            </h4>
            <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
              Aggregated monthly progress and cumulative S-curve trend across selected portfolio ({projectsCount} projects)
            </p>
          </div>

          {/* Metric Indicator Pills */}
          <div 
            className="flex items-center gap-1.5 p-1 rounded-xl border"
            style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }}
          >
            {[
              { id: 'vowd', label: 'VOWD' },
              { id: 'milestone', label: 'Milestones' },
              { id: 'labour', label: 'Labour' },
              { id: 'ur', label: 'Unit Delivery - Residential' },
              { id: 'uc', label: 'Unit Delivery - Commercial' }
            ].map((tab) => {
              const isActive = tab.id === metricKey;
              return (
                <span
                  key={tab.id}
                  className="px-2.5 py-1 rounded-lg text-[9.5px] font-black transition-all"
                  style={{
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#4f46e5' : '#94a3b8',
                    border: isActive ? '1px solid #e2e8f0' : '1px solid transparent'
                  }}
                >
                  {tab.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sub-bar: Baseline Plan & Display Mode */}
        <div 
          className="flex items-center justify-between p-2.5 rounded-2xl border text-[10px] whitespace-nowrap flex-nowrap gap-3"
          style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap flex-nowrap shrink-0">
            <span className="font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>Baseline Plan:</span>
            <div className="inline-flex rounded-lg border p-0.5 whitespace-nowrap flex-nowrap shrink-0" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <span 
                className="px-2.5 py-0.5 font-bold rounded whitespace-nowrap"
                style={{
                  backgroundColor: baselinePlan === 'r0' ? '#4f46e5' : 'transparent',
                  color: baselinePlan === 'r0' ? '#ffffff' : '#475569'
                }}
              >
                R0 Plan
              </span>
              <span 
                className="px-2.5 py-0.5 font-bold rounded whitespace-nowrap"
                style={{
                  backgroundColor: baselinePlan === 'r1' ? '#4f46e5' : 'transparent',
                  color: baselinePlan === 'r1' ? '#ffffff' : '#475569'
                }}
              >
                R1 Plan
              </span>
              <span 
                className="px-2.5 py-0.5 font-bold rounded whitespace-nowrap"
                style={{
                  backgroundColor: baselinePlan === 'both' ? '#4f46e5' : 'transparent',
                  color: baselinePlan === 'both' ? '#ffffff' : '#475569'
                }}
              >
                Both plan (Compare)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap flex-nowrap shrink-0">
            <span className="font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>Display Mode:</span>
            <div className="inline-flex rounded-lg border p-0.5 whitespace-nowrap flex-nowrap shrink-0" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <span 
                className="px-2.5 py-0.5 font-bold rounded border whitespace-nowrap"
                style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
              >
                Monthly (Bar)
              </span>
              <span 
                className="px-2.5 py-0.5 font-bold rounded border ml-1 whitespace-nowrap"
                style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
              >
                Cumulative (Line)
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-5 text-[9.5px] font-bold px-2 whitespace-nowrap flex-nowrap">
          <div className="flex items-center gap-2 whitespace-nowrap flex-nowrap shrink-0">
            <span className="uppercase tracking-wider text-[8px] font-black whitespace-nowrap" style={{ color: '#94a3b8' }}>Monthly Bars:</span>
            {baselinePlan === 'both' ? (
              <>
                <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                  <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: '#94a3b8' }} />
                  <span className="whitespace-nowrap" style={{ color: '#475569' }}>R0 Plan</span>
                </div>
                <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                  <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: config.colorPlan }} />
                  <span className="whitespace-nowrap" style={{ color: '#475569' }}>R1 Plan</span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: config.colorPlan }} />
                <span className="whitespace-nowrap" style={{ color: '#475569' }}>{baselinePlan.toUpperCase()} Plan</span>
              </div>
            )}
            <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
              <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: config.colorAch }} />
              <span className="whitespace-nowrap" style={{ color: '#475569' }}>Actual</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l pl-4 whitespace-nowrap flex-nowrap shrink-0" style={{ borderColor: '#e2e8f0' }}>
            <span className="uppercase tracking-wider text-[8px] font-black whitespace-nowrap" style={{ color: '#94a3b8' }}>S-Curve Lines:</span>
            {baselinePlan === 'both' ? (
              <>
                <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                  <span className="inline-block w-4 h-0.5 border-t-2 border-dashed shrink-0" style={{ borderColor: '#94a3b8' }} />
                  <span className="whitespace-nowrap" style={{ color: '#475569' }}>Cum R0</span>
                </div>
                <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                  <span className="inline-block w-4 h-0.5 border-t-2 border-solid shrink-0" style={{ borderColor: config.colorPlan }} />
                  <span className="whitespace-nowrap" style={{ color: '#475569' }}>Cum R1</span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                <span className="inline-block w-4 h-0.5 border-t-2 border-solid shrink-0" style={{ borderColor: config.colorPlan }} />
                <span className="whitespace-nowrap" style={{ color: '#475569' }}>Cum {baselinePlan.toUpperCase()}</span>
              </div>
            )}
            <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
              <span className="inline-block w-4 h-0.5 border-t-2 border-solid shrink-0" style={{ borderColor: config.colorAch }} />
              <span className="whitespace-nowrap" style={{ color: '#475569' }}>Cum Actual</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart Canvas with explicit pixel dimensions for pristine PDF rendering */}
        <div className="h-[430px] w-full pt-2 flex justify-center">
          <ComposedChart
            width={1050}
            height={420}
            data={monthlyData}
            margin={{ top: 25, right: 35, left: -5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} fontWeight={700} tickLine={false} dy={5} />
            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={9.5} fontWeight={700} tickLine={false} tickFormatter={(v) => formatValue(v, config.isCurrency)} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={9.5} fontWeight={700} tickLine={false} tickFormatter={(v) => formatValue(v, config.isCurrency)} />

            {baselinePlan === 'both' ? (
              <>
                <Bar isAnimationActive={false} yAxisId="left" dataKey="PlanR0" name="R0 Plan" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={15}>
                  <LabelList dataKey="PlanR0" content={renderBarPlanLabel} />
                </Bar>
                <Bar isAnimationActive={false} yAxisId="left" dataKey="PlanR1" name="R1 Plan" fill={config.colorPlan} radius={[3, 3, 0, 0]} maxBarSize={15}>
                  <LabelList dataKey="PlanR1" content={renderBarPlanLabel} />
                </Bar>
                <Bar isAnimationActive={false} yAxisId="left" dataKey="Achievement" name="Actual" fill={config.colorAch} radius={[3, 3, 0, 0]} maxBarSize={15}>
                  <LabelList dataKey="Achievement" content={renderBarAchLabel} />
                </Bar>

                <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="CumPlanR0" name="Cum R0 Plan" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }}>
                  <LabelList dataKey="CumPlanR0" content={renderCumPlanLineLabel} />
                </Line>
                <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="CumPlanR1" name="Cum R1 Plan" stroke={config.colorPlan} strokeWidth={2.5} dot={{ r: 3 }}>
                  <LabelList dataKey="CumPlanR1" content={renderCumPlanLineLabel} />
                </Line>
                <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="CumAchievement" name="Cum Actual" stroke={config.colorAch} strokeWidth={3} dot={{ r: 4, fill: config.colorAch }}>
                  <LabelList dataKey="CumAchievement" content={renderCumAchLineLabel} />
                </Line>
              </>
            ) : (
              <>
                <Bar isAnimationActive={false} yAxisId="left" dataKey="Plan" name="Plan" fill={config.colorPlan} radius={[3, 3, 0, 0]} maxBarSize={22}>
                  <LabelList dataKey="Plan" content={renderBarPlanLabel} />
                </Bar>
                <Bar isAnimationActive={false} yAxisId="left" dataKey="Achievement" name="Actual" fill={config.colorAch} radius={[3, 3, 0, 0]} maxBarSize={22}>
                  <LabelList dataKey="Achievement" content={renderBarAchLabel} />
                </Bar>

                <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="CumPlan" name="Cum Plan" stroke={config.colorPlan} strokeWidth={2.5} dot={{ r: 3 }}>
                  <LabelList dataKey="CumPlan" content={renderCumPlanLineLabel} />
                </Line>
                <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="CumAchievement" name="Cum Actual" stroke={config.colorAch} strokeWidth={3} dot={{ r: 4, fill: config.colorAch }}>
                  <LabelList dataKey="CumAchievement" content={renderCumAchLineLabel} />
                </Line>
              </>
            )}
          </ComposedChart>
        </div>
      </div>

      <div className="flex justify-end items-end pt-1">
        <PlanedgePdfLogo />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 4. PROJECT CARDS SLIDE (PAGINATED IN 3x2 GRID = 6 CARDS)
 * ------------------------------------------------------------- */
export function ProjectCardsSlide({
  totalProjectsCount,
  projects
}: {
  totalProjectsCount: number;
  projects: Project[];
}) {
  return (
    <div 
      className="report-slide relative flex flex-col justify-between p-7 overflow-hidden select-none font-sans" 
      style={{ width: '1122px', height: '794px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      <div className="space-y-3 flex-1">
        {/* Header with Title and Search placeholder */}
        <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: '#e2e8f0' }}>
          <h4 className="text-base font-black" style={{ color: '#0f172a' }}>
            Projects ({totalProjectsCount})
          </h4>
          <div 
            className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] border"
            style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8' }}
          >
            <Search className="w-3 h-3" style={{ color: '#94a3b8' }} />
            <span>Filter project ID, stage, area...</span>
          </div>
        </div>

        {/* 3x2 Grid of 6 Cards */}
        <div className="grid grid-cols-3 gap-3">
          {projects.map((p) => {
            const parsedSpi = p.spi ? parseFloat(p.spi) : null;
            const vowdPct = getPercent(p.vowdPctAch, p.vowdPlan, p.vowdAch);
            const milestonePct = getPercent(p.milestonePctAch, p.milestonePlan, p.milestoneAch);
            const labourPct = getPercent(p.labourPctAch, p.labourPlan, p.labourAch);
            const formattedArea = p.areaSqft ? parseFloat(p.areaSqft.replace(/,/g, '')).toLocaleString() : '';

            const isSpiNA = !p.spi || /^(NA|N\/A|-|NONE|)$/i.test(String(p.spi).trim()) || isNaN(parseFloat(p.spi));
            const statusColor = isSpiNA ? '#94a3b8' : (p.status === 'Green' ? '#10b981' : p.status === 'Amber' ? '#f59e0b' : p.status === 'Red' ? '#f43f5e' : '#94a3b8');
            const statusBg = isSpiNA ? '#f8fafc' : (p.status === 'Green' ? '#ecfdf5' : p.status === 'Amber' ? '#fffbeb' : p.status === 'Red' ? '#fff1f2' : '#f8fafc');
            const statusText = isSpiNA ? '#64748b' : (p.status === 'Green' ? '#047857' : p.status === 'Amber' ? '#b45309' : p.status === 'Red' ? '#be123c' : '#475569');

            return (
              <div 
                key={p.code} 
                className="rounded-2xl p-3.5 flex flex-col justify-between space-y-2 relative overflow-hidden border"
                style={{ height: '310px', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
              >
                {/* Status Accent Top Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: statusColor }}
                />

                {/* Card Top Details */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {p.code && (
                        <span 
                          className="px-1.5 py-0.2 font-mono font-bold rounded text-[8.5px] uppercase"
                          style={{ backgroundColor: '#eef2ff', color: '#4338ca' }}
                        >
                          {p.code}
                        </span>
                      )}
                      <span 
                        className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase"
                        style={{ backgroundColor: statusBg, color: statusText }}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <h5 className="font-black text-xs truncate leading-snug" title={p.name} style={{ color: '#1e293b' }}>
                    {p.name}
                  </h5>
                  <p className="text-[8.5px] truncate" style={{ color: '#94a3b8' }}>
                    Area: <span className="font-semibold" style={{ color: '#475569' }}>{formattedArea ? `${formattedArea} Sqft` : 'N/A'}</span> &bull; Stage: <span className="font-semibold" style={{ color: '#475569' }}>{p.projectStage || 'N/A'}</span>
                  </p>
                </div>

                {/* Performance Block (SPI, VOWD, Milestone, Labour) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: '#f1f5f9' }}>
                    <span className="text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: '#475569' }}>
                      <Gauge className="w-3 h-3" style={{ color: '#4f46e5' }} />
                      SPI INDEX
                    </span>
                    <span 
                      className="text-[8.5px] font-black px-2 py-0.2 rounded-md"
                      style={{
                        backgroundColor: parsedSpi !== null && parsedSpi >= 1.0 ? '#10b981' : parsedSpi !== null && parsedSpi >= 0.85 ? '#f59e0b' : parsedSpi !== null ? '#f43f5e' : '#f1f5f9',
                        color: parsedSpi !== null ? '#ffffff' : '#64748b'
                      }}
                    >
                      {parsedSpi !== null ? parsedSpi.toFixed(2) : 'N/A'}
                    </span>
                  </div>

                  <div 
                    className="rounded-xl p-2 space-y-1 border"
                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                  >
                    {/* VOWD */}
                    <div className="flex items-center justify-between text-[8px]">
                      <div>
                        <span className="font-black uppercase block" style={{ color: '#475569' }}>VOWD</span>
                        <div className="font-black" style={{ color: '#0f172a' }}>
                          {vowdPct} <span className="font-medium" style={{ color: '#64748b' }}>({p.vowdAch || '0'}/{p.vowdPlan || '0'} Cr)</span>
                        </div>
                      </div>
                      <div 
                        className="px-2 py-0.5 rounded text-right border"
                        style={{ backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }}
                      >
                        <span className="font-black uppercase block text-[7px]" style={{ color: '#6d28d9' }}>FORECAST</span>
                        <span className="font-black text-[8px]" style={{ color: '#4c1d95' }}>{p.vowdFr ? (String(p.vowdFr).includes('Cr') ? p.vowdFr : `${p.vowdFr} Cr`) : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Milestone */}
                    <div className="flex items-center justify-between text-[8px]">
                      <div>
                        <span className="font-black uppercase block" style={{ color: '#475569' }}>MILESTONE</span>
                        <div className="font-black" style={{ color: '#0f172a' }}>
                          {milestonePct} <span className="font-medium" style={{ color: '#64748b' }}>({p.milestoneAch || '0'}/{p.milestonePlan || '0'})</span>
                        </div>
                      </div>
                      <div 
                        className="px-2 py-0.5 rounded text-right border"
                        style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}
                      >
                        <span className="font-black uppercase block text-[7px]" style={{ color: '#4338ca' }}>FORECAST</span>
                        <span className="font-black text-[8px]" style={{ color: '#312e81' }}>{p.milestoneFr || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Labour */}
                    <div className="flex items-center justify-between text-[8px]">
                      <div>
                        <span className="font-black uppercase block" style={{ color: '#475569' }}>LABOUR</span>
                        <div className="font-black" style={{ color: '#0f172a' }}>
                          {labourPct} <span className="font-medium" style={{ color: '#64748b' }}>({p.labourAch || '0'}/{p.labourPlan || '0'})</span>
                        </div>
                      </div>
                      <div 
                        className="px-2 py-0.5 rounded text-right border"
                        style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
                      >
                        <span className="font-black uppercase block text-[7px]" style={{ color: '#1d4ed8' }}>FORECAST</span>
                        <span className="font-black text-[8px]" style={{ color: '#1e3a8a' }}>{p.labourFr || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates & Variances */}
                <div className="space-y-1 text-[8px]">
                  <div className="flex justify-between items-center" style={{ color: '#475569' }}>
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-2.5 h-2.5" style={{ color: '#94a3b8' }} />
                      Baseline Finish:
                    </span>
                    <span className="font-black" style={{ color: '#1e293b' }}>{formatDateToDdMmmYy(p.baseline1Finish || p.baselineFinish)}</span>
                  </div>
                  <div className="flex justify-between items-center" style={{ color: '#475569' }}>
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-2.5 h-2.5" style={{ color: '#94a3b8' }} />
                      Proposed Finish:
                    </span>
                    <span className="font-black" style={{ color: '#1e293b' }}>{formatDateToDdMmmYy(p.proposedFinish || p.targetDate)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <div 
                      className="p-1 rounded text-center border"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                    >
                      <span className="text-[7px] uppercase font-bold block" style={{ color: '#64748b' }}>SCHEDULE VARIANCE</span>
                      <span 
                        className="text-[8px] font-black"
                        style={{
                          color: p.scheduleVariance && (p.scheduleVariance.includes('+') || parseFloat(p.scheduleVariance) > 0) ? '#e11d48' : '#059669'
                        }}
                      >
                        {formatDaysUnit(p.scheduleVariance)}
                      </span>
                    </div>
                    <div 
                      className="p-1 rounded text-center border"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                    >
                      <span className="text-[7px] uppercase font-bold block" style={{ color: '#64748b' }}>DELAY IN MONTH</span>
                      <span 
                        className="text-[8px] font-black"
                        style={{
                          color: p.delayInCurrentMonth && (p.delayInCurrentMonth.includes('+') || parseFloat(p.delayInCurrentMonth) > 0 || parseInt(p.delayInCurrentMonth) > 0) ? '#e11d48' : '#059669'
                        }}
                      >
                        {formatDaysUnit(p.delayInCurrentMonth)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Avg QHSE Rating */}
                <div className="flex items-center justify-between border-t pt-1 text-[8.5px]" style={{ borderColor: '#f1f5f9' }}>
                  <span className="font-black uppercase flex items-center gap-1" style={{ color: '#475569' }}>
                    <ShieldCheck className="w-3 h-3" style={{ color: '#8b5cf6' }} />
                    AVG QHSE RATING
                  </span>
                  {(() => {
                    const raw = p.avgQhseRating || p.qhseRating;
                    if (!raw || raw === '-' || raw.toUpperCase() === 'N/A') {
                      return <span className="font-black px-1.5 py-0.2 rounded text-[8px]" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>N/A</span>;
                    }
                    const val = parseFloat(String(raw).replace(/%/g, ''));
                    const isValid = !isNaN(val);
                    return (
                      <span 
                        className="font-black px-1.5 py-0.2 rounded text-[8px] text-white"
                        style={{
                          backgroundColor: !isValid ? '#f1f5f9' : val >= 8.5 || val >= 85 ? '#10b981' : val >= 7.0 || val >= 70 ? '#f59e0b' : '#f43f5e',
                          color: !isValid ? '#64748b' : '#ffffff'
                        }}
                      >
                        {isValid ? val.toFixed(2) : raw}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end items-end pt-1">
        <PlanedgePdfLogo />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 5. ATTENTION NEEDED SLIDE COMPONENT (Top Critical Projects)
 * ------------------------------------------------------------- */
export interface AttentionNeededSlideProps {
  title?: string;
  subtitle?: string;
  teamName?: string;
  projects: Project[];
  software2Projects?: Software2Project[];
}

export function AttentionNeededSlide({
  title = 'Attention Needed — Top 7 Critical Projects',
  subtitle,
  teamName = 'Team Overview',
  projects = [],
  software2Projects = []
}: AttentionNeededSlideProps) {
  const activeFy = getStoredFiscalYear();
  const fyConfig = getFiscalYearConfig(activeFy);

  // Compute critical projects with parameter lags
  const { criticalItems, lagCounts } = React.useMemo(() => {
    const list: any[] = [];
    let vowdCount = 0;
    let labourCount = 0;
    let milestoneCount = 0;
    let urCount = 0;
    let ucCount = 0;
    let spiCount = 0;

    projects.forEach(p => {
      if (!p || !p.code) return;
      const s2 = software2Projects.find(
        s => (s.code && s.code.trim().toLowerCase() === p.code.trim().toLowerCase()) ||
             (s.name && s.name.trim().toLowerCase() === p.name.trim().toLowerCase())
      );

      // VOWD
      const vowdPlan = parseFloat(String(p.vowdPlan || '').replace(/,/g, '')) || 0;
      const vowdAch = parseFloat(String(p.vowdAch || '').replace(/,/g, '')) || 0;
      const vowdPct = vowdPlan > 0 ? (vowdAch / vowdPlan) * 100 : (vowdAch > 0 ? 100 : 0);
      const vowdGap = Math.max(0, vowdPlan - vowdAch);
      const isLaggingVowd = vowdPlan > 0 && (vowdPct < 85 || vowdGap >= 0.5);
      if (isLaggingVowd) vowdCount++;

      // Labour
      const labourPlan = parseFloat(String(p.labourPlan || '').replace(/,/g, '')) || 0;
      const labourAch = parseFloat(String(p.labourAch || '').replace(/,/g, '')) || 0;
      const labourPct = labourPlan > 0 ? (labourAch / labourPlan) * 100 : (labourAch > 0 ? 100 : 0);
      const labourGap = Math.max(0, labourPlan - labourAch);
      const isLaggingLabour = labourPlan > 0 && (labourPct < 85 || labourGap >= 15);
      if (isLaggingLabour) labourCount++;

      // Milestones
      const milestonePlan = parseFloat(String(p.milestonePlan || '').replace(/,/g, '')) || 0;
      const milestoneAch = parseFloat(String(p.milestoneAch || '').replace(/,/g, '')) || 0;
      const milestonePct = milestonePlan > 0 ? (milestoneAch / milestonePlan) * 100 : (milestoneAch > 0 ? 100 : 0);
      const milestoneGap = Math.max(0, milestonePlan - milestoneAch);
      const isLaggingMilestone = milestonePlan > 0 && (milestonePct < 85 || milestoneGap >= 1);
      if (isLaggingMilestone) milestoneCount++;

      // Unit Delivery - Res / Comm
      const isLaggingUr = false;
      const isLaggingUc = false;

      // SPI
      const spiNum = parseFloat(String(p.spi || s2?.spi || '1.0').replace(/%/g, '')) || 1.0;
      const isLaggingSpi = spiNum < 0.85;
      if (isLaggingSpi) spiCount++;

      let score = 0;
      if (isLaggingVowd) score += 35 + (vowdGap * 2);
      if (isLaggingLabour) score += 25 + (labourGap / 50);
      if (isLaggingMilestone) score += 25 + (milestoneGap * 3);
      if (isLaggingSpi) score += 20 * (1 - Math.min(1, spiNum));

      if (score > 0 || isLaggingVowd || isLaggingLabour || isLaggingMilestone || isLaggingSpi) {
        list.push({
          code: p.code,
          name: p.name || p.code,
          vp: p.vp,
          leader: p.leader,
          stage: p.projectStage || 'On Going project',
          status: p.status || (score > 40 ? 'Red' : 'Amber'),
          score,
          vowd: { plan: vowdPlan, ach: vowdAch, pct: vowdPct, gap: vowdGap, isLagging: isLaggingVowd },
          labour: { plan: labourPlan, ach: labourAch, pct: labourPct, gap: labourGap, isLagging: isLaggingLabour },
          milestone: { plan: milestonePlan, ach: milestoneAch, pct: milestonePct, gap: milestoneGap, isLagging: isLaggingMilestone },
          spi: spiNum,
          isLaggingSpi
        });
      }
    });

    list.sort((a, b) => b.score - a.score);
    return {
      criticalItems: list.slice(0, 6),
      lagCounts: {
        total: list.length,
        vowd: vowdCount,
        labour: labourCount,
        milestone: milestoneCount,
        ur: urCount,
        uc: ucCount,
        spi: spiCount
      }
    };
  }, [projects, software2Projects]);

  return (
    <div 
      className="report-slide relative flex flex-col justify-between p-7 overflow-hidden select-none font-sans" 
      style={{ width: '1122px', height: '794px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#ffe4e6' }}>
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-2xl text-white shadow-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#f43f5e' }}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {title}
              </h2>
              <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>
                ACTION REQUIRED
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5 max-w-[760px] leading-snug">
              {subtitle || `In-depth performance diagnosis analyzing data from April 2026 to ${fyConfig.endMonthKey}. Highlights lagging deliverable parameters, shortfall gaps, labour productivity, efficiency, speed of construction, and executive recovery actions.`}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-black uppercase tracking-wider block text-rose-700">
            {teamName}
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {fyConfig.label} ({fyConfig.startMonthKey}–{fyConfig.endMonthKey})
          </span>
        </div>
      </div>

      {/* Filter Parameter Summary Bar (matching attachment) */}
      <div className="my-2.5 flex items-center space-x-2 text-[10px] font-bold overflow-x-hidden">
        <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-1">
          FILTER BY PARAMETER:
        </span>
        <span className="px-2.5 py-1 rounded-full font-black text-white bg-slate-900">
          All Critical ({lagCounts.total})
        </span>
        <span className="px-2.5 py-1 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
          VOWD Lag ({lagCounts.vowd})
        </span>
        <span className="px-2.5 py-1 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
          Labour Lag ({lagCounts.labour})
        </span>
        <span className="px-2.5 py-1 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
          Milestones Lag ({lagCounts.milestone})
        </span>
        <span className="px-2.5 py-1 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
          Unit Delivery - Res ({lagCounts.ur})
        </span>
        <span className="px-2.5 py-1 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
          Unit Delivery - Comm ({lagCounts.uc})
        </span>
        <span className="px-2.5 py-1 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
          SPI &amp; Ratings Lag ({lagCounts.spi})
        </span>
      </div>

      {/* Main Content Area: Critical Projects List Rows */}
      <div className="flex-1 flex flex-col justify-start space-y-2 my-1 overflow-hidden">
        {criticalItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div>
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <h4 className="text-sm font-black text-slate-800">All Projects Operating Within Baseline Thresholds</h4>
              <p className="text-xs text-slate-500 mt-1">No critical deliverable lags identified across {teamName} portfolio.</p>
            </div>
          </div>
        ) : (
          criticalItems.map((item, idx) => {
            const hasLags = item.vowd.isLagging || item.labour.isLagging || item.milestone.isLagging || item.isLaggingSpi;

            return (
              <div 
                key={item.code}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
              >
                {/* Left: Rank, Code, Name, Status & Metadata */}
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-lg text-rose-700 bg-rose-50 font-black text-xs shrink-0 border border-rose-100">
                    #{idx + 1}
                  </span>

                  <span className="px-2 py-0.5 rounded-md font-mono font-black text-[10px] bg-slate-100 text-slate-700 shrink-0">
                    {item.code}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-[220px]">
                        {item.name}
                      </h4>
                      <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded uppercase ${
                        item.status.toLowerCase() === 'red' ? 'bg-rose-100 text-rose-800' :
                        item.status.toLowerCase() === 'amber' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium mt-0.5">
                      <span>VP: <strong className="text-slate-700">{item.vp}</strong></span>
                      <span>•</span>
                      <span>Lead: <strong className="text-slate-700">{item.leader}</strong></span>
                      <span>•</span>
                      <span>Stage: <strong className="text-slate-700">{item.stage}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Parameter Lag Badges & Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {item.vowd.isLagging && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      $ VOWD: {item.vowd.pct.toFixed(0)}% (-₹{item.vowd.gap.toFixed(1)}Cr)
                    </span>
                  )}

                  {item.labour.isLagging && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Labour: {item.labour.pct.toFixed(0)}% (-{item.labour.gap} Labours)
                    </span>
                  )}

                  {item.milestone.isLagging && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Milestones: {item.milestone.pct.toFixed(0)}% (-{item.milestone.gap}Qty)
                    </span>
                  )}

                  {item.isLaggingSpi && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      SPI: {item.spi.toFixed(2)}
                    </span>
                  )}

                  {!hasLags && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                      Near Threshold Variance (SPI: {item.spi.toFixed(2)})
                    </span>
                  )}

                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Drilldown
                  </span>

                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center">
                    <span>Analyze</span>
                    <ChevronRight className="w-3 h-3 ml-0.5 text-slate-400" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <span className="text-[9px] font-bold text-slate-400">
          CONFIDENTIAL • Executive Performance Diagnostic • Planedge Management Review
        </span>
        <PlanedgePdfLogo />
      </div>
    </div>
  );
}
