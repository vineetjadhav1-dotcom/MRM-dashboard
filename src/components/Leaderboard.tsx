import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Project, Software2Project, VPData, LeaderData, FiscalYearKey } from '@/src/types';
import { useFilter } from '@/src/context/FilterContext';
import { isTempProject } from '@/src/utils/customOrder';
import { getFiscalYearConfig, getStoredFiscalYear } from '@/src/utils/fiscalYear';
import { isUnderConstructionStage } from '@/src/utils/sheetParser';
import { 
  Trophy, 
  Award, 
  Medal, 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Calendar, 
  Home, 
  Briefcase, 
  DollarSign, 
  Activity, 
  Filter, 
  Download, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Gauge,
  Clock
} from 'lucide-react';

interface LeaderboardProps {
  projects: Project[];
  software2Projects?: Software2Project[];
  vpData?: VPData[];
  leaderData?: LeaderData[];
  onSelectProject?: (proj: Project) => void;
}

type LeaderboardCategory = 'VP' | 'LEADER' | 'PROJECTS';

interface LeaderboardRow {
  id: string;
  name: string;
  subTitle?: string;
  badge?: string;
  projectCount: number;
  
  // 1. VOWD (Cr.)
  vowdPlan: number;
  vowdAch: number;
  vowdPct: number;

  // 2. Milestone (Qty)
  milestonePlan: number;
  milestoneAch: number;
  milestonePct: number;

  // 3. Labour (Workers)
  labourPlan: number;
  labourAch: number;
  labourPct: number;

  // 4. Residential UR (Units)
  urPlan: number;
  urAch: number;
  urPct: number;

  // 5. Commercial UC (Units)
  ucPlan: number;
  ucAch: number;
  ucPct: number;

  // 6. Labour Productivity (₹ Lakh per Worker deployed)
  labourProductivity: number;

  // 7. Labour Efficiency (VOWD % Ach / Labour % Deployed ratio)
  labourEfficiency: number;

  // 8. Speed of Construction (Area Sqft run-rate / Month)
  speedOfConstruction: number;

  // 9. SPI (Average from selected start month to to month)
  avgSPI: number;

  // Composite Score for Ranking
  compositeScore: number;
  rank?: number;
  rawProject?: Project;
}

