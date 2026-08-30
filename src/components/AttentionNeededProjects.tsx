import { useState, useMemo } from 'react';
import { Project, Software2Project } from '@/src/types';
import { isTempProject } from '@/src/utils/customOrder';
import { 
  Users, 
  Calendar, 
  Home, 
  Briefcase, 
  DollarSign, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles,
  Zap,
  Gauge,
  Award,
  TrendingDown,
  Building2,
  HardHat,
  Compass
} from 'lucide-react';

interface AttentionNeededProjectsProps {
  projects?: (Project | Software2Project)[];
  software2Projects?: Software2Project[];
  onSelectProject?: (proj: any) => void;
  selectedVP?: string;
  selectedLeader?: string;
  selectedProjectCode?: string;
}

export interface CriticalProjectAnalysis {
  project?: Project;
  s2Project?: Software2Project;
  code: string;
  name: string;
  leader: string;
  vp: string;
  stage: string;
  areaSqft: number;
  rank: number;
  criticalScore: number;
  status: string;
  laggingParams: string[];
  
  // Cumulative metrics (April 2026 to latest month)
  vowd: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  labour: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  milestone: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  ur: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  uc: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  spi: { val: number; target: number; isLagging: boolean };
  qualityRating: { val: number | null; target: number; isLagging: boolean };
  safetyRating: { val: number | null; target: number; isLagging: boolean };
  avgQhseRating: { val: number | null; target: number; isLagging: boolean };

  // Productivity & Speed
  labourProductivity: number; // Rs./Lab./Day
  labourEfficiency: number; // Cr. per 100 labours
  speedOfConstruction: number; // Rs./Sqft/Month

  // Executive Diagnosis & Comments
  criticalFindings: string;
  productivityComment: string;
  efficiencyComment: string;
  speedComment: string;
  recommendedAction: string;
}

const FY_MONTHS = ["Apr-26", "May-26", "Jun-26", "Jul-26", "Aug-26", "Sep-26", "Oct-26", "Nov-26", "Dec-26", "Jan-27", "Feb-27", "Mar-27"];

