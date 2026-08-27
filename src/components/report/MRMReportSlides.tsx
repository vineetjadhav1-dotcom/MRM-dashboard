import React from 'react';
import { Project } from '@/src/types';
import PlanedgePdfLogo from './PlanedgePdfLogo';
import { 
  Building, 
  Briefcase, 
  TrendingUp, 
  Gauge, 
  Calendar, 
  ShieldCheck, 
  Search 
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
    return `${formatted} Cr.`;
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

const METRIC_CONFIGS: Record<string, { label: string; shortLabel: string; isCurrency: boolean; colorPlan: string; colorAch: string }> = {
  vowd: { label: 'VOWD', shortLabel: 'VOWD', isCurrency: true, colorPlan: '#818cf8', colorAch: '#4f46e5' },
  milestone: { label: 'Milestones', shortLabel: 'Milestones', isCurrency: false, colorPlan: '#38bdf8', colorAch: '#0284c7' },
  labour: { label: 'Labour', shortLabel: 'Labour', isCurrency: false, colorPlan: '#c084fc', colorAch: '#7e22ce' },
  ur: { label: 'Unit Delivery (Residential)', shortLabel: 'Residential Delivery', isCurrency: false, colorPlan: '#fb923c', colorAch: '#c2410c' },
  uc: { label: 'Unit Delivery (Commercial)', shortLabel: 'Commercial Delivery', isCurrency: false, colorPlan: '#fcd34d', colorAch: '#b45309' }
};

/* -------------------------------------------------------------
 * 1. COVER SLIDE COMPONENT
 * ------------------------------------------------------------- */
export function CoverSlide({
  title = 'MRM - July 26',
  teamName = 'Team KM'
}: {
  title?: string;
  teamName: string;
}) {
  return (
    <div 
      className="report-slide relative flex flex-col justify-between p-12 overflow-hidden select-none font-sans" 
      style={{ width: '1122px', height: '794px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {title && (
          <h1 className="text-4xl font-extrabold tracking-tight mb-8" style={{ color: '#0f172a' }}>
            {title}
          </h1>
        )}
        <h2 className="text-4xl font-black tracking-tight" style={{ color: '#0f172a' }}>
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

        {/* Top 3 KPI Highlights */}
        <div className="grid grid-cols-3 gap-3">
          <div 
            className="rounded-xl p-3 flex items-center space-x-3 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <div 
              className="p-2.5 rounded-xl shrink-0"
              style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}
            >
              <Building className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="text-[9px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Total Area Managed</span>
              <span className="text-base font-black block" style={{ color: '#1e293b' }}>
                {stats.totalArea > 0 ? stats.totalArea.toLocaleString() : 'N/A'} <span className="text-[10px] font-bold" style={{ color: '#64748b' }}>Sqft</span>
              </span>
              <p className="text-[8.5px] truncate" style={{ color: '#94a3b8' }}>Sum of all mapped spatial areas</p>
            </div>
          </div>

          <div 
            className="rounded-xl p-3 flex items-center space-x-3 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <div 
              className="p-2.5 rounded-xl shrink-0"
              style={{ backgroundColor: '#ecfdf5', color: '#059669' }}
            >
              <Building className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="text-[9px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>Area Under Construction</span>
              <span className="text-base font-black block" style={{ color: '#1e293b' }}>
                {stats.areaUnderConstruction > 0 ? stats.areaUnderConstruction.toLocaleString() : '0'} <span className="text-[10px] font-bold" style={{ color: '#64748b' }}>Sqft</span>
              </span>
              <p className="text-[8.5px] truncate" style={{ color: '#94a3b8' }}>Construction/ongoing/finishing stage</p>
            </div>
          </div>

          <div 
            className="rounded-xl p-3 flex items-center space-x-3 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <div 
              className="p-2.5 rounded-xl shrink-0"
              style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
            >
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="text-[9px] font-black uppercase tracking-wider block" style={{ color: '#94a3b8' }}>No. of Projects</span>
              <span className="text-base font-black block" style={{ color: '#1e293b' }}>{projectsCount}</span>
              <p className="text-[8.5px] truncate" style={{ color: '#94a3b8' }}>Total active portfolio projects</p>
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
      if (monthlyData[i].Achievement !== null && monthlyData[i].Achievement !== undefined) {
        return i;
      }
    }
    return 3;
  }, [monthlyData]);

  // Render Bar Plan Label
  const renderBarPlanLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const cx = x + (width ? width / 2 : 0);
    return (
      <text x={cx} y={y - 4} fill="#475569" fontSize={9.5} fontWeight={800} textAnchor="middle">
        {formatted}
      </text>
    );
  };

  // Render Bar Ach Label
  const renderBarAchLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const cx = x + (width ? width / 2 : 0);
    return (
      <text x={cx} y={y - 4} fill={config.colorAch} fontSize={9.5} fontWeight={800} textAnchor="middle">
        {formatted}
      </text>
    );
  };

  // Render Cum Plan Label
  const renderCumPlanLineLabel = (props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;
    const isLastCompleted = index === lastCompletedMonthIndex;
    const isMar27 = index === monthlyData.length - 1;
    if (!isLastCompleted && !isMar27) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    return (
      <g>
        <rect x={x - 22} y={y - 20} width={44} height={16} rx={3} fill="#ffffff" stroke="#94a3b8" strokeWidth={1.5} />
        <text x={x} y={y - 8} fill="#1e293b" fontSize={9.5} fontWeight={800} textAnchor="middle">
          {formatted}
        </text>
      </g>
    );
  };

  // Render Cum Ach Label
  const renderCumAchLineLabel = (props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;
    const isLastCompleted = index === lastCompletedMonthIndex;
    if (!isLastCompleted) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const row = monthlyData[index];
    const pct = row ? row['CumAchievement %'] : 0;
    const labelText = pct ? `${formatted} (${pct}%)` : `${formatted}`;

    return (
      <g>
        <rect x={x - 34} y={y - 22} width={68} height={18} rx={4} fill="#1e1b4b" stroke="#4f46e5" strokeWidth={1.5} />
        <text x={x} y={y - 9} fill="#ffffff" fontSize={9.5} fontWeight={800} textAnchor="middle">
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
              <span>FY 26-27 Monthly Progress Curve</span>
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
              { id: 'ur', label: 'Unit Delivery (Residential)' },
              { id: 'uc', label: 'Unit Delivery (Commercial)' }
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
          className="flex items-center justify-between p-2.5 rounded-2xl border text-[10px]"
          style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wider" style={{ color: '#64748b' }}>Baseline Plan:</span>
            <div className="inline-flex rounded-lg border p-0.5" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <span 
                className="px-2.5 py-0.5 font-bold rounded"
                style={{
                  backgroundColor: baselinePlan === 'r0' ? '#4f46e5' : 'transparent',
                  color: baselinePlan === 'r0' ? '#ffffff' : '#475569'
                }}
              >
                R0 Plan
              </span>
              <span 
                className="px-2.5 py-0.5 font-bold rounded"
                style={{
                  backgroundColor: baselinePlan === 'r1' ? '#4f46e5' : 'transparent',
                  color: baselinePlan === 'r1' ? '#ffffff' : '#475569'
                }}
              >
                R1 Plan
              </span>
              <span 
                className="px-2.5 py-0.5 font-bold rounded"
                style={{
                  backgroundColor: baselinePlan === 'both' ? '#4f46e5' : 'transparent',
                  color: baselinePlan === 'both' ? '#ffffff' : '#475569'
                }}
              >
                Both plan (Compare)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wider" style={{ color: '#64748b' }}>Display Mode:</span>
            <div className="inline-flex rounded-lg border p-0.5" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <span 
                className="px-2.5 py-0.5 font-bold rounded border"
                style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
              >
                Monthly (Bar)
              </span>
              <span 
                className="px-2.5 py-0.5 font-bold rounded border ml-1"
                style={{ backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
              >
                Cumulative (Line)
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-5 text-[9.5px] font-bold px-2">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider text-[8px] font-black" style={{ color: '#94a3b8' }}>Monthly Bars:</span>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: config.colorPlan }} />
              <span style={{ color: '#475569' }}>{baselinePlan.toUpperCase()} Plan</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: config.colorAch }} />
              <span style={{ color: '#475569' }}>Actual</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l pl-4" style={{ borderColor: '#e2e8f0' }}>
            <span className="uppercase tracking-wider text-[8px] font-black" style={{ color: '#94a3b8' }}>S-Curve Lines:</span>
            <div className="flex items-center space-x-1">
              <span className="inline-block w-4 h-0.5 border-t-2 border-solid" style={{ borderColor: config.colorPlan }} />
              <span style={{ color: '#475569' }}>Cum {baselinePlan.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="inline-block w-4 h-0.5 border-t-2 border-solid" style={{ borderColor: config.colorAch }} />
              <span style={{ color: '#475569' }}>Cum Actual</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart Canvas */}
        <div className="h-[430px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyData}
              margin={{ top: 20, right: 35, left: -5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={9.5} fontWeight={700} tickLine={false} dy={5} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={9.5} fontWeight={700} tickLine={false} tickFormatter={(v) => formatValue(v, config.isCurrency)} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={9.5} fontWeight={700} tickLine={false} tickFormatter={(v) => formatValue(v, config.isCurrency)} />

              <Bar yAxisId="left" dataKey="Plan" name="Plan" fill={config.colorPlan} radius={[3, 3, 0, 0]} maxBarSize={22}>
                <LabelList dataKey="Plan" content={renderBarPlanLabel} />
              </Bar>
              <Bar yAxisId="left" dataKey="Achievement" name="Actual" fill={config.colorAch} radius={[3, 3, 0, 0]} maxBarSize={22}>
                <LabelList dataKey="Achievement" content={renderBarAchLabel} />
              </Bar>

              <Line yAxisId="right" type="monotone" dataKey="CumPlan" name="Cum Plan" stroke={config.colorPlan} strokeWidth={2.5} dot={false}>
                <LabelList dataKey="CumPlan" content={renderCumPlanLineLabel} />
              </Line>
              <Line yAxisId="right" type="monotone" dataKey="CumAchievement" name="Cum Actual" stroke={config.colorAch} strokeWidth={3} dot={{ r: 3.5, fill: config.colorAch }}>
                <LabelList dataKey="CumAchievement" content={renderCumAchLineLabel} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
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

            const statusColor = p.status === 'Green' ? '#10b981' : p.status === 'Amber' ? '#f59e0b' : p.status === 'Red' ? '#f43f5e' : '#94a3b8';
            const statusBg = p.status === 'Green' ? '#ecfdf5' : p.status === 'Amber' ? '#fffbeb' : p.status === 'Red' ? '#fff1f2' : '#f8fafc';
            const statusText = p.status === 'Green' ? '#047857' : p.status === 'Amber' ? '#b45309' : p.status === 'Red' ? '#be123c' : '#475569';

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
                    <span className="font-black" style={{ color: '#1e293b' }}>{p.baseline1Finish || p.baselineFinish || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center" style={{ color: '#475569' }}>
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-2.5 h-2.5" style={{ color: '#94a3b8' }} />
                      Proposed Finish:
                    </span>
                    <span className="font-black" style={{ color: '#1e293b' }}>{p.proposedFinish || p.targetDate || 'N/A'}</span>
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
