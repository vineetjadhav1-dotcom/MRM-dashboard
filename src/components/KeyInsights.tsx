import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Project, Software2Project, FiscalYearKey } from '@/src/types';
import { useFilter } from '@/src/context/FilterContext';
import { isTempProject } from '@/src/utils/customOrder';
import { getFiscalYearConfig, getStoredFiscalYear } from '@/src/utils/fiscalYear';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area,
  AreaChart
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Users, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight, 
  Calendar, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Award,
  Layers,
  RotateCcw,
  Sliders,
  Check,
  BarChart3,
  Lightbulb
} from 'lucide-react';

interface KeyInsightsProps {
  projects: Software2Project[];
  allProjects?: Project[];
  onSelectProject?: (proj: Project | Software2Project) => void;
}

type MetricType = 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc';
type ForecastScenario = 'all' | 'optimistic' | 'mostLikely' | 'pessimistic';

const METRIC_CONFIGS: Record<MetricType, {
  label: string;
  fullName: string;
  unit: string;
  color: string;
  colorAch: string;
  colorOpt: string;
  colorLikely: string;
  colorPess: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}> = {
  vowd: {
    label: 'VOWD',
    fullName: 'Value of Work Done (VOWD)',
    unit: '₹ Cr.',
    color: '#3b82f6',
    colorAch: '#1d4ed8',
    colorOpt: '#10b981',
    colorLikely: '#4f46e5',
    colorPess: '#f43f5e',
    bgLight: 'bg-blue-50/40',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    description: 'Financial billing and revenue realization against construction milestones'
  },
  milestone: {
    label: 'Milestones',
    fullName: 'Key Milestone Deliveries',
    unit: 'Nos.',
    color: '#10b981',
    colorAch: '#047857',
    colorOpt: '#059669',
    colorLikely: '#0284c7',
    colorPess: '#e11d48',
    bgLight: 'bg-emerald-50/40',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    description: 'Critical path scheduled engineering and execution milestones'
  },
  labour: {
    label: 'Labour',
    fullName: 'Active Labour Deployment',
    unit: 'Labours',
    color: '#8b5cf6',
    colorAch: '#6d28d9',
    colorOpt: '#10b981',
    colorLikely: '#7c3aed',
    colorPess: '#ea580c',
    bgLight: 'bg-purple-50/40',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    description: 'Site manpower mobilization and subcontractor headcount strength'
  },
  ur: {
    label: 'Residential (UR)',
    fullName: 'Residential Units Delivery (UR)',
    unit: 'Units',
    color: '#f97316',
    colorAch: '#c2410c',
    colorOpt: '#10b981',
    colorLikely: '#ea580c',
    colorPess: '#e11d48',
    bgLight: 'bg-orange-50/40',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    description: 'Residential apartments handed over and certified for occupation'
  },
  uc: {
    label: 'Commercial (UC)',
    fullName: 'Commercial Units Delivery (UC)',
    unit: 'Sqft',
    color: '#d97706',
    colorAch: '#b45309',
    colorOpt: '#10b981',
    colorLikely: '#d97706',
    colorPess: '#e11d48',
    bgLight: 'bg-amber-50/40',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    description: 'Commercial offices, retail spaces and corporate floorplates delivered'
  }
};