export default function AttentionNeededProjects({
  projects = [],
  software2Projects = [],
  onSelectProject,
  selectedVP = 'all',
  selectedLeader = 'all',
  selectedProjectCode = 'all'
}: AttentionNeededProjectsProps) {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'VOWD' | 'LABOUR' | 'MILESTONE' | 'UR' | 'UC' | 'RATINGS'>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [expandedProjectCode, setExpandedProjectCode] = useState<string | null>(null);

  const toggleExpand = (code: string) => {
    setExpandedProjectCode(prev => prev === code ? null : code);
  };

  // Determine latest completed month across all software2Projects
  const lastCompletedMonthIndex = useMemo(() => {
    let maxIdx = -1;
    software2Projects.forEach(s2 => {
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
    return maxIdx >= 0 ? maxIdx : 3; // Default fallback to Jul-26 (index 3)
  }, [software2Projects]);

  const lastCompletedMonthName = FY_MONTHS[lastCompletedMonthIndex] || 'Jul-26';
  const completedMonthKeys = useMemo(() => {
    return FY_MONTHS.slice(0, lastCompletedMonthIndex + 1);
  }, [lastCompletedMonthIndex]);

  const elapsedMonthsCount = Math.max(1, lastCompletedMonthIndex + 1);

  // Combine unique project list from primary projects and software2Projects
  const unifiedProjectMap = useMemo(() => {
    const map = new Map<string, { p?: Project; s2?: Software2Project }>();

    projects.forEach(item => {
      const code = (item.code || '').trim();
      if (!code || isTempProject(code)) return;
      if (!map.has(code)) {
        map.set(code, {});
      }
      const entry = map.get(code)!;
      if ('rawRow' in item || 'vowdPlan' in item) {
        entry.p = item as Project;
      } else {
        entry.s2 = item as Software2Project;
      }
    });

    software2Projects.forEach(s2 => {
      const code = (s2.code || '').trim();
      if (!code || isTempProject(code)) return;
      if (!map.has(code)) {
        map.set(code, {});
      }
      map.get(code)!.s2 = s2;
    });

    return map;
  }, [projects, software2Projects]);

  // Helper to parse ratings
  const parseRating = (raw?: string | number | null): number | null => {
    if (raw === undefined || raw === null || raw === '' || raw === '-' || raw === 'N/A') return null;
    const num = parseFloat(String(raw).replace(/%/g, '').trim());
    if (isNaN(num)) return null;
    return num > 10 ? num / 10 : num; // normalize 0-10
  };

  // Analyze all projects
  const criticalAnalysisList: CriticalProjectAnalysis[] = useMemo(() => {
    const analyzed: CriticalProjectAnalysis[] = [];

    unifiedProjectMap.forEach(({ p, s2 }, code) => {
      const name = p?.name || s2?.name || code;
      const leader = p?.leader || s2?.leader || 'Unassigned';
      const vp = p?.vp || s2?.vp || 'Unassigned';
      const stage = p?.projectStage || s2?.stage || 'Under Construction';
      const areaSqft = parseFloat(String(p?.areaSqft || '').replace(/,/g, '')) || 0;

      // Filter by active VP / Leader scope if specified
      if (selectedVP !== 'all' && vp.trim().toLowerCase() !== selectedVP.trim().toLowerCase()) return;
      if (selectedLeader !== 'all' && leader.trim().toLowerCase() !== selectedLeader.trim().toLowerCase()) return;

      // Helper to sum metrics across completed months
      const getCumulative = (metrics?: { month: string; plan?: number; planR0?: number; planR1?: number; achievement: number }[]) => {
        if (!metrics || metrics.length === 0) return { plan: 0, ach: 0 };
        let plan = 0;
        let ach = 0;
        metrics.forEach(m => {
          if (completedMonthKeys.includes(m.month)) {
            const pR0 = m.planR0 !== undefined ? m.planR0 : (m.plan ?? 0);
            const pR1 = m.planR1 !== undefined ? m.planR1 : pR0;
            plan += Number(pR1) || 0;
            ach += Number(m.achievement) || 0;
          }
        });
        return { plan: Math.round(plan * 10) / 10, ach: Math.round(ach * 10) / 10 };
      };

      // 1. VOWD (Cr.)
      let vowdData = getCumulative(s2?.vowd);
      if (vowdData.plan === 0 && p?.vowdPlan) {
        vowdData = {
          plan: parseFloat(String(p.vowdPlan).replace(/,/g, '')) || 0,
          ach: parseFloat(String(p.vowdAch).replace(/,/g, '')) || 0
        };
      }
      const vowdPct = vowdData.plan > 0 ? (vowdData.ach / vowdData.plan) * 100 : (vowdData.ach > 0 ? 100 : 0);
      const vowdGap = Math.max(0, vowdData.plan - vowdData.ach);
      const isLaggingVowd = vowdData.plan > 0 && (vowdPct < 85 || vowdGap >= 0.5);

      // 2. Labour (Labours)
      let labourData = getCumulative(s2?.labour);
      if (labourData.plan === 0 && p?.labourPlan) {
        labourData = {
          plan: parseFloat(String(p.labourPlan).replace(/,/g, '')) || 0,
          ach: parseFloat(String(p.labourAch).replace(/,/g, '')) || 0
        };
      }
      const labourPct = labourData.plan > 0 ? (labourData.ach / labourData.plan) * 100 : (labourData.ach > 0 ? 100 : 0);
      const labourGap = Math.max(0, labourData.plan - labourData.ach);
      const isLaggingLabour = labourData.plan > 0 && (labourPct < 85 || labourGap >= 15);

      // 3. Milestone (Qty)
      let milestoneData = getCumulative(s2?.milestone);
      if (milestoneData.plan === 0 && p?.milestonePlan) {
        milestoneData = {
          plan: parseFloat(String(p.milestonePlan).replace(/,/g, '')) || 0,
          ach: parseFloat(String(p.milestoneAch).replace(/,/g, '')) || 0
        };
      }
      const milestonePct = milestoneData.plan > 0 ? (milestoneData.ach / milestoneData.plan) * 100 : (milestoneData.ach > 0 ? 100 : 0);
      const milestoneGap = Math.max(0, milestoneData.plan - milestoneData.ach);
      const isLaggingMilestone = milestoneData.plan > 0 && (milestonePct < 85 || milestoneGap >= 1);

      // 4. Residential UR (Units)
      let urData = getCumulative(s2?.ur);
      const urPct = urData.plan > 0 ? (urData.ach / urData.plan) * 100 : 100;
      const urGap = Math.max(0, urData.plan - urData.ach);
      const isLaggingUr = urData.plan > 0 && (urPct < 85 || urGap >= 5);

      // 5. Commercial UC (Units/Sqft)
      let ucData = getCumulative(s2?.uc);
      const ucPct = ucData.plan > 0 ? (ucData.ach / ucData.plan) * 100 : 100;
      const ucGap = Math.max(0, ucData.plan - ucData.ach);
      const isLaggingUc = ucData.plan > 0 && (ucPct < 85 || ucGap >= 5);

      // 6. SPI
      let rawSpi = p?.spi || s2?.spi;
      let spiNum = 1.0;
      if (rawSpi) {
        const parsed = parseFloat(String(rawSpi).replace(/%/g, ''));
        if (!isNaN(parsed) && parsed > 0) spiNum = parsed > 5 ? parsed / 100 : parsed;
      }
      const isLaggingSpi = spiNum < 0.85;

      // 7. Quality Rating (out of 10)
      const qualityVal = parseRating(p?.qualityRating || s2?.qualityRating);
      const isLaggingQuality = qualityVal !== null && qualityVal < 8.0;

      // 8. Safety Rating (out of 10)
      const safetyVal = parseRating(p?.safetyRating || s2?.safetyRating);
      const isLaggingSafety = safetyVal !== null && safetyVal < 8.0;

      // 9. Avg QHSE Rating (out of 10)
      const avgQhseVal = parseRating(p?.avgQhseRating || s2?.avgQhseRating || p?.qhseRating);
      const isLaggingAvgQhse = avgQhseVal !== null && avgQhseVal < 8.0;

      // Productivity & Speed Formulas
      // Labour productivity = achieved VOWD for project / total number of labours (Unit: Rs./Lab./Day)
      const labourProductivity = labourData.ach > 0 ? ((vowdData.ach * 10000000) / labourData.ach) : 0;

      // Labour efficiency = labour productivity * 26 * 100 / 10^7 (Unit: Cr. per 100 labours)
      const labourEfficiency = (labourProductivity * 26 * 100) / 10000000;

      // Speed of construction = achieved VOWD / area / elapsed months
      const speedOfConstruction = (areaSqft > 0 && elapsedMonthsCount > 0)
        ? ((vowdData.ach * 10000000) / (areaSqft * elapsedMonthsCount))
        : 0;

      // Compile Lagging Parameters
      const laggingParams: string[] = [];
      if (isLaggingVowd) laggingParams.push('VOWD');
      if (isLaggingLabour) laggingParams.push('Labour');
      if (isLaggingMilestone) laggingParams.push('Milestones');
      if (isLaggingUr) laggingParams.push('Unit Delivery - Residential');
      if (isLaggingUc) laggingParams.push('Unit Delivery - Commercial');
      if (isLaggingSpi) laggingParams.push('SPI');
      if (isLaggingQuality) laggingParams.push('Quality Rating');
      if (isLaggingSafety) laggingParams.push('Safety Rating');
      if (isLaggingAvgQhse) laggingParams.push('Avg QHSE Rating');

      // Critical Severity Score
      let criticalScore = 0;
      if (isLaggingVowd) criticalScore += 35 + (vowdGap * 2);
      if (isLaggingLabour) criticalScore += 25 + (labourGap / 50);
      if (isLaggingMilestone) criticalScore += 25 + (milestoneGap * 3);
      if (isLaggingUr) criticalScore += 15 + (urGap * 0.5);
      if (isLaggingUc) criticalScore += 15 + (ucGap * 0.5);
      if (isLaggingSpi) criticalScore += 20 * (1 - spiNum);
      if (isLaggingQuality) criticalScore += 10;
      if (isLaggingSafety) criticalScore += 10;
      if (isLaggingAvgQhse) criticalScore += 10;

      // Status
      let normStatus = p?.status || (criticalScore > 40 ? 'Red' : criticalScore > 15 ? 'Amber' : 'Green');

      // Executive Findings
      const findingsParts: string[] = [];
      if (isLaggingVowd) {
        findingsParts.push(`VOWD revenue realization is at ${vowdPct.toFixed(1)}% (shortfall of ₹${vowdGap.toFixed(2)} Cr. against planned ₹${vowdData.plan.toFixed(2)} Cr.)`);
      }
      if (isLaggingMilestone) {
        findingsParts.push(`milestone delivery is trailing with ${milestoneData.ach}/${milestoneData.plan} milestones achieved (${milestonePct.toFixed(0)}%)`);
      }
      if (isLaggingLabour) {
        findingsParts.push(`active labour deployment is running at ${labourPct.toFixed(1)}% of required manpower (${labourData.ach.toLocaleString()} vs ${labourData.plan.toLocaleString()} planned labours)`);
      }
      if (isLaggingUr) {
        findingsParts.push(`residential unit handovers are delayed (${urData.ach}/${urData.plan} units, gap of ${urGap} units)`);
      }
      if (isLaggingUc) {
        findingsParts.push(`commercial unit delivery is lagging (${ucData.ach}/${ucData.plan} units, gap of ${ucGap} units)`);
      }
      if (isLaggingSpi) {
        findingsParts.push(`Schedule Performance Index (SPI: ${spiNum.toFixed(2)}) indicates systemic schedule slippage`);
      }
      if (isLaggingQuality) {
        findingsParts.push(`Quality Rating (${qualityVal?.toFixed(1)}/10) is below target threshold (8.5/10)`);
      }
      if (isLaggingSafety) {
        findingsParts.push(`Safety Compliance Rating (${safetyVal?.toFixed(1)}/10) needs safety protocol enforcement`);
      }
      if (isLaggingAvgQhse) {
        findingsParts.push(`Avg QHSE Score (${avgQhseVal?.toFixed(1)}/10) is trailing standard benchmark`);
      }

      let criticalFindings = '';
      if (findingsParts.length > 0) {
        criticalFindings = `From Apr 2026 to ${lastCompletedMonthName}: ${findingsParts.join('; ')}.`;
      } else {
        criticalFindings = `From Apr 2026 to ${lastCompletedMonthName}: Project is operating within expected baseline targets (SPI: ${spiNum.toFixed(2)}).`;
      }

      // Analytical Comments on Productivity, Efficiency, Speed
      let productivityComment = '';
      if (labourProductivity === 0) {
        productivityComment = 'No recorded labour headcount data; manpower tracking required.';
      } else if (labourProductivity >= 3000) {
        productivityComment = `High labour throughput at ₹${Math.round(labourProductivity).toLocaleString()} /Lab./Day, indicating effective site execution.`;
      } else if (labourProductivity >= 1800) {
        productivityComment = `Moderate labour output at ₹${Math.round(labourProductivity).toLocaleString()} /Lab./Day, aligned with industry averages.`;
      } else {
        productivityComment = `Low labour output at ₹${Math.round(labourProductivity).toLocaleString()} /Lab./Day. Indicates potential workfront congestion, material supply hold-ups, or sub-contractor measurement delays.`;
      }

      let efficiencyComment = '';
      if (labourEfficiency >= 1.5) {
        efficiencyComment = `Robust workforce conversion rate of ₹${labourEfficiency.toFixed(2)} Cr. per 100 labours.`;
      } else if (labourEfficiency >= 0.8) {
        efficiencyComment = `Standard workforce conversion rate of ₹${labourEfficiency.toFixed(2)} Cr. per 100 labours.`;
      } else {
        efficiencyComment = `Sub-optimal workforce conversion (₹${labourEfficiency.toFixed(2)} Cr. / 100 Labours). Manpower deployment needs optimization against critical path work packages.`;
      }

      let speedComment = '';
      if (areaSqft <= 0) {
        speedComment = 'Built-up area not specified; speed index calculated on recorded execution run-rate.';
      } else if (speedOfConstruction >= 40) {
        speedComment = `Strong construction pace of ₹${speedOfConstruction.toFixed(1)} /Sqft/Mo across ${areaSqft.toLocaleString()} Sqft built-up area.`;
      } else if (speedOfConstruction >= 15) {
        speedComment = `Moderate construction pace of ₹${speedOfConstruction.toFixed(1)} /Sqft/Mo. Monitoring required to prevent milestone compression.`;
      } else {
        speedComment = `Slow construction pace of ₹${speedOfConstruction.toFixed(1)} /Sqft/Mo for ${areaSqft.toLocaleString()} Sqft. Workfront ramp-up and multi-shift operations recommended.`;
      }

      // Recommended Action
      let recommendedAction = '';
      if (isLaggingLabour && isLaggingVowd) {
        recommendedAction = 'Mobilize immediate contractor manpower augmentation and resolve sub-contractor billing bottlenecks to accelerate workfront progress.';
      } else if (isLaggingMilestone || isLaggingUr || isLaggingUc) {
        recommendedAction = 'Enforce weekly critical-path micro-schedules and expedite key finishing material deliveries to meet upcoming handover dates.';
      } else if (isLaggingQuality || isLaggingSafety || isLaggingAvgQhse) {
        recommendedAction = 'Conduct site QHSE quality audit, enforce zero-tolerance safety protocols, and rectify outstanding snag lists.';
      } else if (isLaggingVowd) {
        recommendedAction = 'Audit work measurement logs and clear certification backlog to restore planned billing run-rate.';
      } else {
        recommendedAction = 'Maintain executive monitoring on baseline milestone commitments and ensure sustained contractor staffing.';
      }

      analyzed.push({
        project: p,
        s2Project: s2,
        code,
        name,
        leader,
        vp,
        stage,
        areaSqft,
        rank: 0,
        criticalScore,
        status: normStatus,
        laggingParams,
        vowd: { ...vowdData, pct: vowdPct, gap: vowdGap, isLagging: isLaggingVowd },
        labour: { ...labourData, pct: labourPct, gap: labourGap, isLagging: isLaggingLabour },
        milestone: { ...milestoneData, pct: milestonePct, gap: milestoneGap, isLagging: isLaggingMilestone },
        ur: { ...urData, pct: urPct, gap: urGap, isLagging: isLaggingUr },
        uc: { ...ucData, pct: ucPct, gap: ucGap, isLagging: isLaggingUc },
        spi: { val: spiNum, target: 1.0, isLagging: isLaggingSpi },
        qualityRating: { val: qualityVal, target: 8.5, isLagging: isLaggingQuality },
        safetyRating: { val: safetyVal, target: 8.5, isLagging: isLaggingSafety },
        avgQhseRating: { val: avgQhseVal, target: 8.5, isLagging: isLaggingAvgQhse },
        labourProductivity,
        labourEfficiency,
        speedOfConstruction,
        criticalFindings,
        productivityComment,
        efficiencyComment,
        speedComment,
        recommendedAction
      });
    });

    // Sort descending by critical severity score
    analyzed.sort((a, b) => b.criticalScore - a.criticalScore);

    // Assign ranks
    return analyzed.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [unifiedProjectMap, selectedVP, selectedLeader, completedMonthKeys, lastCompletedMonthName, elapsedMonthsCount]);

  // Selected project for drilldown
  const selectedProjectAnalysis = useMemo(() => {
    if (!selectedProjectCode || selectedProjectCode === 'all') return null;
    return criticalAnalysisList.find(p => p.code.toLowerCase() === selectedProjectCode.toLowerCase()) || null;
  }, [criticalAnalysisList, selectedProjectCode]);

  // Top 7 critical projects
  const top7CriticalProjects = useMemo(() => {
    return criticalAnalysisList.slice(0, 7);
  }, [criticalAnalysisList]);

  // Filter list by selected parameter tab
  const filteredCriticalProjects = useMemo(() => {
    if (selectedFilter === 'ALL') return top7CriticalProjects;
    if (selectedFilter === 'VOWD') return top7CriticalProjects.filter(p => p.vowd.isLagging);
    if (selectedFilter === 'LABOUR') return top7CriticalProjects.filter(p => p.labour.isLagging);
    if (selectedFilter === 'MILESTONE') return top7CriticalProjects.filter(p => p.milestone.isLagging);
    if (selectedFilter === 'UR') return top7CriticalProjects.filter(p => p.ur.isLagging);
    if (selectedFilter === 'UC') return top7CriticalProjects.filter(p => p.uc.isLagging);
    if (selectedFilter === 'RATINGS') return top7CriticalProjects.filter(p => p.spi.isLagging || p.qualityRating.isLagging || p.safetyRating.isLagging || p.avgQhseRating.isLagging);
    return top7CriticalProjects;
  }, [top7CriticalProjects, selectedFilter]);

  if (criticalAnalysisList.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-rose-200/90 rounded-3xl p-6 shadow-sm space-y-6 mt-8 font-sans" id="attention-needed-root">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-100 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-md shadow-rose-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {selectedProjectAnalysis ? `Critical Performance Diagnosis — ${selectedProjectAnalysis.name}` : 'Attention Needed — Top 7 Critical Projects'}
              </h3>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-200">
                Action Required
              </span>
              {selectedProjectAnalysis && (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-200">
                  Drilldown Project ({selectedProjectAnalysis.code})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              In-depth performance diagnosis analyzing data from <span className="font-bold text-slate-700">April 2026 to {lastCompletedMonthName}</span>. Highlights lagging deliverable parameters, shortfall gaps, labour productivity, efficiency, speed of construction, and executive recovery actions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse Tab' : 'Expand Tab'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* ========================================================= */}
          {/* 1. SINGLE SELECTED PROJECT DEEP-DIVE ANALYSIS VIEW        */}
          {/* ========================================================= */}
          {selectedProjectAnalysis ? (
            <div className="space-y-6 animate-in fade-in duration-200" id="selected-project-critical-diagnosis">
              
              {/* Project Title & Metadata Header */}
              <div className="bg-gradient-to-r from-rose-50/70 via-slate-50 to-blue-50/60 p-5 rounded-2xl border border-rose-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-300 text-xs font-mono font-black text-slate-800 shadow-2xs">
                      {selectedProjectAnalysis.code}
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {selectedProjectAnalysis.name}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedProjectAnalysis.status.toLowerCase() === 'red' ? 'bg-rose-500 text-white' :
                      selectedProjectAnalysis.status.toLowerCase() === 'amber' ? 'bg-amber-500 text-white' :
                      'bg-emerald-500 text-white'
                    }`}>
                      {selectedProjectAnalysis.status} Status
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md">
                      Severity Rank #{selectedProjectAnalysis.rank} of {criticalAnalysisList.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-600 font-semibold flex-wrap">
                    <span>VP: <strong className="text-slate-900">{selectedProjectAnalysis.vp}</strong></span>
                    <span>•</span>
                    <span>Leader: <strong className="text-slate-900">{selectedProjectAnalysis.leader}</strong></span>
                    <span>•</span>
                    <span>Stage: <strong className="text-slate-900">{selectedProjectAnalysis.stage}</strong></span>
                    {selectedProjectAnalysis.areaSqft > 0 && (
                      <>
                        <span>•</span>
                        <span>Area: <strong className="text-slate-900">{selectedProjectAnalysis.areaSqft.toLocaleString()} Sqft</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Lagging Parameters Badge Counter */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center space-x-1.5 ${
                    selectedProjectAnalysis.laggingParams.length > 0 
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                    <span>{selectedProjectAnalysis.laggingParams.length} Lagging Parameters</span>
                  </span>
                </div>
              </div>

              {/* 9-Parameter Full Performance Matrix */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-rose-600" />
                  <span>Comprehensive Parameter Lag &amp; Variance Scorecard</span>
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  
                  {/* 1. VOWD */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.vowd.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-blue-600" />
                        VOWD (Revenue)
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.vowd.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.vowd.isLagging ? 'Lagging' : 'On Track'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      ₹ {selectedProjectAnalysis.vowd.ach.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ ₹ {selectedProjectAnalysis.vowd.plan.toFixed(1)} Cr.</span>
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className={`font-black ${selectedProjectAnalysis.vowd.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedProjectAnalysis.vowd.pct.toFixed(0)}% Achieved
                      </span>
                      {selectedProjectAnalysis.vowd.gap > 0 && (
                        <span className="text-rose-600 font-bold">-₹ {selectedProjectAnalysis.vowd.gap.toFixed(1)} Cr.</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Labour Force */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.labour.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-600" />
                        Labour Force
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.labour.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.labour.isLagging ? 'Lagging' : 'On Track'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.labour.ach.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ {selectedProjectAnalysis.labour.plan.toLocaleString()} Lab.</span>
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className={`font-black ${selectedProjectAnalysis.labour.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedProjectAnalysis.labour.pct.toFixed(0)}% Deployed
                      </span>
                      {selectedProjectAnalysis.labour.gap > 0 && (
                        <span className="text-rose-600 font-bold">-{selectedProjectAnalysis.labour.gap} Labours</span>
                      )}
                    </div>
                  </div>

                  {/* 3. Milestones */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.milestone.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        Milestones
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.milestone.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.milestone.isLagging ? 'Lagging' : 'On Track'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.milestone.ach} <span className="text-[10px] text-slate-400 font-normal">/ {selectedProjectAnalysis.milestone.plan} Qty</span>
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className={`font-black ${selectedProjectAnalysis.milestone.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedProjectAnalysis.milestone.pct.toFixed(0)}% Completed
                      </span>
                      {selectedProjectAnalysis.milestone.gap > 0 && (
                        <span className="text-rose-600 font-bold">-{selectedProjectAnalysis.milestone.gap} Qty</span>
                      )}
                    </div>
                  </div>

                  {/* 4. Unit Delivery - Residential */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.ur.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 flex items-center gap-1">
                        <Home className="w-3 h-3 text-orange-600" />
                        Unit Delivery (Res)
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.ur.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.ur.isLagging ? 'Lagging' : 'On Track'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.ur.ach} <span className="text-[10px] text-slate-400 font-normal">/ {selectedProjectAnalysis.ur.plan} Units</span>
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className={`font-black ${selectedProjectAnalysis.ur.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedProjectAnalysis.ur.pct.toFixed(0)}% Delivered
                      </span>
                      {selectedProjectAnalysis.ur.gap > 0 && (
                        <span className="text-rose-600 font-bold">-{selectedProjectAnalysis.ur.gap} Units</span>
                      )}
                    </div>
                  </div>

                  {/* 5. Unit Delivery - Commercial */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.uc.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-amber-600" />
                        Unit Delivery (Comm)
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.uc.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.uc.isLagging ? 'Lagging' : 'On Track'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.uc.ach} <span className="text-[10px] text-slate-400 font-normal">/ {selectedProjectAnalysis.uc.plan} Units</span>
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className={`font-black ${selectedProjectAnalysis.uc.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedProjectAnalysis.uc.pct.toFixed(0)}% Delivered
                      </span>
                      {selectedProjectAnalysis.uc.gap > 0 && (
                        <span className="text-rose-600 font-bold">-{selectedProjectAnalysis.uc.gap} Units</span>
                      )}
                    </div>
                  </div>

                  {/* 6. SPI */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.spi.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-indigo-600" />
                        Schedule SPI
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.spi.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.spi.isLagging ? 'Critical' : 'Healthy'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.spi.val.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 1.00 Target</span>
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className={`font-black ${selectedProjectAnalysis.spi.val >= 0.9 ? 'text-emerald-600' : selectedProjectAnalysis.spi.val >= 0.85 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {selectedProjectAnalysis.spi.val >= 1.0 ? 'Ahead of Schedule' : `${Math.round((1 - selectedProjectAnalysis.spi.val) * 100)}% Variance`}
                      </span>
                    </div>
                  </div>

                  {/* 7. Quality Rating */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.qualityRating.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 flex items-center gap-1">
                        <Award className="w-3 h-3 text-sky-600" />
                        Quality Rating
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.qualityRating.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.qualityRating.isLagging ? 'Below Target' : 'Compliant'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.qualityRating.val !== null ? `${selectedProjectAnalysis.qualityRating.val.toFixed(1)} / 10` : 'N/A'}
                    </span>
                    <div className="mt-1 text-[10px] text-slate-500 font-medium">
                      Target: 8.5 / 10
                    </div>
                  </div>

                  {/* 8. Safety Rating */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.safetyRating.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 flex items-center gap-1">
                        <HardHat className="w-3 h-3 text-teal-600" />
                        Safety Rating
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.safetyRating.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.safetyRating.isLagging ? 'Below Target' : 'Compliant'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.safetyRating.val !== null ? `${selectedProjectAnalysis.safetyRating.val.toFixed(1)} / 10` : 'N/A'}
                    </span>
                    <div className="mt-1 text-[10px] text-slate-500 font-medium">
                      Target: 8.5 / 10
                    </div>
                  </div>

                  {/* 9. Avg QHSE Rating */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    selectedProjectAnalysis.avgQhseRating.isLagging ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-600" />
                        Avg QHSE Rating
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        selectedProjectAnalysis.avgQhseRating.isLagging ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProjectAnalysis.avgQhseRating.isLagging ? 'Below Target' : 'Compliant'}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">
                      {selectedProjectAnalysis.avgQhseRating.val !== null ? `${selectedProjectAnalysis.avgQhseRating.val.toFixed(1)} / 10` : 'N/A'}
                    </span>
                    <div className="mt-1 text-[10px] text-slate-500 font-medium">
                      Target: 8.5 / 10
                    </div>
                  </div>

                </div>
              </div>

              {/* 3 Productivity, Efficiency & Speed Executive Metric Cards with Deep-Dive Commentary */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span>Executive Productivity, Efficiency &amp; Construction Velocity</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Card 1: Labour Productivity */}
                  <div className="p-4 bg-gradient-to-br from-purple-50/80 to-white border border-purple-200 rounded-2xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                        ⚡ Labour Productivity
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Rs./Lab./Day)
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-black text-slate-900">
                        ₹{Math.round(selectedProjectAnalysis.labourProductivity).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">/Lab./Day</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/70 p-2 rounded-xl border border-purple-100">
                      {selectedProjectAnalysis.productivityComment}
                    </p>
                  </div>

                  {/* Card 2: Labour Efficiency */}
                  <div className="p-4 bg-gradient-to-br from-blue-50/80 to-white border border-blue-200 rounded-2xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                        📈 Labour Efficiency
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Cr. / 100 Labours)
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-black text-slate-900">
                        ₹{selectedProjectAnalysis.labourEfficiency.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">Cr. per 100 Labours</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/70 p-2 rounded-xl border border-blue-100">
                      {selectedProjectAnalysis.efficiencyComment}
                    </p>
                  </div>

                  {/* Card 3: Speed of Construction */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-200 rounded-2xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        🚀 Speed of Construction
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Rs./Sqft/Month)
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-black text-slate-900">
                        ₹{selectedProjectAnalysis.speedOfConstruction.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">/Sqft/Mo</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/70 p-2 rounded-xl border border-emerald-100">
                      {selectedProjectAnalysis.speedComment}
                    </p>
                  </div>

                </div>
              </div>

              {/* Executive Diagnosis & Recommended Recovery Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-1.5">
                  <h5 className="text-xs font-black uppercase text-rose-800 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>Executive Critical Findings &amp; Root Cause Analysis</span>
                  </h5>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedProjectAnalysis.criticalFindings}
                  </p>
                </div>

                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1.5">
                  <h5 className="text-xs font-black uppercase text-blue-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Prescriptive Executive Recovery Roadmap</span>
                  </h5>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedProjectAnalysis.recommendedAction}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* ========================================================= */
            /* 2. TOP 7 CRITICAL PROJECTS CARDS LIST (ALL PROJECTS MODE)  */
            /* ========================================================= */
            <>
              {/* Sub-Tabs: Filter by Lagging Parameter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-black uppercase text-slate-400 mr-1 tracking-wider shrink-0">
                  Filter by Parameter:
                </span>
                {[
                  { id: 'ALL', label: `All Critical (${top7CriticalProjects.length})`, color: 'bg-slate-900 text-white' },
                  { id: 'VOWD', label: `VOWD Lag (${top7CriticalProjects.filter(p => p.vowd.isLagging).length})`, color: 'bg-blue-600 text-white' },
                  { id: 'LABOUR', label: `Labour Lag (${top7CriticalProjects.filter(p => p.labour.isLagging).length})`, color: 'bg-purple-600 text-white' },
                  { id: 'MILESTONE', label: `Milestones Lag (${top7CriticalProjects.filter(p => p.milestone.isLagging).length})`, color: 'bg-emerald-600 text-white' },
                  { id: 'UR', label: `Unit Delivery - Res (${top7CriticalProjects.filter(p => p.ur.isLagging).length})`, color: 'bg-orange-600 text-white' },
                  { id: 'UC', label: `Unit Delivery - Comm (${top7CriticalProjects.filter(p => p.uc.isLagging).length})`, color: 'bg-amber-600 text-white' },
                  { id: 'RATINGS', label: `SPI & Ratings Lag (${top7CriticalProjects.filter(p => p.spi.isLagging || p.qualityRating.isLagging || p.safetyRating.isLagging || p.avgQhseRating.isLagging).length})`, color: 'bg-rose-600 text-white' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer shrink-0 ${
                      selectedFilter === tab.id
                        ? `${tab.color} shadow-xs`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Top 7 Critical Projects Cards List */}
              <div className="space-y-4" id="attention-needed-project-cards">
                {filteredCriticalProjects.map((item) => {
                  const isCardExpanded = expandedProjectCode === item.code;

                  return (
                    <div 
                      key={item.code}
                      className={`bg-white border rounded-3xl p-5 shadow-xs transition-all ${
                        isCardExpanded ? 'border-indigo-400 ring-2 ring-indigo-50 shadow-md' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Left: Rank, Code, Name, VP & Leader */}
                        <div className="flex items-start space-x-3.5">
                          <div className="w-8 h-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                            #{item.rank}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-700">
                                {item.code}
                              </span>
                              <span className="font-extrabold text-sm text-slate-900">
                                {item.name}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                item.status.toLowerCase() === 'red' ? 'bg-rose-100 text-rose-800' :
                                item.status.toLowerCase() === 'amber' ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.status}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium flex-wrap">
                              <span>VP: <strong className="text-slate-700">{item.vp}</strong></span>
                              <span>•</span>
                              <span>Lead: <strong className="text-slate-700">{item.leader}</strong></span>
                              <span>•</span>
                              <span>Stage: <strong className="text-slate-700">{item.stage}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Key Variance Indicators & Action Button */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {item.laggingParams.map(param => {
                            if (param === 'VOWD') {
                              return (
                                <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <DollarSign className="w-3 h-3 mr-1 text-blue-600" />
                                  VOWD: {item.vowd.pct.toFixed(0)}% (-₹{item.vowd.gap.toFixed(1)}Cr)
                                </span>
                              );
                            }
                            if (param === 'Labour') {
                              return (
                                <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Users className="w-3 h-3 mr-1 text-purple-600" />
                                  Labour: {item.labour.pct.toFixed(0)}% (-{item.labour.gap} Labours)
                                </span>
                              );
                            }
                            if (param === 'Milestones') {
                              return (
                                <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Calendar className="w-3 h-3 mr-1 text-emerald-600" />
                                  Milestones: {item.milestone.pct.toFixed(0)}% (-{item.milestone.gap}Qty)
                                </span>
                              );
                            }
                            if (param === 'Unit Delivery - Residential') {
                              return (
                                <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                  <Home className="w-3 h-3 mr-1 text-orange-600" />
                                  Unit Del. (Res): {item.ur.pct.toFixed(0)}% (-{item.ur.gap}U)
                                </span>
                              );
                            }
                            if (param === 'Unit Delivery - Commercial') {
                              return (
                                <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Briefcase className="w-3 h-3 mr-1 text-amber-600" />
                                  Unit Del. (Comm): {item.uc.pct.toFixed(0)}% (-{item.uc.gap}U)
                                </span>
                              );
                            }
                            if (param === 'SPI') {
                              return (
                                <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <Compass className="w-3 h-3 mr-1 text-rose-600" />
                                  SPI: {item.spi.val.toFixed(2)}
                                </span>
                              );
                            }
                            return null;
                          })}

                          {item.laggingParams.length === 0 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                              Near Threshold Variance (SPI: {item.spi.val.toFixed(2)})
                            </span>
                          )}

                          {onSelectProject && (
                            <button
                              type="button"
                              onClick={() => onSelectProject(item.project || item.s2Project || { code: item.code, name: item.name })}
                              className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex items-center space-x-1 cursor-pointer border border-blue-200"
                            >
                              <span>Drilldown</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleExpand(item.code)}
                            className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <span>{isCardExpanded ? 'Hide Details' : 'Analyze'}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCardExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </div>

                      </div>

                      {/* Expanded Breakdown Pane */}
                      {isCardExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-150 space-y-4 animate-in fade-in duration-200">
                          
                          {/* Metric Comparison Mini-Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {/* VOWD */}
                            <div className={`p-3 rounded-xl border ${item.vowd.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">VOWD Value</span>
                              <span className="text-sm font-black text-slate-900 block">₹{item.vowd.ach.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ {item.vowd.plan.toFixed(1)} Cr</span></span>
                              <span className={`text-[10px] font-extrabold ${item.vowd.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.vowd.pct.toFixed(0)}% Achieved</span>
                            </div>

                            {/* Labour */}
                            <div className={`p-3 rounded-xl border ${item.labour.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">Labour Force</span>
                              <span className="text-sm font-black text-slate-900 block">{item.labour.ach.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ {item.labour.plan.toLocaleString()}</span></span>
                              <span className={`text-[10px] font-extrabold ${item.labour.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.labour.pct.toFixed(0)}% Deployed</span>
                            </div>

                            {/* Milestone */}
                            <div className={`p-3 rounded-xl border ${item.milestone.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Milestones</span>
                              <span className="text-sm font-black text-slate-900 block">{item.milestone.ach} <span className="text-[10px] text-slate-400 font-normal">/ {item.milestone.plan}</span></span>
                              <span className={`text-[10px] font-extrabold ${item.milestone.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.milestone.pct.toFixed(0)}% Completed</span>
                            </div>

                            {/* Unit Delivery - Residential */}
                            <div className={`p-3 rounded-xl border ${item.ur.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">Unit Delivery - Residential</span>
                              <span className="text-sm font-black text-slate-900 block">{item.ur.ach} <span className="text-[10px] text-slate-400 font-normal">/ {item.ur.plan}</span></span>
                              <span className={`text-[10px] font-extrabold ${item.ur.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.ur.pct.toFixed(0)}% Handed Over</span>
                            </div>

                            {/* Unit Delivery - Commercial */}
                            <div className={`p-3 rounded-xl border ${item.uc.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">Unit Delivery - Commercial</span>
                              <span className="text-sm font-black text-slate-900 block">{item.uc.ach} <span className="text-[10px] text-slate-400 font-normal">/ {item.uc.plan}</span></span>
                              <span className={`text-[10px] font-extrabold ${item.uc.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.uc.pct.toFixed(0)}% Handed Over</span>
                            </div>
                          </div>

                          {/* Productivity, Efficiency & Speed Indicators */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                              <span className="text-[10px] font-bold text-purple-700 uppercase">Productivity</span>
                              <p className="text-xs font-black text-slate-900">₹{Math.round(item.labourProductivity).toLocaleString()} /Lab./Day</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{item.productivityComment}</p>
                            </div>

                            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                              <span className="text-[10px] font-bold text-blue-700 uppercase">Labour Efficiency</span>
                              <p className="text-xs font-black text-slate-900">₹{item.labourEfficiency.toFixed(2)} Cr. / 100 Labours</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{item.efficiencyComment}</p>
                            </div>

                            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase">Construction Speed</span>
                              <p className="text-xs font-black text-slate-900">₹{item.speedOfConstruction.toFixed(1)} /Sqft/Mo</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{item.speedComment}</p>
                            </div>
                          </div>

                          {/* Findings & Actions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
                              <h5 className="text-[10px] font-black uppercase text-rose-700 mb-2">Executive Findings</h5>
                              <p className="text-xs text-slate-700 leading-relaxed">{item.criticalFindings}</p>
                            </div>
                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                              <h5 className="text-[10px] font-black uppercase text-blue-700 mb-2">Recommended Recovery</h5>
                              <p className="text-xs text-slate-700 leading-relaxed">{item.recommendedAction}</p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}

                {filteredCriticalProjects.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    No projects found matching the selected parameter lag filter.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}