export default function Leaderboard({
  projects,
  software2Projects = [],
  vpData = [],
  leaderData = [],
  onSelectProject
}: LeaderboardProps) {
  const [activeFy, setActiveFy] = useState<FiscalYearKey>(() => getStoredFiscalYear());

  useEffect(() => {
    const handleFyChanged = () => setActiveFy(getStoredFiscalYear());
    window.addEventListener('mrm-fiscal-year-changed', handleFyChanged);
    return () => window.removeEventListener('mrm-fiscal-year-changed', handleFyChanged);
  }, []);

  const fyConfig = useMemo(() => getFiscalYearConfig(activeFy), [activeFy]);
  const FY_MONTHS = fyConfig.months;

  const {
    leaderboardCategory: activeCategory,
    setLeaderboardCategory: setActiveCategory,
    selectedVP,
    selectedLeader,
    searchQuery,
    setSearchQuery
  } = useFilter();
  const [sortField, setSortField] = useState<keyof LeaderboardRow>('compositeScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Month Range filter state: Default is Month 0 to Month 4
  const [startMonth, setStartMonth] = useState<string>(() => fyConfig.months[0]?.key || 'Apr-26');
  const [toMonth, setToMonth] = useState<string>(() => fyConfig.months[4]?.key || 'Aug-26');

  // Update default selected months if FY changes
  useEffect(() => {
    if (fyConfig.months.length >= 5) {
      setStartMonth(fyConfig.months[0].key);
      setToMonth(fyConfig.months[4].key);
    }
  }, [fyConfig]);

  // Compute active month keys within selected [startMonth, toMonth] range
  const activeMonthKeys = useMemo(() => {
    const sIdx = FY_MONTHS.findIndex(m => m.key === startMonth);
    const tIdx = FY_MONTHS.findIndex(m => m.key === toMonth);
    const min = Math.min(sIdx !== -1 ? sIdx : 0, tIdx !== -1 ? tIdx : 4);
    const max = Math.max(sIdx !== -1 ? sIdx : 0, tIdx !== -1 ? tIdx : 4);
    return FY_MONTHS.slice(min, max + 1).map(m => m.key);
  }, [startMonth, toMonth, FY_MONTHS]);

  const elapsedMonthsCount = Math.max(1, activeMonthKeys.length);

  // Helper to extract cumulative metrics for a project within selected month range
  const extractProjectMetrics = useCallback((p: Project) => {
    const s2 = software2Projects.find(
      s => (s.code && s.code.trim().toLowerCase() === p.code.trim().toLowerCase()) ||
           (s.name && s.name.trim().toLowerCase() === p.name.trim().toLowerCase())
    );

    const sumMetric = (metrics?: { month: string; plan: number; achievement: number }[]) => {
      if (!metrics || metrics.length === 0) return { plan: 0, ach: 0 };
      let plan = 0, ach = 0;
      metrics.forEach(m => {
        const mKey = String(m.month || '').trim();
        const matchesRange = activeMonthKeys.some(k => {
          const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          const mNorm = mKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          return mNorm.includes(kNorm.slice(0, 3));
        });
        if (matchesRange) {
          plan += Number(m.plan) || 0;
          ach += Number(m.achievement) || 0;
        }
      });
      return { plan, ach };
    };

    // VOWD
    let vowd = sumMetric(s2?.vowd);
    if (vowd.plan === 0 && p.vowdPlan) {
      const fullPlan = parseFloat(String(p.vowdPlan).replace(/,/g, '')) || 0;
      const fullAch = parseFloat(String(p.vowdAch).replace(/,/g, '')) || 0;
      // Scale by month range if single-snapshot provided
      const ratio = elapsedMonthsCount / 12;
      vowd = {
        plan: Math.round(fullPlan * ratio * 100) / 100,
        ach: Math.round(fullAch * ratio * 100) / 100
      };
    }

    // Milestone
    let milestone = sumMetric(s2?.milestone);
    if (milestone.plan === 0 && p.milestonePlan) {
      const fullPlan = parseFloat(String(p.milestonePlan).replace(/,/g, '')) || 0;
      const fullAch = parseFloat(String(p.milestoneAch).replace(/,/g, '')) || 0;
      const ratio = elapsedMonthsCount / 12;
      milestone = {
        plan: Math.round(fullPlan * ratio),
        ach: Math.round(fullAch * ratio)
      };
    }

    // Labour
    let labour = sumMetric(s2?.labour);
    if (labour.plan === 0 && p.labourPlan) {
      labour = {
        plan: parseFloat(String(p.labourPlan).replace(/,/g, '')) || 0,
        ach: parseFloat(String(p.labourAch).replace(/,/g, '')) || 0
      };
    }

    // UR & UC
    const ur = sumMetric(s2?.ur);
    const uc = sumMetric(s2?.uc);

    // SPI (Average within selected month range)
    let spiSum = 0;
    let spiCount = 0;
    if (s2?.spiHistory && s2.spiHistory.length > 0) {
      s2.spiHistory.forEach(s => {
        const mKey = String(s.month || '').trim();
        const matchesRange = activeMonthKeys.some(k => {
          const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          const mNorm = mKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          return mNorm.includes(kNorm.slice(0, 3));
        });
        if (matchesRange) {
          const val = Number(s.achievement) || Number(s.plan) || 0;
          if (val > 0) {
            spiSum += val;
            spiCount++;
          }
        }
      });
    }
    const rawSpi = parseFloat(String(p.spi || s2?.spi || '1.0').replace(/,/g, '')) || 1.0;
    const avgSPI = spiCount > 0 ? (spiSum / spiCount) : rawSpi;

    // Total Area
    const areaSqft = parseFloat(String(p.areaSqft || p.area || '0').replace(/,/g, '')) || 0;

    return {
      vowd,
      milestone,
      labour,
      ur,
      uc,
      avgSPI,
      areaSqft
    };
  }, [software2Projects, activeMonthKeys, elapsedMonthsCount]);

  // 1. VP Leaderboard Calculation
  const vpRows: LeaderboardRow[] = useMemo(() => {
    let vps = Array.from(new Set(projects.map(p => p.vp).filter(Boolean)));
    if (selectedVP !== 'all') {
      vps = vps.filter(vp => String(vp).trim() === selectedVP);
    }

    return vps.map(vpName => {
      const vpProjects = projects.filter(p => !isTempProject(p.code) && p.vp === vpName);
      let vowdPlan = 0, vowdAch = 0;
      let milestonePlan = 0, milestoneAch = 0;
      let labourPlan = 0, labourAch = 0;
      let urPlan = 0, urAch = 0;
      let ucPlan = 0, ucAch = 0;
      let totalArea = 0;
      let totalSpi = 0;

      let vowdAchUnderConstruction = 0;
      let areaUnderConstruction = 0;

      vpProjects.forEach(p => {
        const m = extractProjectMetrics(p);
        vowdPlan += m.vowd.plan;
        vowdAch += m.vowd.ach;
        milestonePlan += m.milestone.plan;
        milestoneAch += m.milestone.ach;
        labourPlan += m.labour.plan;
        labourAch += m.labour.ach;
        urPlan += m.ur.plan;
        urAch += m.ur.ach;
        ucPlan += m.uc.plan;
        ucAch += m.uc.ach;
        totalArea += m.areaSqft;
        totalSpi += m.avgSPI;

        if (isUnderConstructionStage(p.projectStage)) {
          vowdAchUnderConstruction += m.vowd.ach;
          areaUnderConstruction += m.areaSqft;
        }
      });

      const count = vpProjects.length || 1;
      const vowdPct = vowdPlan > 0 ? (vowdAch / vowdPlan) * 100 : 0;
      const milestonePct = milestonePlan > 0 ? (milestoneAch / milestonePlan) * 100 : 0;
      const labourPct = labourPlan > 0 ? (labourAch / labourPlan) * 100 : 0;
      const urPct = urPlan > 0 ? (urAch / urPlan) * 100 : 0;
      const ucPct = ucPlan > 0 ? (ucAch / ucPlan) * 100 : 0;
      const avgSPI = count > 0 ? totalSpi / count : 1.0;

      // Labour productivity = achieved VOWD for all projects / total number of labours for all projects (Unit: Rs./Lab./Day)
      const labourProductivity = labourAch > 0 ? ((vowdAch / labourAch) * 10000000) : 0;

      // Labour efficiency = labour productivity * 26 * 100 / 10^7 (Unit: Cr. per 100 labours)
      const labourEfficiency = (labourProductivity * 26 * 100) / 10000000;

      // Speed of construction in leaderboard = achieved VOWD of projects under construction / area of projects under construction / no. of elapsed months from Apr
      const speedOfConstruction = (areaUnderConstruction > 0 && elapsedMonthsCount > 0)
        ? ((vowdAchUnderConstruction * 10000000) / (areaUnderConstruction * elapsedMonthsCount))
        : 0;

      const compositeScore = (vowdPct * 0.35) + (milestonePct * 0.25) + (avgSPI * 100 * 0.20) + (Math.min(100, (labourEfficiency / 2) * 100) * 0.10) + (Math.min(100, (speedOfConstruction / 50) * 100) * 0.10);

      return {
        id: `vp-${vpName}`,
        name: vpName,
        subTitle: `Executive Portfolio • ${vpProjects.length} Projects`,
        badge: 'VP Portfolio',
        projectCount: vpProjects.length,
        vowdPlan,
        vowdAch,
        vowdPct,
        milestonePlan,
        milestoneAch,
        milestonePct,
        labourPlan,
        labourAch,
        labourPct,
        urPlan,
        urAch,
        urPct,
        ucPlan,
        ucAch,
        ucPct,
        labourProductivity,
        labourEfficiency,
        speedOfConstruction,
        avgSPI,
        compositeScore
      };
    });
  }, [projects, extractProjectMetrics, elapsedMonthsCount, selectedVP]);

  // 2. Leader Leaderboard Calculation
  const leaderRows: LeaderboardRow[] = useMemo(() => {
    let leaders = Array.from(new Set(projects.map(p => p.leader).filter(Boolean)));
    if (selectedVP !== 'all') {
      leaders = leaders.filter(leaderName => {
        const lp = projects.filter(p => !isTempProject(p.code) && p.leader === leaderName);
        return lp.some(p => p.vp === selectedVP);
      });
    }
    if (selectedLeader !== 'all') {
      leaders = leaders.filter(l => String(l).trim() === selectedLeader);
    }

    return leaders.map(leaderName => {
      const leaderProjects = projects.filter(p => !isTempProject(p.code) && p.leader === leaderName && (selectedVP === 'all' || p.vp === selectedVP));
      const vpName = leaderProjects[0]?.vp || 'Unassigned';
      let vowdPlan = 0, vowdAch = 0;
      let milestonePlan = 0, milestoneAch = 0;
      let labourPlan = 0, labourAch = 0;
      let urPlan = 0, urAch = 0;
      let ucPlan = 0, ucAch = 0;
      let totalArea = 0;
      let totalSpi = 0;

      let vowdAchUnderConstruction = 0;
      let areaUnderConstruction = 0;

      leaderProjects.forEach(p => {
        const m = extractProjectMetrics(p);
        vowdPlan += m.vowd.plan;
        vowdAch += m.vowd.ach;
        milestonePlan += m.milestone.plan;
        milestoneAch += m.milestone.ach;
        labourPlan += m.labour.plan;
        labourAch += m.labour.ach;
        urPlan += m.ur.plan;
        urAch += m.ur.ach;
        ucPlan += m.uc.plan;
        ucAch += m.uc.ach;
        totalArea += m.areaSqft;
        totalSpi += m.avgSPI;

        if (isUnderConstructionStage(p.projectStage)) {
          vowdAchUnderConstruction += m.vowd.ach;
          areaUnderConstruction += m.areaSqft;
        }
      });

      const count = leaderProjects.length || 1;
      const vowdPct = vowdPlan > 0 ? (vowdAch / vowdPlan) * 100 : 0;
      const milestonePct = milestonePlan > 0 ? (milestoneAch / milestonePlan) * 100 : 0;
      const labourPct = labourPlan > 0 ? (labourAch / labourPlan) * 100 : 0;
      const urPct = urPlan > 0 ? (urAch / urPlan) * 100 : 0;
      const ucPct = ucPlan > 0 ? (ucAch / ucPlan) * 100 : 0;
      const avgSPI = count > 0 ? totalSpi / count : 1.0;

      // Labour productivity = achieved VOWD for all projects / total number of labours for all projects (Unit: Rs./Lab./Day)
      const labourProductivity = labourAch > 0 ? ((vowdAch / labourAch) * 10000000) : 0;

      // Labour efficiency = labour productivity * 26 * 100 / 10^7 (Unit: Cr. per 100 labours)
      const labourEfficiency = (labourProductivity * 26 * 100) / 10000000;

      // Speed of construction in leaderboard = achieved VOWD of projects under construction / area of projects under construction / no. of elapsed months from Apr
      const speedOfConstruction = (areaUnderConstruction > 0 && elapsedMonthsCount > 0)
        ? ((vowdAchUnderConstruction * 10000000) / (areaUnderConstruction * elapsedMonthsCount))
        : 0;

      const compositeScore = (vowdPct * 0.35) + (milestonePct * 0.25) + (avgSPI * 100 * 0.20) + (Math.min(100, (labourEfficiency / 2) * 100) * 0.10) + (Math.min(100, (speedOfConstruction / 50) * 100) * 0.10);

      return {
        id: `leader-${leaderName}`,
        name: leaderName,
        subTitle: `Reports to ${vpName} • ${leaderProjects.length} Projects`,
        badge: 'Project Leader',
        projectCount: leaderProjects.length,
        vowdPlan,
        vowdAch,
        vowdPct,
        milestonePlan,
        milestoneAch,
        milestonePct,
        labourPlan,
        labourAch,
        labourPct,
        urPlan,
        urAch,
        urPct,
        ucPlan,
        ucAch,
        ucPct,
        labourProductivity,
        labourEfficiency,
        speedOfConstruction,
        avgSPI,
        compositeScore
      };
    });
  }, [projects, extractProjectMetrics, elapsedMonthsCount, selectedVP, selectedLeader]);

  // 3. Projects Leaderboard Calculation
  const projectRows: LeaderboardRow[] = useMemo(() => {
    let filteredProjects = projects.filter(p => !isTempProject(p.code));
    if (selectedVP !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.vp === selectedVP);
    }
    if (selectedLeader !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.leader === selectedLeader);
    }

    return filteredProjects.map(p => {
      const m = extractProjectMetrics(p);
      const vowdPct = m.vowd.plan > 0 ? (m.vowd.ach / m.vowd.plan) * 100 : (parseFloat(p.progress) || 0);
      const milestonePct = m.milestone.plan > 0 ? (m.milestone.ach / m.milestone.plan) * 100 : 0;
      const labourPct = m.labour.plan > 0 ? (m.labour.ach / m.labour.plan) * 100 : 0;
      const urPct = m.ur.plan > 0 ? (m.ur.ach / m.ur.plan) * 100 : 0;
      const ucPct = m.uc.plan > 0 ? (m.uc.ach / m.uc.plan) * 100 : 0;
      const avgSPI = m.avgSPI;

      const isUnderConstruction = isUnderConstructionStage(p.projectStage);

      // Labour productivity = achieved VOWD / labour headcount (Unit: Rs./Lab./Day)
      const labourProductivity = m.labour.ach > 0 ? ((m.vowd.ach / m.labour.ach) * 10000000) : 0;

      // Labour efficiency = labour productivity * 26 * 100 / 10^7 (Unit: Cr. per 100 labours)
      const labourEfficiency = (labourProductivity * 26 * 100) / 10000000;

      // Speed of construction for project = (VOWD ach * 10^7) / (Area * elapsedMonthsCount) if under construction
      const speedOfConstruction = (isUnderConstruction && m.areaSqft > 0 && elapsedMonthsCount > 0)
        ? ((m.vowd.ach * 10000000) / (m.areaSqft * elapsedMonthsCount))
        : 0;

      const compositeScore = (vowdPct * 0.35) + (milestonePct * 0.25) + (avgSPI * 100 * 0.20) + (Math.min(100, (labourEfficiency / 2) * 100) * 0.10) + (Math.min(100, (speedOfConstruction / 50) * 100) * 0.10);

      return {
        id: `proj-${p.code}`,
        name: p.name,
        subTitle: `ID: ${p.code} | Lead: ${p.leader} | VP: ${p.vp} | Stage: ${p.projectStage || 'N/A'}`,
        badge: p.status || 'Green',
        projectCount: 1,
        vowdPlan: m.vowd.plan,
        vowdAch: m.vowd.ach,
        vowdPct,
        milestonePlan: m.milestone.plan,
        milestoneAch: m.milestone.ach,
        milestonePct,
        labourPlan: m.labour.plan,
        labourAch: m.labour.ach,
        labourPct,
        urPlan: m.ur.plan,
        urAch: m.ur.ach,
        urPct,
        ucPlan: m.uc.plan,
        ucAch: m.uc.ach,
        ucPct,
        labourProductivity,
        labourEfficiency,
        speedOfConstruction,
        avgSPI,
        compositeScore,
        rawProject: p
      };
    });
  }, [projects, extractProjectMetrics, elapsedMonthsCount, selectedVP, selectedLeader]);

  // Active dataset according to selected category
  const activeRawRows = activeCategory === 'VP' ? vpRows : activeCategory === 'LEADER' ? leaderRows : projectRows;

  // Filter and sort active rows
  const sortedRows = useMemo(() => {
    let filtered = activeRawRows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(q) || 
        (r.subTitle && r.subTitle.toLowerCase().includes(q))
      );
    }

    // Sort by field
    const sorted = [...filtered].sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
    });

    // Assign Rank
    return sorted.map((row, idx) => ({
      ...row,
      rank: idx + 1
    }));
  }, [activeRawRows, searchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof LeaderboardRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Top metric highlights
  const topPerformer = sortedRows[0];
  const topProductivity = [...sortedRows].sort((a, b) => b.labourProductivity - a.labourProductivity)[0];
  const topSPI = [...sortedRows].sort((a, b) => b.avgSPI - a.avgSPI)[0];

  return (
    <div className="space-y-6 font-sans" id="leaderboard-root">
      
      {/* Top Banner - Uniform Light Grey Block */}
      <div className="bg-slate-100/80 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4" id="leaderboard-header-banner">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl shadow-2xs shrink-0">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Executive Performance Leaderboard</h2>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                {fyConfig.label} Benchmarking
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Rankings &amp; cross-comparative efficiency metrics across <strong className="text-slate-700">VPs, Leaders &amp; Projects</strong> evaluated across the selected month timeframe.
            </p>
          </div>
        </div>
      </div>

      {/* Month Range Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Performance Timeline Filter
            </span>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2 mt-0.5 flex-wrap">
              <span>Evaluating Data:</span>
              <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200 font-mono font-black">
                {startMonth} → {toMonth}
              </span>
              <span className="text-slate-500 font-medium">({activeMonthKeys.length} Months Active)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Start Month Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">From:</span>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
            >
              {FY_MONTHS.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* To Month Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">To:</span>
            <select
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
            >
              {FY_MONTHS.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              onClick={() => { 
                if (FY_MONTHS.length >= 5) {
                  setStartMonth(FY_MONTHS[0].key); 
                  setToMonth(FY_MONTHS[4].key); 
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                FY_MONTHS.length >= 5 && startMonth === FY_MONTHS[0].key && toMonth === FY_MONTHS[4].key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {FY_MONTHS[0]?.short}–{FY_MONTHS[4]?.short} (YTD)
            </button>
            <button
              onClick={() => { 
                if (FY_MONTHS.length >= 3) {
                  setStartMonth(FY_MONTHS[0].key); 
                  setToMonth(FY_MONTHS[2].key); 
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                FY_MONTHS.length >= 3 && startMonth === FY_MONTHS[0].key && toMonth === FY_MONTHS[2].key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Q1 ({FY_MONTHS[0]?.short}–{FY_MONTHS[2]?.short})
            </button>
            <button
              onClick={() => { 
                if (FY_MONTHS.length >= 12) {
                  setStartMonth(FY_MONTHS[0].key); 
                  setToMonth(FY_MONTHS[11].key); 
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                FY_MONTHS.length >= 12 && startMonth === FY_MONTHS[0].key && toMonth === FY_MONTHS[11].key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Full {fyConfig.label}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Benchmark Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Top Overall Rank */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block">🥇 #1 Ranked Performer</span>
            <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-[220px]">{topPerformer?.name || 'N/A'}</h4>
            <p className="text-[10px] text-slate-400 font-semibold">VOWD: {topPerformer?.vowdPct.toFixed(0)}% | SPI: {topPerformer?.avgSPI.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm shrink-0 border border-amber-200">
            {topPerformer?.compositeScore.toFixed(0)}
          </div>
        </div>

        {/* Highest Labour Productivity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider block">⚡ Top Labour Productivity</span>
            <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-[220px]">{topProductivity?.name || 'N/A'}</h4>
            <p className="text-[10px] text-slate-400 font-semibold">Productivity: ₹{Math.round(topProductivity?.labourProductivity || 0).toLocaleString()} /Lab./Day</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Best Schedule SPI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">🎯 Highest Avg SPI ({startMonth}–{toMonth})</span>
            <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-[220px]">{topSPI?.name || 'N/A'}</h4>
            <p className="text-[10px] text-slate-400 font-semibold">Milestones: {topSPI?.milestonePct.toFixed(0)}% Achieved</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-sm shrink-0 border border-emerald-200">
            {topSPI?.avgSPI.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="leaderboard-table-container">
        
        {/* Table Search & Control Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {activeCategory === 'VP' ? 'Executive VP Rankings' : activeCategory === 'LEADER' ? 'Project Leader Rankings' : 'Project Rankings'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Evaluated across {activeMonthKeys.length} active months ({startMonth}–{toMonth}) • Click column headers to sort
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-wrap">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="text-xs font-bold text-slate-500">
              <span>Showing <strong className="text-slate-900">{sortedRows.length}</strong> records</span>
            </div>
          </div>
        </div>

        {/* Responsive Table matching Milestone Analysis exact typography */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider select-none">
                <th className="py-3 px-3 w-14 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('rank')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[180px] text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>{activeCategory === 'VP' ? 'Executive VP' : activeCategory === 'LEADER' ? 'Project Leader' : 'Project'}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('vowdPct')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>VOWD</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('milestonePct')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Milestones</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('labourPct')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Labour</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('urPct')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Unit Del. (Res.)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('ucPct')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Unit Del. (Comm.)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('labourProductivity')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Labour Productivity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('labourEfficiency')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Labour Efficiency</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('speedOfConstruction')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Speed (₹/Sqft)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('avgSPI')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Avg SPI</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('compositeScore')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Score / Grade</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((row) => {
                const isTop1 = row.rank === 1;
                const isTop2 = row.rank === 2;
                const isTop3 = row.rank === 3;

                let grade = 'A+';
                let gradeBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (row.compositeScore < 70 || row.avgSPI < 0.85) {
                  grade = 'C';
                  gradeBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                } else if (row.compositeScore < 85 || row.avgSPI < 0.95) {
                  grade = 'B';
                  gradeBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                } else if (row.compositeScore < 95) {
                  grade = 'A';
                  gradeBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                }

                return (
                  <tr 
                    key={row.id}
                    onClick={() => row.rawProject && onSelectProject && onSelectProject(row.rawProject)}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      row.rawProject ? 'cursor-pointer' : ''
                    } ${
                      isTop1 ? 'bg-amber-50/20' : isTop2 ? 'bg-slate-50/30' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-3 text-center font-bold text-slate-400 text-[10px]">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-black text-[10px] ${
                        isTop1 ? 'bg-amber-500 text-white shadow-2xs' :
                        isTop2 ? 'bg-slate-400 text-white' :
                        isTop3 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 text-slate-600 font-bold'
                      }`}>
                        {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${row.rank}`}
                      </span>
                    </td>

                    {/* Entity Name & Subtitle */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-slate-900 leading-snug truncate max-w-[200px]" title={row.name}>
                          {row.name}
                        </span>
                        {row.subTitle && (
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                            {row.subTitle}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 1. VOWD */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 font-mono text-xs">
                        {row.vowdPct.toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        ₹ {row.vowdAch.toFixed(1)} / ₹ {row.vowdPlan.toFixed(1)} Cr.
                      </div>
                    </td>

                    {/* 2. Milestone */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 font-mono text-xs">
                        {row.milestonePct.toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {row.milestoneAch} / {row.milestonePlan} Qty
                      </div>
                    </td>

                    {/* 3. Labour */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 font-mono text-xs">
                        {row.labourPct.toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {row.labourAch.toLocaleString()} / {row.labourPlan.toLocaleString()}
                      </div>
                    </td>

                    {/* 4. Unit Delivery - Residential */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 font-mono text-xs">
                        {row.urPct.toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {row.urAch} / {row.urPlan} Units
                      </div>
                    </td>

                    {/* 5. Unit Delivery - Commercial */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 font-mono text-xs">
                        {row.ucPct.toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {row.ucAch} / {row.ucPlan} Units
                      </div>
                    </td>

                    {/* 6. Labour Productivity */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-800 font-mono text-xs">
                        ₹{row.labourProductivity > 0 ? Math.round(row.labourProductivity).toLocaleString() : '0'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block font-normal">/Lab./Day</span>
                    </td>

                    {/* 7. Labour Efficiency */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`font-bold font-mono text-xs ${row.labourEfficiency >= 1.0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {row.labourEfficiency > 0 ? row.labourEfficiency.toFixed(2) : '0.00'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block font-normal">Cr./100 Lab.</span>
                    </td>

                    {/* 8. Speed of Construction */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-800 font-mono text-xs">
                        {row.speedOfConstruction > 0 ? `₹${Math.round(row.speedOfConstruction).toLocaleString()}` : '—'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block font-normal">/Sqft/Mo</span>
                    </td>

                    {/* 9. Avg SPI */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-black font-mono border uppercase ${
                        row.avgSPI >= 1.0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.avgSPI >= 0.85 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {row.avgSPI.toFixed(2)}
                      </span>
                    </td>

                    {/* Overall Score & Grade */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase border ${gradeBadge}`}>
                        {grade} ({row.compositeScore.toFixed(0)})
                      </span>
                    </td>
                  </tr>
                );
              })}

              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 italic text-xs">
                    No leaderboard records found matching your search in {startMonth} to {toMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-100 text-[10px] text-slate-400 font-semibold flex justify-between items-center">
          <span>Benchmarking Period: {startMonth} to {toMonth} ({activeMonthKeys.length} Months Tracked)</span>
          <span>Leaderboard Scope: {activeCategory === 'VP' ? 'Executive VPs' : activeCategory === 'LEADER' ? 'Project Leaders' : 'Projects'}</span>
        </div>

      </div>

    </div>
  );
}