export default function KeyInsights({
  projects = [],
  allProjects = [],
  onSelectProject
}: KeyInsightsProps) {
  const [activeFy, setActiveFy] = useState<FiscalYearKey>(() => getStoredFiscalYear());

  useEffect(() => {
    const handleFyChanged = () => setActiveFy(getStoredFiscalYear());
    window.addEventListener('mrm-fiscal-year-changed', handleFyChanged);
    return () => window.removeEventListener('mrm-fiscal-year-changed', handleFyChanged);
  }, []);

  const fyConfig = useMemo(() => getFiscalYearConfig(activeFy), [activeFy]);
  const FY_MONTHS = useMemo(() => fyConfig.months.map(m => m.key), [fyConfig]);

  // 3 Layers of Filter States from global FilterContext
  const {
    selectedVP,
    setSelectedVP,
    selectedLeader,
    setSelectedLeader,
    selectedProjectCode,
    setSelectedProjectCode,
    insightsMetric: activeMetric,
    setInsightsMetric: setActiveMetric,
    insightsScenario: forecastScenario,
    setInsightsScenario: setForecastScenario
  } = useFilter();
  const [selectedPlanType, setSelectedPlanType] = useState<'r1' | 'r0'>('r1');

  // Searchable project dropdown state
  const [isProjectComboboxOpen, setIsProjectComboboxOpen] = useState<boolean>(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const projectComboboxRef = useRef<HTMLDivElement | null>(null);

  // Close combobox on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectComboboxRef.current && !projectComboboxRef.current.contains(e.target as Node)) {
        setIsProjectComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Determine Unique Lists for 3 Layers
  const vpList = useMemo(() => {
    const vps = new Set<string>();
    projects.forEach(p => {
      if (!isTempProject(p.code) && p.vp) vps.add(String(p.vp).trim());
    });
    return Array.from(vps).sort();
  }, [projects]);

  const leaderList = useMemo(() => {
    const leaders = new Set<string>();
    projects.forEach(p => {
      if (isTempProject(p.code)) return;
      const matchVP = selectedVP === 'all' || (p.vp && String(p.vp).trim() === selectedVP);
      if (matchVP && p.leader) {
        leaders.add(String(p.leader).trim());
      }
    });
    return Array.from(leaders).sort();
  }, [projects, selectedVP]);

  const projectList = useMemo(() => {
    return projects.filter(p => {
      if (isTempProject(p.code)) return false;
      const matchVP = selectedVP === 'all' || (p.vp && String(p.vp).trim() === selectedVP);
      const matchLeader = selectedLeader === 'all' || (p.leader && String(p.leader).trim() === selectedLeader);
      return matchVP && matchLeader;
    }).sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));
  }, [projects, selectedVP, selectedLeader]);

  // Handle Cascaded Filter Changes
  const handleVPChange = (vp: string) => {
    setSelectedVP(vp);
    setSelectedLeader('all');
    setSelectedProjectCode('all');
  };

  const handleLeaderChange = (leader: string) => {
    setSelectedLeader(leader);
    setSelectedProjectCode('all');
  };

  const handleResetFilters = () => {
    setSelectedVP('all');
    setSelectedLeader('all');
    setSelectedProjectCode('all');
    setProjectSearchTerm('');
  };

  // Selected Scope Projects
  const scopedProjects = useMemo(() => {
    return projects.filter(p => {
      if (isTempProject(p.code)) return false;
      const matchVP = selectedVP === 'all' || (p.vp && String(p.vp).trim() === selectedVP);
      const matchLeader = selectedLeader === 'all' || (p.leader && String(p.leader).trim() === selectedLeader);
      const matchProject = selectedProjectCode === 'all' || (p.code && String(p.code).trim() === selectedProjectCode);
      return matchVP && matchLeader && matchProject;
    });
  }, [projects, selectedVP, selectedLeader, selectedProjectCode]);

  // Find single selected project metadata if active
  const activeSingleProject = useMemo(() => {
    if (selectedProjectCode === 'all') return null;
    return projects.find(p => p.code === selectedProjectCode) || null;
  }, [projects, selectedProjectCode]);

  const activeSingleProjectS1 = useMemo(() => {
    if (!activeSingleProject) return null;
    return allProjects.find(p => 
      (p.code && p.code.toLowerCase() === activeSingleProject.code.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === activeSingleProject.name.toLowerCase())
    ) || null;
  }, [allProjects, activeSingleProject]);

  // 2. Determine Last Completed Month Index (e.g. Jul-26 or Aug-26)
  const lastCompletedMonthIndex = useMemo(() => {
    let maxIdx = -1;
    projects.forEach(s2 => {
      const metricLists = [s2.vowd, s2.milestone, s2.labour, s2.ur, s2.uc];
      metricLists.forEach(list => {
        if (list && Array.isArray(list)) {
          list.forEach(m => {
            const idx = FY_MONTHS.indexOf(m.month);
            if (idx !== -1 && m.achievement !== undefined && m.achievement !== null && m.achievement > 0) {
              if (idx > maxIdx) maxIdx = idx;
            }
          });
        }
      });
    });
    return maxIdx >= 0 ? maxIdx : 3; // default fallback to Jul-26 (index 3)
  }, [projects]);

  const lastCompletedMonthName = FY_MONTHS[lastCompletedMonthIndex] || 'Jul-26';
  const completedMonthKeys = useMemo(() => FY_MONTHS.slice(0, lastCompletedMonthIndex + 1), [lastCompletedMonthIndex]);
  const remainingMonthKeys = useMemo(() => FY_MONTHS.slice(lastCompletedMonthIndex + 1), [lastCompletedMonthIndex]);
  const completedCount = completedMonthKeys.length;
  const remainingCount = remainingMonthKeys.length;

  // 3. Compute Aggregated Monthly Time Series for Current Active Metric
  const aggregatedMonthlyData = useMemo(() => {
    let cumPlan = 0;
    let cumAch = 0;

    return FY_MONTHS.map((monthKey, idx) => {
      const isCompleted = idx <= lastCompletedMonthIndex;
      let monthPlanR0 = 0;
      let monthPlanR1 = 0;
      let monthAch = 0;

      scopedProjects.forEach(p => {
        const metricList = p[activeMetric];
        if (metricList && Array.isArray(metricList)) {
          const item = metricList.find(m => m.month === monthKey);
          if (item) {
            const pR0 = item.planR0 !== undefined ? item.planR0 : (item.plan ?? 0);
            const pR1 = item.planR1 !== undefined ? item.planR1 : pR0;
            monthPlanR0 += Number(pR0) || 0;
            monthPlanR1 += Number(pR1) || 0;
            if (isCompleted && item.achievement !== undefined && item.achievement !== null) {
              monthAch += Number(item.achievement) || 0;
            }
          }
        }
      });

      const selectedPlan = selectedPlanType === 'r0' ? monthPlanR0 : monthPlanR1;
      cumPlan += selectedPlan;
      
      let actualAchValue: number | null = null;
      let actualAchPct: number | null = null;

      if (isCompleted) {
        cumAch += monthAch;
        actualAchValue = Math.round(monthAch * 10) / 10;
        actualAchPct = selectedPlan > 0 ? Math.round((monthAch / selectedPlan) * 100) : 100;
      }

      const cumPct = (isCompleted && cumPlan > 0) ? Math.round((cumAch / cumPlan) * 100) : null;

      return {
        month: monthKey,
        monthIndex: idx,
        isCompleted,
        plan: Math.round(selectedPlan * 10) / 10,
        planR0: Math.round(monthPlanR0 * 10) / 10,
        planR1: Math.round(monthPlanR1 * 10) / 10,
        actual: actualAchValue,
        actualPct: actualAchPct,
        cumPlan: Math.round(cumPlan * 10) / 10,
        cumActual: isCompleted ? Math.round(cumAch * 10) / 10 : null,
        cumPct
      };
    });
  }, [scopedProjects, activeMetric, selectedPlanType, lastCompletedMonthIndex]);

  // 4. Performance to Date Summary Metrics
  const performanceToDate = useMemo(() => {
    const lastRow = aggregatedMonthlyData[lastCompletedMonthIndex];
    const totalCumPlanToDate = lastRow ? lastRow.cumPlan : 0;
    const totalCumAchToDate = lastRow && lastRow.cumActual !== null ? lastRow.cumActual : 0;
    const fullYearTarget = aggregatedMonthlyData[aggregatedMonthlyData.length - 1]?.cumPlan || 0;

    const achPctToDate = totalCumPlanToDate > 0 ? (totalCumAchToDate / totalCumPlanToDate) * 100 : 100;
    const varianceToDate = totalCumAchToDate - totalCumPlanToDate;
    const shortfallGap = Math.max(0, totalCumPlanToDate - totalCumAchToDate);

    const remainingTarget = Math.max(0, fullYearTarget - totalCumAchToDate);
    const historicalMonthlyRunRate = completedCount > 0 ? totalCumAchToDate / completedCount : 0;
    const requiredMonthlyRunRate = remainingCount > 0 ? remainingTarget / remainingCount : 0;
    const velocityMultiplier = historicalMonthlyRunRate > 0 
      ? (requiredMonthlyRunRate / historicalMonthlyRunRate) 
      : 1.0;

    // Health Rating
    let healthStatus: 'healthy' | 'moderate' | 'critical' = 'healthy';
    if (achPctToDate < 75 || shortfallGap > (totalCumPlanToDate * 0.2)) {
      healthStatus = 'critical';
    } else if (achPctToDate < 90) {
      healthStatus = 'moderate';
    }

    return {
      totalCumPlanToDate: Math.round(totalCumPlanToDate * 10) / 10,
      totalCumAchToDate: Math.round(totalCumAchToDate * 10) / 10,
      fullYearTarget: Math.round(fullYearTarget * 10) / 10,
      achPctToDate: Math.round(achPctToDate * 10) / 10,
      varianceToDate: Math.round(varianceToDate * 10) / 10,
      shortfallGap: Math.round(shortfallGap * 10) / 10,
      remainingTarget: Math.round(remainingTarget * 10) / 10,
      historicalMonthlyRunRate: Math.round(historicalMonthlyRunRate * 10) / 10,
      requiredMonthlyRunRate: Math.round(requiredMonthlyRunRate * 10) / 10,
      velocityMultiplier: Math.round(velocityMultiplier * 100) / 100,
      healthStatus
    };
  }, [aggregatedMonthlyData, lastCompletedMonthIndex, completedCount, remainingCount]);

  // 5. 3-Scenario Forecasting Engine for Remaining Months (Till March 2027)
  const forecastSeries = useMemo(() => {
    const { totalCumAchToDate, requiredMonthlyRunRate, historicalMonthlyRunRate, fullYearTarget } = performanceToDate;
    
    let cumOptimistic = totalCumAchToDate;
    let cumMostLikely = totalCumAchToDate;
    let cumPessimistic = totalCumAchToDate;

    return aggregatedMonthlyData.map((row, idx) => {
      if (row.isCompleted) {
        return {
          ...row,
          forecastOpt: null,
          forecastLikely: null,
          forecastPess: null,
          cumForecastOpt: row.cumActual,
          cumForecastLikely: row.cumActual,
          cumForecastPess: row.cumActual
        };
      }

      // Projections for remaining months:
      // 1. Optimistic: Required Run Rate * 1.15 (Accelerated Recovery with resource augmentation)
      const optMonthly = Math.round(Math.max(row.plan * 1.1, requiredMonthlyRunRate * 1.12) * 10) / 10;
      cumOptimistic = Math.round((cumOptimistic + optMonthly) * 10) / 10;

      // 2. Most Likely: Planned Target * 1.0 (Delivers as planned from now onwards)
      const likelyMonthly = Math.round(row.plan * 10) / 10;
      cumMostLikely = Math.round((cumMostLikely + likelyMonthly) * 10) / 10;

      // 3. Pessimistic: Historical trailing rate * 0.85 (Lingering bottlenecks continue)
      const pessMonthly = Math.round(Math.max(row.plan * 0.75, historicalMonthlyRunRate * 0.85) * 10) / 10;
      cumPessimistic = Math.round((cumPessimistic + pessMonthly) * 10) / 10;

      return {
        ...row,
        forecastOpt: optMonthly,
        forecastLikely: likelyMonthly,
        forecastPess: pessMonthly,
        cumForecastOpt: cumOptimistic,
        cumForecastLikely: cumMostLikely,
        cumForecastPess: cumPessimistic
      };
    });
  }, [aggregatedMonthlyData, performanceToDate]);

  // Projected Year-End March 2027 Totals
  const yearEndProjections = useMemo(() => {
    const lastForecast = forecastSeries[forecastSeries.length - 1];
    const target = performanceToDate.fullYearTarget;

    const optTotal = lastForecast?.cumForecastOpt || 0;
    const likelyTotal = lastForecast?.cumForecastLikely || 0;
    const pessTotal = lastForecast?.cumForecastPess || 0;

    return {
      optimistic: {
        total: optTotal,
        pct: target > 0 ? Math.round((optTotal / target) * 100) : 100,
        gap: Math.round((optTotal - target) * 10) / 10,
        confidence: 'High Potential with Contractor Augmentation'
      },
      mostLikely: {
        total: likelyTotal,
        pct: target > 0 ? Math.round((likelyTotal / target) * 100) : 100,
        gap: Math.round((likelyTotal - target) * 10) / 10,
        confidence: 'Expected Baseline Pace'
      },
      pessimistic: {
        total: pessTotal,
        pct: target > 0 ? Math.round((pessTotal / target) * 100) : 100,
        gap: Math.round((pessTotal - target) * 10) / 10,
        confidence: 'Bottleneck Risk (Action Required)'
      }
    };
  }, [forecastSeries, performanceToDate.fullYearTarget]);

  // Custom Chart Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs backdrop-blur-md space-y-2 min-w-[200px]">
        <div className="font-bold border-b border-slate-800 pb-1.5 flex justify-between items-center text-slate-300">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeMetric === 'vowd' ? '₹ Cr.' : METRIC_CONFIGS[activeMetric].unit}
          </span>
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, i: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            const formattedNum = typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value;
            const displayVal = activeMetric === 'vowd' ? `₹ ${formattedNum} Cr.` : `${formattedNum} ${METRIC_CONFIGS[activeMetric].unit}`;
            return (
              <div key={i} className="flex justify-between items-center text-[11px] gap-3">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-bold font-mono text-slate-100">
                  {displayVal}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Data label renderer for Last Completed Month & Last Month (e.g. Mar 27)
  const renderPointDataLabel = (props: any, labelType: 'actual' | 'plan' | 'opt' | 'likely' | 'pess') => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || isNaN(value)) return null;

    const isLastCompleted = index === lastCompletedMonthIndex;
    const isLastMonth = index === forecastSeries.length - 1;

    let shouldShow = false;
    let labelPrefix = '';
    let bgColor = '#1e293b';
    let textColor = '#ffffff';
    let yOffset = -22;

    if (labelType === 'actual' && isLastCompleted) {
      shouldShow = true;
      labelPrefix = 'Actual: ';
      bgColor = currentCfg.colorAch;
      textColor = '#ffffff';
      yOffset = -22;
    } else if (labelType === 'plan') {
      if (isLastCompleted) {
        shouldShow = true;
        labelPrefix = 'Plan: ';
        bgColor = '#475569';
        textColor = '#ffffff';
        yOffset = 18;
      } else if (isLastMonth) {
        shouldShow = true;
        labelPrefix = 'Target: ';
        bgColor = '#334155';
        textColor = '#ffffff';
        yOffset = -22;
      }
    } else if (labelType === 'opt' && isLastMonth) {
      shouldShow = true;
      labelPrefix = 'Opt: ';
      bgColor = '#059669';
      textColor = '#ffffff';
      yOffset = -38;
    } else if (labelType === 'likely' && isLastMonth) {
      shouldShow = true;
      labelPrefix = 'Likely: ';
      bgColor = '#4338ca';
      textColor = '#ffffff';
      yOffset = -22;
    } else if (labelType === 'pess' && isLastMonth) {
      shouldShow = true;
      labelPrefix = 'Pess: ';
      bgColor = '#e11d48';
      textColor = '#ffffff';
      yOffset = 18;
    }

    if (!shouldShow) return null;

    const formattedVal = typeof value === 'number' 
      ? (value >= 100 ? Math.round(value).toLocaleString() : Number(value.toFixed(1)).toLocaleString())
      : value;
    const textStr = activeMetric === 'vowd'
      ? `${labelPrefix}₹ ${formattedVal} Cr.`
      : `${labelPrefix}${formattedVal}`;
    const boxWidth = Math.max(textStr.length * 6.5 + 14, 58);

    return (
      <g className="animate-in fade-in duration-150">
        <rect
          x={x - boxWidth / 2}
          y={y + yOffset}
          width={boxWidth}
          height={18}
          rx={5}
          fill={bgColor}
          stroke="#ffffff"
          strokeWidth={1.5}
        />
        <text
          x={x}
          y={y + yOffset + 12.5}
          fill={textColor}
          textAnchor="middle"
          fontSize={9.5}
          fontWeight={900}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {textStr}
        </text>
      </g>
    );
  };

  const currentCfg = METRIC_CONFIGS[activeMetric];

  // Metric value formatting helper ensuring VOWD is always ₹ Value Cr.
  const formatMetricVal = (val: number | undefined | null, suffix = ''): string => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const formatted = val % 1 === 0 ? val.toLocaleString() : (val >= 100 ? Math.round(val).toLocaleString() : val.toFixed(1));
    if (activeMetric === 'vowd') {
      return `₹ ${formatted} Cr.${suffix ? ` ${suffix}` : ''}`;
    }
    return `${formatted} ${currentCfg.unit}${suffix ? ` ${suffix}` : ''}`;
  };

  return (
    <div className="space-y-6 font-sans" id="key-insights-root-container">
      
      {/* 1. Header Banner - Uniform Light Grey Block */}
      <div className="bg-slate-100/80 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" id="key-insights-header-banner">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl shadow-2xs shrink-0">
            <Lightbulb className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Key Insights &amp; Delivery Forecast
              </h2>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                Multi-Tier Analysis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
              Drill down by <span className="font-semibold text-slate-700">VP, General Manager/Leader, and Project</span> to analyze all Software 2 deliverable parameters, evaluate performance gaps to date, and forecast execution scenarios till <span className="font-bold text-slate-700">March 2027</span>.
            </p>
          </div>
        </div>

        {/* Evaluation Period Summary Pill */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-2xl shrink-0 shadow-2xs">
          <div className="px-3 py-1 bg-slate-50 rounded-xl border border-slate-150 text-center">
            <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Completed Horizon</span>
            <span className="text-xs font-black text-indigo-700 block">Apr 2026 – {lastCompletedMonthName}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="px-3 py-1 bg-slate-50 rounded-xl border border-slate-150 text-center">
            <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Forecast Horizon</span>
            <span className="text-xs font-black text-emerald-700 block">{remainingMonthKeys[0]} – Mar 2027</span>
          </div>
        </div>
      </div>



      {/* 3. PARAMETER SELECTOR TABS (5 Software 2 Deliverables) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" id="key-insights-parameter-tabs">
        {(['vowd', 'milestone', 'labour', 'ur', 'uc'] as MetricType[]).map(metricKey => {
          const cfg = METRIC_CONFIGS[metricKey];
          const isSelected = activeMetric === metricKey;
          return (
            <div
              key={metricKey}
              onClick={() => setActiveMetric(metricKey)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected 
                  ? 'bg-white ring-2 ring-indigo-600 border-indigo-300 shadow-md shadow-indigo-600/10' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                  {cfg.label}
                </span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block truncate">{cfg.fullName}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Unit: {cfg.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. PERFORMANCE TO DATE & REMAINING TARGET DIAGNOSIS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="key-insights-performance-grid">
        
        {/* Card 1: Performance To Date (Apr 2026 to Last Completed Month) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Performance To Date</span>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span>Apr 2026 – {lastCompletedMonthName}</span>
                </h4>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                performanceToDate.healthStatus === 'healthy' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                performanceToDate.healthStatus === 'moderate' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {performanceToDate.healthStatus === 'healthy' ? '🟢 On Track' :
                 performanceToDate.healthStatus === 'moderate' ? '🟡 Moderate Lag' :
                 '🔴 Critical Gap'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plan to Date</span>
                <span className="text-lg font-black text-slate-900 block mt-0.5">
                  {formatMetricVal(performanceToDate.totalCumPlanToDate)}
                </span>
              </div>
              <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Actual Achieved</span>
                <span className="text-lg font-black text-indigo-900 block mt-0.5">
                  {formatMetricVal(performanceToDate.totalCumAchToDate)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-150 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Achievement Rate:</span>
                <span className={`font-black text-sm ${
                  performanceToDate.achPctToDate >= 90 ? 'text-emerald-600' :
                  performanceToDate.achPctToDate >= 75 ? 'text-amber-600' :
                  'text-rose-600'
                }`}>
                  {performanceToDate.achPctToDate}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Shortfall Deficit:</span>
                <span className={`font-extrabold ${performanceToDate.shortfallGap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {performanceToDate.shortfallGap > 0 
                    ? `- ${formatMetricVal(performanceToDate.shortfallGap)}` 
                    : 'Zero Shortfall (On Track)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Avg Monthly Run-Rate:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatMetricVal(performanceToDate.historicalMonthlyRunRate, '/mo')}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            Diagnosis: From {fyConfig.startMonthKey} to {lastCompletedMonthName}, {scopedProjects.length} scoped project(s) achieved {performanceToDate.achPctToDate}% of cumulative baseline deliverables.
          </p>
        </div>

        {/* Card 2: How to Achieve Remaining Target (Run-Rate & Acceleration Multiplier) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Target Recovery Roadmap</span>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span>How to Achieve Target ({fyConfig.endMonthKey})</span>
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                {remainingCount} Months Left
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Year FY Target</span>
                <span className="text-lg font-black text-slate-900 block mt-0.5">
                  {formatMetricVal(performanceToDate.fullYearTarget)}
                </span>
              </div>
              <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Remaining Target</span>
                <span className="text-lg font-black text-purple-900 block mt-0.5">
                  {formatMetricVal(performanceToDate.remainingTarget)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm space-y-2.5">
              <div className="flex justify-between items-center text-xs border-b border-indigo-900/60 pb-2">
                <span className="text-slate-300 font-bold">Required Monthly Run-Rate:</span>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  {formatMetricVal(performanceToDate.requiredMonthlyRunRate, '/mo')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Required Acceleration Pace:</span>
                <span className={`font-black text-sm px-2 py-0.5 rounded-md ${
                  performanceToDate.velocityMultiplier <= 1.05 ? 'bg-emerald-900 text-emerald-200' :
                  performanceToDate.velocityMultiplier <= 1.3 ? 'bg-amber-900 text-amber-200' :
                  'bg-rose-900 text-rose-200'
                }`}>
                  {performanceToDate.velocityMultiplier}x Velocity
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-1">
            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider block">Strategic Recovery Action</span>
            <p className="text-[11px] text-slate-700 leading-snug">
              {performanceToDate.velocityMultiplier > 1.2
                ? `Deploy additional subcontracting manpower fronts and expedite billing certification logs to sustain ${formatMetricVal(performanceToDate.requiredMonthlyRunRate, '/mo')}.`
                : `Maintain disciplined weekly micro-schedule milestones to achieve the remaining ${formatMetricVal(performanceToDate.remainingTarget)} target by March 2027.`}
            </p>
          </div>
        </div>

        {/* Card 3: Year-End March 2027 Scenario Projected Outcomes */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Year-End Forecast</span>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span>Projected March 2027 Outcomes</span>
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                3 Scenarios
              </span>
            </div>

            <div className="space-y-3 mt-4">
              
              {/* Optimistic */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Optimistic</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 mt-0.5 block">Accelerated Run-Rate</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-900 block font-mono">
                    {formatMetricVal(yearEndProjections.optimistic.total)}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-600 block">
                    {yearEndProjections.optimistic.pct}% of Target
                  </span>
                </div>
              </div>

              {/* Most Likely */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-black text-blue-950 uppercase tracking-wider">Most Likely</span>
                  </div>
                  <span className="text-[10px] text-blue-700 mt-0.5 block">Standard Baseline Pace</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-blue-900 block font-mono">
                    {formatMetricVal(yearEndProjections.mostLikely.total)}
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-600 block">
                    {yearEndProjections.mostLikely.pct}% of Target
                  </span>
                </div>
              </div>

              {/* Pessimistic */}
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span className="text-xs font-black text-rose-950 uppercase tracking-wider">Pessimistic</span>
                  </div>
                  <span className="text-[10px] text-rose-700 mt-0.5 block">Trailing Velocity Drag</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-rose-900 block font-mono">
                    {formatMetricVal(yearEndProjections.pessimistic.total)}
                  </span>
                  <span className="text-[10px] font-extrabold text-rose-600 block">
                    {yearEndProjections.pessimistic.pct}% of Target
                  </span>
                </div>
              </div>

            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-semibold block text-center">
            Confidence intervals computed from historical completed run-rates and baseline deliverables.
          </span>
        </div>

      </div>

      {/* 5. VISUAL FORECAST CHART (ACTUAL + 3-SCENARIO S-CURVES THROUGH MARCH 2027) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4" id="key-insights-forecast-chart">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {currentCfg.fullName} — {fyConfig.label} Forecast Projection Curves
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Solid line represents completed monthly actuals; dashed trajectories project the 3 scenarios through {fyConfig.endMonthKey}
            </p>
          </div>

          {/* Scenario Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl">
            {(['all', 'optimistic', 'mostLikely', 'pessimistic'] as ForecastScenario[]).map(sc => (
              <button
                key={sc}
                onClick={() => setForecastScenario(sc)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  forecastScenario === sc 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {sc === 'all' ? 'All Scenarios' :
                 sc === 'optimistic' ? 'Optimistic' :
                 sc === 'mostLikely' ? 'Most Likely' : 'Pessimistic'}
              </button>
            ))}
          </div>
        </div>

        {/* Composed Chart Container */}
        <div className="h-[360px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastSeries} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight={600}
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${val.toLocaleString()}`}
              />
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />

              {/* Monthly Plan Bar */}
              <Bar 
                dataKey="plan" 
                name="Monthly Baseline Plan" 
                fill="#cbd5e1" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={20}
              />

              {/* Cumulative Plan Baseline */}
              <Line
                type="monotone"
                dataKey="cumPlan"
                name="Cumulative Plan Target"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#64748b' }}
                label={(props) => renderPointDataLabel(props, 'plan')}
              />

              {/* Completed Actual Cumulative S-Curve */}
              <Line
                type="monotone"
                dataKey="cumActual"
                name="Actual Achieved to Date"
                stroke={currentCfg.colorAch}
                strokeWidth={3.5}
                dot={{ r: 5, fill: currentCfg.colorAch }}
                label={(props) => renderPointDataLabel(props, 'actual')}
              />

              {/* Optimistic Scenario Curve */}
              {(forecastScenario === 'all' || forecastScenario === 'optimistic') && (
                <Line
                  type="monotone"
                  dataKey="cumForecastOpt"
                  name="Optimistic Projection (115%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#10b981' }}
                  label={(props) => renderPointDataLabel(props, 'opt')}
                />
              )}

              {/* Most Likely Scenario Curve */}
              {(forecastScenario === 'all' || forecastScenario === 'mostLikely') && (
                <Line
                  type="monotone"
                  dataKey="cumForecastLikely"
                  name="Most Likely Projection (100%)"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#4f46e5' }}
                  label={(props) => renderPointDataLabel(props, 'likely')}
                />
              )}

              {/* Pessimistic Scenario Curve */}
              {(forecastScenario === 'all' || forecastScenario === 'pessimistic') && (
                <Line
                  type="monotone"
                  dataKey="cumForecastPess"
                  name="Pessimistic Projection (75%)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#f43f5e' }}
                  label={(props) => renderPointDataLabel(props, 'pess')}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. MONTH-BY-MONTH FORECAST NUMERICAL TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4" id="key-insights-month-table">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Month-by-Month Forecast Table — {fyConfig.label}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Completed actual achievements vs 3 scenario monthly projections through {fyConfig.endMonthKey}
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold">
            Unit: {currentCfg.unit}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-y border-slate-200">
                <th className="py-3 px-3 text-center">Month</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Plan Target</th>
                <th className="py-3 px-3 text-center text-indigo-700">Actual Achieved</th>
                <th className="py-3 px-3 text-center">Ach %</th>
                <th className="py-3 px-3 text-center text-emerald-700">Optimistic</th>
                <th className="py-3 px-3 text-center text-blue-700">Most Likely</th>
                <th className="py-3 px-3 text-center text-rose-700">Pessimistic</th>
                <th className="py-3 px-3 text-center font-black">Cum Plan</th>
                <th className="py-3 px-3 text-center font-black text-indigo-900">Cum Projected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
              {forecastSeries.map((row, idx) => {
                const isCompleted = row.isCompleted;
                const cumProjectedVal = isCompleted 
                  ? row.cumActual 
                  : forecastScenario === 'optimistic' ? row.cumForecastOpt :
                    forecastScenario === 'pessimistic' ? row.cumForecastPess :
                    row.cumForecastLikely;

                return (
                  <tr key={row.month} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 font-bold text-slate-900 text-center">{row.month}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isCompleted ? 'Completed' : 'Forecast'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{row.plan.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                      {isCompleted ? row.actual?.toLocaleString() : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {isCompleted ? (
                        <span className={row.actualPct !== null && row.actualPct >= 90 ? 'text-emerald-600' : row.actualPct !== null && row.actualPct >= 75 ? 'text-amber-600' : 'text-rose-600'}>
                          {row.actualPct}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                      {isCompleted ? row.actual?.toLocaleString() : row.forecastOpt?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                      {isCompleted ? row.actual?.toLocaleString() : row.forecastLikely?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                      {isCompleted ? row.actual?.toLocaleString() : row.forecastPess?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900">{row.cumPlan.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center font-black font-mono text-indigo-900">
                      {cumProjectedVal?.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
