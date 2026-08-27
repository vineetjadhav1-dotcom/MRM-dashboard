import React, { useState, useMemo } from 'react';
import { Project, Software2Project } from '@/src/types';
import { 
  AlertTriangle, 
  TrendingDown, 
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
  Flame, 
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface AttentionNeededProjectsProps {
  projects: Project[];
  software2Projects?: Software2Project[];
  onSelectProject?: (proj: Project) => void;
  selectedVP?: string;
  selectedLeader?: string;
}

export interface CriticalProjectAnalysis {
  project: Project;
  s2Project?: Software2Project;
  rank: number;
  criticalScore: number;
  spiVal: number;
  status: string;
  laggingParams: ('VOWD' | 'Labour' | 'Milestone' | 'Residential UR' | 'Commercial UC')[];
  
  // April 2026 to date cumulative metrics
  vowd: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  labour: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  milestone: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  ur: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };
  uc: { plan: number; ach: number; pct: number; gap: number; isLagging: boolean };

  // Executive Findings & Diagnosis
  criticalFindings: string;
  recommendedAction: string;
}

export default function AttentionNeededProjects({
  projects,
  software2Projects = [],
  onSelectProject,
  selectedVP = 'all',
  selectedLeader = 'all'
}: AttentionNeededProjectsProps) {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'VOWD' | 'LABOUR' | 'MILESTONE' | 'UR' | 'UC'>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Analyze all projects from April 2026 onwards to compute critical metrics
  const criticalAnalysisList: CriticalProjectAnalysis[] = useMemo(() => {
    if (!projects || projects.length === 0) return [];

    // Filter by active VP / Leader scope if specified
    const scopedProjects = projects.filter(p => {
      const matchVP = selectedVP === 'all' || (p.vp && p.vp.trim().toLowerCase() === selectedVP.trim().toLowerCase());
      const matchLeader = selectedLeader === 'all' || (p.leader && p.leader.trim().toLowerCase() === selectedLeader.trim().toLowerCase());
      return matchVP && matchLeader;
    });

    const analyzed = scopedProjects.map(p => {
      // Find matching Software 2 record
      const s2 = software2Projects.find(
        s => (s.code && s.code.trim().toLowerCase() === p.code.trim().toLowerCase()) ||
             (s.name && s.name.trim().toLowerCase() === p.name.trim().toLowerCase())
      );

      // Helper to sum metrics from April 2026 onwards
      const getCumulative = (metrics?: { month: string; plan: number; achievement: number }[]) => {
        if (!metrics || metrics.length === 0) return { plan: 0, ach: 0 };
        let plan = 0;
        let ach = 0;
        metrics.forEach(m => {
          // April 2026 to date includes all FY26 months
          plan += Number(m.plan) || 0;
          ach += Number(m.achievement) || 0;
        });
        return { plan, ach };
      };

      // 1. VOWD (Cr.)
      let vowdData = getCumulative(s2?.vowd);
      if (vowdData.plan === 0 && p.vowdPlan) {
        vowdData = {
          plan: parseFloat(String(p.vowdPlan).replace(/,/g, '')) || 0,
          ach: parseFloat(String(p.vowdAch).replace(/,/g, '')) || 0
        };
      }
      const vowdPct = vowdData.plan > 0 ? (vowdData.ach / vowdData.plan) * 100 : 100;
      const vowdGap = Math.max(0, vowdData.plan - vowdData.ach);
      const isLaggingVowd = vowdData.plan > 0 && (vowdPct < 85 || vowdGap >= 0.5);

      // 2. Labour (Workers)
      let labourData = getCumulative(s2?.labour);
      if (labourData.plan === 0 && p.labourPlan) {
        labourData = {
          plan: parseFloat(String(p.labourPlan).replace(/,/g, '')) || 0,
          ach: parseFloat(String(p.labourAch).replace(/,/g, '')) || 0
        };
      }
      const labourPct = labourData.plan > 0 ? (labourData.ach / labourData.plan) * 100 : 100;
      const labourGap = Math.max(0, labourData.plan - labourData.ach);
      const isLaggingLabour = labourData.plan > 0 && (labourPct < 85 || labourGap >= 15);

      // 3. Milestone (Qty)
      let milestoneData = getCumulative(s2?.milestone);
      if (milestoneData.plan === 0 && p.milestonePlan) {
        milestoneData = {
          plan: parseFloat(String(p.milestonePlan).replace(/,/g, '')) || 0,
          ach: parseFloat(String(p.milestoneAch).replace(/,/g, '')) || 0
        };
      }
      const milestonePct = milestoneData.plan > 0 ? (milestoneData.ach / milestoneData.plan) * 100 : 100;
      const milestoneGap = Math.max(0, milestoneData.plan - milestoneData.ach);
      const isLaggingMilestone = milestoneData.plan > 0 && (milestonePct < 85 || milestoneGap >= 1);

      // 4. Residential UR (Units)
      let urData = getCumulative(s2?.ur);
      const urPct = urData.plan > 0 ? (urData.ach / urData.plan) * 100 : 100;
      const urGap = Math.max(0, urData.plan - urData.ach);
      const isLaggingUr = urData.plan > 0 && (urPct < 85 || urGap >= 5);

      // 5. Commercial UC (Units)
      let ucData = getCumulative(s2?.uc);
      const ucPct = ucData.plan > 0 ? (ucData.ach / ucData.plan) * 100 : 100;
      const ucGap = Math.max(0, ucData.plan - ucData.ach);
      const isLaggingUc = ucData.plan > 0 && (ucPct < 85 || ucGap >= 5);

      // Compile Lagging Parameters
      const laggingParams: ('VOWD' | 'Labour' | 'Milestone' | 'Residential UR' | 'Commercial UC')[] = [];
      if (isLaggingVowd) laggingParams.push('VOWD');
      if (isLaggingLabour) laggingParams.push('Labour');
      if (isLaggingMilestone) laggingParams.push('Milestone');
      if (isLaggingUr) laggingParams.push('Residential UR');
      if (isLaggingUc) laggingParams.push('Commercial UC');

      // SPI calculation
      const rawSpi = p.spi || s2?.spi || '1.0';
      const spiNum = parseFloat(String(rawSpi).replace(/,/g, '')) || 1.0;

      // Status weight
      const normStatus = String(p.status || 'Green').trim();
      let statusWeight = 10;
      if (normStatus.toLowerCase() === 'red') statusWeight = 120;
      else if (normStatus.toLowerCase() === 'amber') statusWeight = 60;

      // Overall Critical Severity Score (higher = more critical)
      let criticalScore = statusWeight;
      criticalScore += laggingParams.length * 35;
      if (spiNum < 1.0) criticalScore += (1.0 - spiNum) * 150;
      if (vowdData.plan > 0 && vowdPct < 100) criticalScore += (100 - vowdPct) * 0.8;
      if (milestoneData.plan > 0 && milestonePct < 100) criticalScore += (100 - milestonePct) * 0.6;
      if (labourData.plan > 0 && labourPct < 100) criticalScore += (100 - labourPct) * 0.4;
      if (urData.plan > 0 && urPct < 100) criticalScore += (100 - urPct) * 0.3;
      if (ucData.plan > 0 && ucPct < 100) criticalScore += (100 - ucPct) * 0.3;

      // Generate Critical Executive Findings & Diagnosis
      const findingsParts: string[] = [];
      if (isLaggingVowd) {
        findingsParts.push(`VOWD revenue realization is at ${vowdPct.toFixed(1)}% (shortfall of ₹${vowdGap.toFixed(2)} Cr. against planned ₹${vowdData.plan.toFixed(2)} Cr.)`);
      }
      if (isLaggingMilestone) {
        findingsParts.push(`milestone delivery is trailing with ${milestoneData.ach}/${milestoneData.plan} milestones achieved (${milestonePct.toFixed(0)}%)`);
      }
      if (isLaggingLabour) {
        findingsParts.push(`active labour deployment is running at ${labourPct.toFixed(1)}% of required manpower (${labourData.ach.toLocaleString()} vs ${labourData.plan.toLocaleString()} planned workers)`);
      }
      if (isLaggingUr) {
        findingsParts.push(`residential unit handovers are delayed (${urData.ach}/${urData.plan} units, gap of ${urGap} units)`);
      }
      if (isLaggingUc) {
        findingsParts.push(`commercial unit delivery is lagging (${ucData.ach}/${ucData.plan} units, gap of ${ucGap} units)`);
      }
      if (spiNum < 0.85) {
        findingsParts.push(`critical Schedule Performance Index (SPI: ${spiNum.toFixed(2)}) indicates systemic schedule slippage`);
      }

      let criticalFindings = '';
      if (findingsParts.length > 0) {
        criticalFindings = `Since April 2026, ${findingsParts.join('; ')}.`;
      } else {
        criticalFindings = `Since April 2026, key delivery milestones require close monitoring due to near-threshold variance (SPI: ${spiNum.toFixed(2)}).`;
      }

      // Recommended Action
      let recommendedAction = '';
      if (isLaggingLabour && isLaggingVowd) {
        recommendedAction = 'Deploy immediate contractor manpower augmentation and review sub-contractor billing bottlenecks to accelerate workfront progress.';
      } else if (isLaggingMilestone || isLaggingUr || isLaggingUc) {
        recommendedAction = 'Enforce weekly micro-schedule tracking on critical path activities and expedite material procurement to meet upcoming delivery deadlines.';
      } else if (isLaggingVowd) {
        recommendedAction = 'Audit work measurement logs and clear certification backlog to restore planned billing run-rate.';
      } else {
        recommendedAction = 'Maintain close executive oversight on baseline schedule commitments to prevent further schedule variance.';
      }

      return {
        project: p,
        s2Project: s2,
        rank: 0,
        criticalScore,
        spiVal: spiNum,
        status: normStatus,
        laggingParams,
        vowd: { ...vowdData, pct: vowdPct, gap: vowdGap, isLagging: isLaggingVowd },
        labour: { ...labourData, pct: labourPct, gap: labourGap, isLagging: isLaggingLabour },
        milestone: { ...milestoneData, pct: milestonePct, gap: milestoneGap, isLagging: isLaggingMilestone },
        ur: { ...urData, pct: urPct, gap: urGap, isLagging: isLaggingUr },
        uc: { ...ucData, pct: ucPct, gap: ucGap, isLagging: isLaggingUc },
        criticalFindings,
        recommendedAction
      };
    });

    // Sort in descending order of critical severity
    analyzed.sort((a, b) => b.criticalScore - a.criticalScore);

    // Assign Rank 1 to 7
    return analyzed.slice(0, 7).map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [projects, software2Projects, selectedVP, selectedLeader]);

  // Filter list by selected parameter tab
  const filteredCriticalProjects = useMemo(() => {
    if (selectedFilter === 'ALL') return criticalAnalysisList;
    if (selectedFilter === 'VOWD') return criticalAnalysisList.filter(p => p.vowd.isLagging);
    if (selectedFilter === 'LABOUR') return criticalAnalysisList.filter(p => p.labour.isLagging);
    if (selectedFilter === 'MILESTONE') return criticalAnalysisList.filter(p => p.milestone.isLagging);
    if (selectedFilter === 'UR') return criticalAnalysisList.filter(p => p.ur.isLagging);
    if (selectedFilter === 'UC') return criticalAnalysisList.filter(p => p.uc.isLagging);
    return criticalAnalysisList;
  }, [criticalAnalysisList, selectedFilter]);

  if (criticalAnalysisList.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-rose-200/90 rounded-3xl p-6 shadow-sm space-y-6 mt-8" id="attention-needed-root">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-100 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-md shadow-rose-500/20 shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Attention Needed — Top 7 Critical Projects
              </h3>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-200">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              In-depth performance diagnosis analyzing data from <span className="font-bold text-slate-700">April 2026 till date</span>. Highlights specific lagging deliverable parameters, shortfall gaps, and recommended executive recovery actions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse Tab' : 'Expand Top 7 List'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Sub-Tabs: Filter by Lagging Parameter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1 tracking-wider shrink-0">
              Filter by Parameter:
            </span>
            {[
              { id: 'ALL', label: `All Critical (${criticalAnalysisList.length})`, color: 'bg-slate-900 text-white' },
              { id: 'VOWD', label: `VOWD Lag (${criticalAnalysisList.filter(p => p.vowd.isLagging).length})`, color: 'bg-blue-600 text-white' },
              { id: 'LABOUR', label: `Labour Lag (${criticalAnalysisList.filter(p => p.labour.isLagging).length})`, color: 'bg-purple-600 text-white' },
              { id: 'MILESTONE', label: `Milestones Lag (${criticalAnalysisList.filter(p => p.milestone.isLagging).length})`, color: 'bg-emerald-600 text-white' },
              { id: 'UR', label: `Residential UR (${criticalAnalysisList.filter(p => p.ur.isLagging).length})`, color: 'bg-orange-600 text-white' },
              { id: 'UC', label: `Commercial UC (${criticalAnalysisList.filter(p => p.uc.isLagging).length})`, color: 'bg-amber-600 text-white' }
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
              const isCardDetailsOpen = expandedProjectId === item.project.code;
              const p = item.project;

              return (
                <div 
                  key={p.code} 
                  className={`border rounded-2xl transition-all ${
                    item.rank <= 3
                      ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Primary Row Header */}
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left: Rank Badge + Project Details */}
                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        item.rank === 1 ? 'bg-rose-600 text-white shadow-xs' :
                        item.rank === 2 ? 'bg-rose-500 text-white' :
                        item.rank === 3 ? 'bg-rose-400 text-white' :
                        'bg-slate-800 text-white'
                      }`}>
                        #{item.rank}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {p.code}
                          </span>
                          <h4 
                            onClick={() => onSelectProject && onSelectProject(p)}
                            className="text-sm font-extrabold text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                            title={p.name}
                          >
                            {p.name}
                          </h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            item.status.toLowerCase() === 'red' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            item.status.toLowerCase() === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {item.status} Status
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                          <span>Lead: <strong className="text-slate-700">{p.leader || 'Unassigned'}</strong></span>
                          <span>VP: <strong className="text-slate-700">{p.vp || 'Unassigned'}</strong></span>
                          {p.projectStage && <span>Stage: <strong className="text-slate-700">{p.projectStage}</strong></span>}
                          <span>SPI: <strong className={item.spiVal < 0.85 ? 'text-rose-600' : item.spiVal < 1.0 ? 'text-amber-600' : 'text-emerald-600'}>{item.spiVal.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Lagging Parameters Highlight Pills */}
                    <div className="flex flex-wrap items-center gap-2 lg:max-w-[420px]">
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
                              Labour: {item.labour.pct.toFixed(0)}% (-{item.labour.gap}W)
                            </span>
                          );
                        }
                        if (param === 'Milestone') {
                          return (
                            <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Calendar className="w-3 h-3 mr-1 text-emerald-600" />
                              Milestones: {item.milestone.pct.toFixed(0)}% (-{item.milestone.gap}Qty)
                            </span>
                          );
                        }
                        if (param === 'Residential UR') {
                          return (
                            <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <Home className="w-3 h-3 mr-1 text-orange-600" />
                              UR Delivery: {item.ur.pct.toFixed(0)}% (-{item.ur.gap}U)
                            </span>
                          );
                        }
                        if (param === 'Commercial UC') {
                          return (
                            <span key={param} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Briefcase className="w-3 h-3 mr-1 text-amber-600" />
                              UC Delivery: {item.uc.pct.toFixed(0)}% (-{item.uc.gap}U)
                            </span>
                          );
                        }
                        return null;
                      })}

                      {item.laggingParams.length === 0 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                          Near Threshold Variance (SPI: {item.spiVal.toFixed(2)})
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setExpandedProjectId(isCardDetailsOpen ? null : p.code)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        title={isCardDetailsOpen ? 'Hide Analysis' : 'Show Detailed Analysis'}
                      >
                        {isCardDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {onSelectProject && (
                        <button
                          onClick={() => onSelectProject(p)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Expanded Diagnosis Section */}
                  {isCardDetailsOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50 rounded-b-2xl animate-in fade-in duration-150">
                      
                      {/* Critical Findings Box */}
                      <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center space-x-2 text-rose-900 font-extrabold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Critical Findings (Apr 2026 – Till Date Analysis)</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed pl-6">
                          {item.criticalFindings}
                        </p>
                      </div>

                      {/* Recommended Intervention */}
                      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center space-x-2 text-blue-900 font-extrabold">
                          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Recommended Action Plan</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed pl-6">
                          {item.recommendedAction}
                        </p>
                      </div>

                      {/* Parameter Matrix Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                        {/* VOWD */}
                        <div className={`p-3 rounded-xl border ${item.vowd.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">VOWD (Cr.)</span>
                          <span className="text-sm font-black text-slate-900 block">{item.vowd.ach.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ {item.vowd.plan.toFixed(1)}</span></span>
                          <span className={`text-[10px] font-extrabold ${item.vowd.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.vowd.pct.toFixed(0)}% Achieved</span>
                        </div>

                        {/* Labour */}
                        <div className={`p-3 rounded-xl border ${item.labour.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">Labour (Headcount)</span>
                          <span className="text-sm font-black text-slate-900 block">{item.labour.ach.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ {item.labour.plan.toLocaleString()}</span></span>
                          <span className={`text-[10px] font-extrabold ${item.labour.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.labour.pct.toFixed(0)}% Deployed</span>
                        </div>

                        {/* Milestones */}
                        <div className={`p-3 rounded-xl border ${item.milestone.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Milestones (Qty)</span>
                          <span className="text-sm font-black text-slate-900 block">{item.milestone.ach} <span className="text-[10px] text-slate-400 font-normal">/ {item.milestone.plan}</span></span>
                          <span className={`text-[10px] font-extrabold ${item.milestone.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.milestone.pct.toFixed(0)}% Completed</span>
                        </div>

                        {/* Residential UR */}
                        <div className={`p-3 rounded-xl border ${item.ur.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">Residential UR</span>
                          <span className="text-sm font-black text-slate-900 block">{item.ur.ach} <span className="text-[10px] text-slate-400 font-normal">/ {item.ur.plan}</span></span>
                          <span className={`text-[10px] font-extrabold ${item.ur.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.ur.pct.toFixed(0)}% Handed Over</span>
                        </div>

                        {/* Commercial UC */}
                        <div className={`p-3 rounded-xl border ${item.uc.isLagging ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">Commercial UC</span>
                          <span className="text-sm font-black text-slate-900 block">{item.uc.ach} <span className="text-[10px] text-slate-400 font-normal">/ {item.uc.plan}</span></span>
                          <span className={`text-[10px] font-extrabold ${item.uc.pct >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.uc.pct.toFixed(0)}% Handed Over</span>
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

    </div>
  );
}
