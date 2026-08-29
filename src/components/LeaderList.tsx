import { useState, useMemo, useCallback, useEffect } from 'react';
import { LeaderData, Project, MonthlyMetric, Software2Project, FiscalYearKey } from '@/src/types';
import { DEMO_SOFTWARE2_PROJECTS } from '@/src/hooks/useGoogleSheets';
import { generatePdfReport } from '@/src/utils/pdfExport';
import ExportReportModal from './report/ExportReportModal';
import { getDefaultMRMTitle } from '@/src/utils/mrmPdfCompiler';
import AttentionNeededProjects from './AttentionNeededProjects';
import { sortVpNames, sortLeaderItems, sortLeaderNames, isCompleteOrLostStage, isTempProject, parseSpiNumeric, getStageRankForBlankSpi } from '@/src/utils/customOrder';
import { isUnderConstructionStage, parseBudgetValue, formatBudgetDisplay } from '@/src/utils/sheetParser';
import { getFiscalYearConfig, getStoredFiscalYear } from '@/src/utils/fiscalYear';
import { 
  ResponsiveContainer, 
  ComposedChart,
  BarChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid,
  ReferenceLine,
  LabelList
} from 'recharts';
import { 
  Users, 
  Briefcase, 
  Home,
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  DollarSign, 
  BarChart3, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ArrowUpRight, 
  Gauge, 
  Search,
  Maximize2,
  ListTodo,
  ShieldCheck,
  Building,
  Calendar,
  Printer,
  Filter,
  Loader2
} from 'lucide-react';

interface LeaderListProps {
  leaderDataList: LeaderData[];
  software2Projects?: Software2Project[];
  onProjectSelect: (proj: Project) => void;
}

// Helper to ensure unit is consistently in Days
const formatDaysUnit = (val: string | undefined | null): string => {
  if (!val) return '0 Days';
  const clean = val.trim();
  if (clean.toLowerCase().includes('day')) {
    return clean;
  }
  if (!isNaN(parseFloat(clean))) {
    return `${clean} Days`;
  }
  return clean;
};

// Helper to parse numeric values from excel strings safely
const parseNumericValue = (val: string | undefined): number => {
  if (!val) return 0;
  const clean = val.replace(/[$,%\s]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

// Formatter for values (handles currency formats gracefully as Cr.)
const formatValue = (val: number, isCurrency: boolean) => {
  if (isCurrency) {
    // VOWD is represented in Cr. (crore)
    const formatted = val % 1 === 0 ? val.toLocaleString() : val.toFixed(2);
    return `${formatted} Cr.`;
  }
  return Math.round(val).toLocaleString();
};

// Helper to extract clean percentage string
const getPercent = (pct: string | undefined, plan: string | undefined, ach: string | undefined): string => {
  if (pct && pct.trim()) {
    const clean = pct.trim();
    if (clean.endsWith('%')) return clean;
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) {
      if (parsed <= 1.0 && parsed > 0) {
        return `${Math.round(parsed * 100)}%`;
      }
      return `${Math.round(parsed)}%`;
    }
    return clean;
  }
  const pVal = parseNumericValue(plan);
  const aVal = parseNumericValue(ach);
  if (pVal > 0) {
    return `${Math.round((aVal / pVal) * 100)}%`;
  }
  return '0%';
};

// Helper to parse SPI index
const parseSpi = (spiStr: string | undefined): number => {
  if (!spiStr) return 0;
  const parsed = parseFloat(spiStr);
  return isNaN(parsed) ? 0 : parsed;
};

// Config and helper for Stage-wise distribution and "Other" stage selection
const STAGE_CONFIGS: Record<string, {
  id: string;
  label: string;
  title: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
}> = {
  upcoming: {
    id: 'upcoming',
    label: 'Upcoming',
    title: 'Upcoming Stage Projects',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotBg: 'bg-slate-500',
  },
  design: {
    id: 'design',
    label: 'Design',
    title: 'Design Stage Projects',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-100',
    dotBg: 'bg-indigo-500',
  },
  excavation: {
    id: 'excavation',
    label: 'Excavation',
    title: 'Excavation Stage Projects',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-100',
    dotBg: 'bg-amber-500',
  },
  constructionStart: {
    id: 'constructionStart',
    label: 'Start',
    title: 'Construction Start Projects',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-100',
    dotBg: 'bg-cyan-500',
  },
  ongoing: {
    id: 'ongoing',
    label: 'Ongoing',
    title: 'Ongoing Stage Projects',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-100',
    dotBg: 'bg-blue-500',
  },
  finishing: {
    id: 'finishing',
    label: 'Finishing',
    title: 'Finishing Stage Projects',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-100',
    dotBg: 'bg-violet-500',
  },
  nearingCompletion: {
    id: 'nearingCompletion',
    label: 'Nearing Comp',
    title: 'Nearing Completion Projects',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-100',
    dotBg: 'bg-emerald-500',
  },
  handover: {
    id: 'handover',
    label: 'Handover',
    title: 'Handover Stage Projects',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-100',
    dotBg: 'bg-teal-500',
  },
  hold: {
    id: 'hold',
    label: 'On Hold',
    title: 'On Hold Stage Projects',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-100',
    dotBg: 'bg-rose-500',
  },
};

const getStageProjects = (stageKey: string, statsObj: any): string[] => {
  switch (stageKey) {
    case 'upcoming': return statsObj.upcomingProjectNames || [];
    case 'design': return statsObj.designProjectNames || [];
    case 'excavation': return statsObj.excavationProjectNames || [];
    case 'constructionStart': return statsObj.constructionStartProjectNames || [];
    case 'ongoing': return statsObj.ongoingProjectNames || [];
    case 'finishing': return statsObj.finishingProjectNames || [];
    case 'nearingCompletion': return statsObj.nearingCompletionProjectNames || [];
    case 'handover': return statsObj.handoverProjectNames || [];
    case 'hold': return statsObj.holdProjectNames || [];
    default: return statsObj.holdProjectNames || [];
  }
};

export default function LeaderList({ leaderDataList, software2Projects, onProjectSelect }: LeaderListProps) {
  // Include all projects irrespective of stage (e.g. hold, complete, lost, etc.) to keep everything fully in sync
  const filteredLeaderDataList = useMemo(() => {
    if (!leaderDataList || !Array.isArray(leaderDataList)) return [];
    return leaderDataList.map(leader => {
      const activeProjects = leader?.projects || [];

      // Recalculate status counts and areas
      const statusCounts: Record<string, number> = {};
      const areas = new Set<string>();
      activeProjects.forEach(p => {
        if (p) {
          const st = p.status || 'Green';
          statusCounts[st] = (statusCounts[st] || 0) + 1;
          if (p.area) areas.add(String(p.area));
        }
      });

      return {
        ...leader,
        name: String(leader?.name || 'Unassigned'),
        vpName: String(leader?.vpName || 'Unassigned'),
        projectsCount: activeProjects.length,
        statusCounts,
        areas,
        projects: activeProjects
      };
    })
      .filter(leader => leader.projectsCount > 0)
      .sort(sortLeaderItems);
  }, [leaderDataList]);

  // Select active leader and VP filter (default to 'all' for Level 1 Summary)
  const [selectedLeaderName, setSelectedLeaderName] = useState<string>('all');
  const [selectedVP, setSelectedVP] = useState<string>('all');
  const [selectedStageKey, setSelectedStageKey] = useState<string>('hold');

  // Multi-page presentation report export modal state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Consolidated projects across all leaders
  const allLeaderProjects = useMemo(() => {
    return filteredLeaderDataList.flatMap(l => l.projects || []);
  }, [filteredLeaderDataList]);

  // Unique list of VPs and Leaders with Custom Sequence
  const vpList = useMemo(() => {
    const vps = new Set<string>();
    filteredLeaderDataList.forEach(l => {
      if (l.vpName) vps.add(String(l.vpName).trim());
    });
    return Array.from(vps).sort(sortVpNames);
  }, [filteredLeaderDataList]);

  const leaderList = useMemo(() => {
    const leaders = new Set<string>();
    filteredLeaderDataList.forEach(l => {
      if (l.name) leaders.add(String(l.name).trim());
    });
    return Array.from(leaders).sort(sortLeaderNames);
  }, [filteredLeaderDataList]);

  const totalProjectsCount = useMemo(() => {
    return filteredLeaderDataList.reduce((acc, l) => acc + (l.projectsCount || 0), 0);
  }, [filteredLeaderDataList]);

  // State variables for MRM Dashboard Monthly Progress Curve
  const [activeFy, setActiveFy] = useState<FiscalYearKey>(() => getStoredFiscalYear());
  const [mrmChartMetric, setMrmChartMetric] = useState<'vowd' | 'milestone' | 'labour' | 'ur' | 'uc'>('vowd');
  const [mrmBaselinePlan, setMrmBaselinePlan] = useState<'r0' | 'r1' | 'both'>('r1');
  const [mrmShowMonthlyBars, setMrmShowMonthlyBars] = useState<boolean>(true);
  const [mrmShowCumulativeLines, setMrmShowCumulativeLines] = useState<boolean>(true);
  const [isMrmTableCollapsed, setIsMrmTableCollapsed] = useState<boolean>(true);

  useEffect(() => {
    const handleFyChanged = () => setActiveFy(getStoredFiscalYear());
    window.addEventListener('mrm-fiscal-year-changed', handleFyChanged);
    return () => window.removeEventListener('mrm-fiscal-year-changed', handleFyChanged);
  }, []);
  
  // Individual leader search query for their projects
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');

  // Find active leader data or construct consolidated view
  const activeLeader = useMemo(() => {
    if (filteredLeaderDataList.length === 0) return null;

    if (selectedLeaderName === 'all') {
      const leadersInVP = selectedVP === 'all'
        ? filteredLeaderDataList
        : filteredLeaderDataList.filter(l => l.vpName === selectedVP);

      const combinedProjects = leadersInVP.flatMap(l => l.projects);
      const statusCounts: Record<string, number> = {};
      const areas = new Set<string>();
      let activeCount = 0;
      combinedProjects.forEach(p => {
        const isTemp = isTempProject(p.code);
        const isCompletedOrLost = isCompleteOrLostStage(p.projectStage);
        if (!isTemp && !isCompletedOrLost) {
          activeCount += 1;
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        }
        if (p.area) areas.add(p.area);
      });

      return {
        name: selectedVP === 'all' ? 'All Projects Summary' : `VP: ${selectedVP} Summary`,
        vpName: selectedVP === 'all' ? 'Consolidated All VPs' : selectedVP,
        projectsCount: activeCount,
        statusCounts,
        areas,
        projects: combinedProjects
      };
    }

    const found = filteredLeaderDataList.find(l => l.name === selectedLeaderName);
    if (found) return found;

    return filteredLeaderDataList[0];
  }, [filteredLeaderDataList, selectedLeaderName, selectedVP]);

  // Compute stats for selected leader
  const stats = useMemo(() => {
    if (!activeLeader) return null;

    let totalArea = 0;
    let areaUnderConstruction = 0;
    let spiSum = 0;
    let spiCount = 0;

    let msPlan = 0;
    let msAch = 0;
    let msFr = 0;

    let vowdPlan = 0;
    let vowdAch = 0;
    let vowdFr = 0;

    let labPlan = 0;
    let labAch = 0;
    let labFr = 0;

    let qualitySum = 0;
    let qualityCount = 0;
    let safetySum = 0;
    let safetyCount = 0;
    let avgQhseSum = 0;
    let avgQhseCount = 0;

    const stageCounts = {
      upcoming: 0,
      design: 0,
      excavation: 0,
      constructionStart: 0,
      ongoing: 0,
      finishing: 0,
      nearingCompletion: 0,
      handover: 0,
      hold: 0,
    };

    const upcomingProjectNames: string[] = [];
    const designProjectNames: string[] = [];
    const excavationProjectNames: string[] = [];
    const constructionStartProjectNames: string[] = [];
    const ongoingProjectNames: string[] = [];
    const finishingProjectNames: string[] = [];
    const nearingCompletionProjectNames: string[] = [];
    const handoverProjectNames: string[] = [];
    const holdProjectNames: string[] = [];

    const upcomingProjects: Project[] = [];
    const designProjects: Project[] = [];
    const excavationProjects: Project[] = [];
    const constructionStartProjects: Project[] = [];
    const ongoingProjects: Project[] = [];
    const finishingProjects: Project[] = [];
    const nearingCompletionProjects: Project[] = [];
    const handoverProjects: Project[] = [];
    const holdProjects: Project[] = [];

    let totalBudgetUnderManagement = 0;
    let totalBudgetUnderConstruction = 0;
    let projectsUnderConstructionCount = 0;
    let activeProjectsUnderManagementCount = 0;

    (activeLeader.projects || []).forEach(p => {
      if (!p) return;

      const isTemp = isTempProject(p.code);
      const isCompletedOrLost = isCompleteOrLostStage(p.projectStage);
      const budgetVal = parseBudgetValue(p.totalBudget);

      // Area
      let areaVal = 0;
      if (p.areaSqft) {
        const val = parseFloat(String(p.areaSqft).replace(/,/g, ''));
        if (!isNaN(val)) {
          areaVal = val;
        }
      }

      // 1. Under Management & Stage Tracking:
      // If project is NOT temp AND NOT complete/complete-old/lost:
      // Count project, area, budget, and active stages
      if (!isTemp && !isCompletedOrLost) {
        activeProjectsUnderManagementCount += 1;
        totalArea += areaVal;
        totalBudgetUnderManagement += budgetVal;

        if (isUnderConstructionStage(p.projectStage)) {
          projectsUnderConstructionCount += 1;
          areaUnderConstruction += areaVal;
          totalBudgetUnderConstruction += budgetVal;
        }

        // Stage tracking & list population (ONLY for active non-temp projects)
        if (p.projectStage) {
          const stage = String(p.projectStage).trim().toLowerCase();
          const pName = p.name || p.code || 'Project';
          
          if (stage.includes('upcoming')) {
            stageCounts.upcoming++;
            upcomingProjectNames.push(pName);
            upcomingProjects.push(p);
          } else if (stage.includes('design')) {
            stageCounts.design++;
            designProjectNames.push(pName);
            designProjects.push(p);
          } else if (stage.includes('excavation')) {
            stageCounts.excavation++;
            excavationProjectNames.push(pName);
            excavationProjects.push(p);
          } else if (stage.includes('construction start') || stage === 'construction start') {
            stageCounts.constructionStart++;
            constructionStartProjectNames.push(pName);
            constructionStartProjects.push(p);
          } else if (stage.includes('ongoing') || stage.includes('on going') || stage === 'on going project' || stage.includes('execution')) {
            stageCounts.ongoing++;
            ongoingProjectNames.push(pName);
            ongoingProjects.push(p);
          } else if (stage.includes('finishing')) {
            stageCounts.finishing++;
            finishingProjectNames.push(pName);
            finishingProjects.push(p);
          } else if (stage.includes('nearing completion') || stage.includes('nearing_completion')) {
            stageCounts.nearingCompletion++;
            nearingCompletionProjectNames.push(pName);
            nearingCompletionProjects.push(p);
          } else if (stage.includes('handover') || stage.includes('hand_over')) {
            stageCounts.handover++;
            handoverProjectNames.push(pName);
            handoverProjects.push(p);
          } else if (stage.includes('hold') || stage.includes('on hold')) {
            stageCounts.hold++;
            holdProjectNames.push(pName);
            holdProjects.push(p);
          }
        }
      }

      // 2. Parameters: VOWD, labour, milestone, SPI, QHSE:
      // ALWAYS CONSIDER (both plan & achievement) for ALL projects, including temp and completed/lost!

      // SPI
      if (p.spi) {
        const val = parseFloat(String(p.spi));
        if (!isNaN(val)) {
          spiSum += val;
          spiCount++;
        }
      }

      // Ratings
      if (p.qualityRating && p.qualityRating !== '-') {
        const val = parseFloat(String(p.qualityRating).replace(/%/g, ''));
        if (!isNaN(val)) {
          qualitySum += val;
          qualityCount++;
        }
      }
      if (p.safetyRating && p.safetyRating !== '-') {
        const val = parseFloat(String(p.safetyRating).replace(/%/g, ''));
        if (!isNaN(val)) {
          safetySum += val;
          safetyCount++;
        }
      }
      if (p.avgQhseRating && p.avgQhseRating !== '-') {
        const val = parseFloat(String(p.avgQhseRating).replace(/%/g, ''));
        if (!isNaN(val)) {
          avgQhseSum += val;
          avgQhseCount++;
        }
      }

      // Milestones
      if (p.milestonePlan) {
        const val = parseInt(String(p.milestonePlan).replace(/,/g, ''));
        if (!isNaN(val)) msPlan += val;
      }
      if (p.milestoneAch) {
        const val = parseInt(String(p.milestoneAch).replace(/,/g, ''));
        if (!isNaN(val)) msAch += val;
      }
      if (p.milestoneFr) {
        const val = parseInt(String(p.milestoneFr).replace(/,/g, ''));
        if (!isNaN(val)) msFr += val;
      }

      // VOWD
      if (p.vowdPlan) {
        const val = parseFloat(String(p.vowdPlan).replace(/[$,]/g, ''));
        if (!isNaN(val)) vowdPlan += val;
      }
      if (p.vowdAch) {
        const val = parseFloat(String(p.vowdAch).replace(/[$,]/g, ''));
        if (!isNaN(val)) vowdAch += val;
      }
      if (p.vowdFr) {
        const val = parseFloat(String(p.vowdFr).replace(/[$,]/g, ''));
        if (!isNaN(val)) vowdFr += val;
      }

      // Labour
      if (p.labourPlan) {
        const val = parseInt(String(p.labourPlan).replace(/,/g, ''));
        if (!isNaN(val)) labPlan += val;
      }
      if (p.labourAch) {
        const val = parseInt(String(p.labourAch).replace(/,/g, ''));
        if (!isNaN(val)) labAch += val;
      }
      if (p.labourFr) {
        const val = parseInt(String(p.labourFr).replace(/,/g, ''));
        if (!isNaN(val)) labFr += val;
      }
    });

    const avgSpi = spiCount > 0 ? (spiSum / spiCount) : null;
    const msPct = msPlan > 0 ? Math.round((msAch / msPlan) * 100) : 0;
    const vowdPct = vowdPlan > 0 ? Math.round((vowdAch / vowdPlan) * 100) : 0;
    const labPct = labPlan > 0 ? Math.round((labAch / labPlan) * 100) : 0;

    const leaderQualityRating = qualityCount > 0 ? (qualitySum / qualityCount) : null;
    const leaderSafetyRating = safetyCount > 0 ? (safetySum / safetyCount) : null;
    const leaderAvgQhseRating = avgQhseCount > 0 ? (avgQhseSum / avgQhseCount) : null;

    return {
      totalArea,
      areaUnderConstruction,
      totalBudgetUnderManagement,
      totalBudgetUnderConstruction,
      projectsUnderConstructionCount,
      underManagement: {
        count: activeProjectsUnderManagementCount,
        area: totalArea,
        budget: totalBudgetUnderManagement,
        budgetFormatted: formatBudgetDisplay(totalBudgetUnderManagement)
      },
      underConstruction: {
        count: projectsUnderConstructionCount,
        area: areaUnderConstruction,
        budget: totalBudgetUnderConstruction,
        budgetFormatted: formatBudgetDisplay(totalBudgetUnderConstruction)
      },
      avgSpi,
      milestones: { plan: msPlan, ach: msAch, pct: msPct, fr: msFr },
      vowd: { plan: vowdPlan, ach: vowdAch, pct: vowdPct, fr: vowdFr },
      labour: { plan: labPlan, ach: labAch, pct: labPct, fr: labFr },
      stageCounts,
      leaderQualityRating,
      leaderSafetyRating,
      leaderAvgQhseRating,
      upcomingProjectNames,
      designProjectNames,
      excavationProjectNames,
      constructionStartProjectNames,
      ongoingProjectNames,
      finishingProjectNames,
      nearingCompletionProjectNames,
      handoverProjectNames,
      holdProjectNames,
      upcomingProjects,
      designProjects,
      excavationProjects,
      constructionStartProjects,
      ongoingProjects,
      finishingProjects,
      nearingCompletionProjects,
      handoverProjects,
      holdProjects
    };
  }, [activeLeader]);

  // Handle leader selection
  const handleLeaderSelect = (name: string) => {
    setSelectedLeaderName(name);
    setProjectSearchQuery('');
  };

  // Filter projects based on search query inside the active leader dashboard (exclude complete, Complete-old, lost from flash cards)
  const filteredProjects = useMemo(() => {
    if (!activeLeader || !activeLeader.projects) return [];
    return activeLeader.projects.filter(p => {
      if (!p || isTempProject(p.code)) return false;
      // Do not display complete, Complete-old, or lost projects in the flash card dashboard
      if (isCompleteOrLostStage(p.projectStage)) {
        return false;
      }
      const term = (projectSearchQuery || '').toLowerCase().trim();
      if (!term) return true;
      return (
        (p.code && String(p.code).toLowerCase().includes(term)) ||
        (p.name && String(p.name).toLowerCase().includes(term)) ||
        (p.area && String(p.area).toLowerCase().includes(term)) ||
        (p.projectStage && String(p.projectStage).toLowerCase().includes(term))
      );
    });
  }, [activeLeader, projectSearchQuery]);

  // Sort projects descending by SPI.
  // For projects with SPI - blank or NA, follow sequence: Handover -> Construction Start -> Excavation -> Design -> Upcoming -> Hold
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const spiA = parseSpiNumeric(a.spi);
      const spiB = parseSpiNumeric(b.spi);

      if (spiA !== null && spiB !== null) {
        return spiB - spiA;
      }
      if (spiA !== null && spiB === null) {
        return -1;
      }
      if (spiA === null && spiB !== null) {
        return 1;
      }

      // Both have blank or NA SPI -> follow requested stage sequence
      const rankA = getStageRankForBlankSpi(a.projectStage);
      const rankB = getStageRankForBlankSpi(b.projectStage);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return (a.code || a.name || '').localeCompare(b.code || b.name || '');
    });
  }, [filteredProjects]);

  // Metric configuration for the 5 graph metrics
  const mrmMetricConfigs = useMemo(() => ({
    vowd: {
      label: 'VOWD (Value of Work Done)',
      shortLabel: 'VOWD',
      unit: 'Cr.',
      colorPlan: '#818cf8',
      colorAch: '#4f46e5',
      isCurrency: true
    },
    milestone: {
      label: 'Milestones Completed',
      shortLabel: 'Milestones',
      unit: 'Nos.',
      colorPlan: '#38bdf8',
      colorAch: '#0284c7',
      isCurrency: false
    },
    labour: {
      label: 'Labour Headcount',
      shortLabel: 'Labour',
      unit: 'Labours',
      colorPlan: '#c084fc',
      colorAch: '#7e22ce',
      isCurrency: false
    },
    ur: {
      label: 'Unit Delivery - Residential (UR)',
      shortLabel: 'Residential Delivery',
      unit: 'Units',
      colorPlan: '#fb923c',
      colorAch: '#c2410c',
      isCurrency: false
    },
    uc: {
      label: 'Unit Delivery - Commercial (UC)',
      shortLabel: 'Commercial Delivery',
      unit: 'Sqft',
      colorPlan: '#fcd34d',
      colorAch: '#b45309',
      isCurrency: false
    }
  }), []);

  // Active software2 project data source
  const s2List = useMemo(() => {
    return (software2Projects && software2Projects.length > 0) ? software2Projects : DEMO_SOFTWARE2_PROJECTS;
  }, [software2Projects]);

  // Map activeLeader projects to Software2Project items with monthly metrics
  const s2ProjectsForActiveLeader = useMemo(() => {
    if (!s2List || s2List.length === 0) return [];
    if (!activeLeader || !activeLeader.projects || activeLeader.projects.length === 0) return s2List;

    const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (selectedLeaderName === 'all' && selectedVP === 'all') {
      return s2List;
    }

    if (selectedLeaderName !== 'all') {
      const byLeader = s2List.filter(s => norm(s.leader) === norm(selectedLeaderName));
      if (byLeader.length > 0) return byLeader;
    }

    if (selectedVP !== 'all') {
      const byVp = s2List.filter(s => norm(s.vp) === norm(selectedVP));
      if (byVp.length > 0) return byVp;
    }

    const matched: Software2Project[] = [];

    activeLeader.projects.forEach(p => {
      if (!p) return;
      if ((p as any)[mrmChartMetric] && Array.isArray((p as any)[mrmChartMetric])) {
        matched.push(p as unknown as Software2Project);
        return;
      }
      const s2P = s2List.find(s => 
        (s.code && p.code && norm(s.code) === norm(p.code)) ||
        (s.name && p.name && (norm(s.name) === norm(p.name) || norm(s.name).includes(norm(p.name)) || norm(p.name).includes(norm(s.name))))
      );
      if (s2P && !matched.some(m => m.code === s2P.code)) {
        matched.push(s2P);
      }
    });

    return matched.length > 0 ? matched : s2List;
  }, [activeLeader, s2List, mrmChartMetric, selectedLeaderName, selectedVP]);

  // Aggregated Monthly Progress Curve Data across active portfolio
  const mrmMonthlyData = useMemo(() => {
    if (s2ProjectsForActiveLeader.length === 0) return [];

    const fyConfig = getFiscalYearConfig(activeFy);
    const months = fyConfig.months.map(m => m.key);

    let cumR0 = 0;
    let cumR1 = 0;
    let cumPlan = 0;
    let cumAch = 0;

    return months.map(m => {
      let planSum = 0;
      let planR0Sum = 0;
      let planR1Sum = 0;
      let achSum = 0;
      let hasExplicitAch = false;

      s2ProjectsForActiveLeader.forEach(p => {
        const metricList = p[mrmChartMetric];
        const monthData = metricList ? metricList.find(d => d.month === m) : null;

        if (monthData) {
          const pR0 = monthData.planR0 !== undefined ? monthData.planR0 : monthData.plan;
          const pR1 = monthData.planR1 !== undefined ? monthData.planR1 : pR0;
          
          planR0Sum += pR0;
          planR1Sum += pR1;
          achSum += monthData.achievement;
          if (monthData.achievement > 0) {
            hasExplicitAch = true;
          }

          if (mrmBaselinePlan === 'r0') {
            planSum += pR0;
          } else {
            planSum += pR1;
          }
        }
      });

      planSum = Math.round(planSum * 10) / 10;
      planR0Sum = Math.round(planR0Sum * 10) / 10;
      planR1Sum = Math.round(planR1Sum * 10) / 10;
      achSum = Math.round(achSum * 10) / 10;

      const pct = planSum > 0 ? Math.round((achSum / planSum) * 100) : 0;

      cumR0 = Math.round((cumR0 + planR0Sum) * 10) / 10;
      cumR1 = Math.round((cumR1 + planR1Sum) * 10) / 10;
      cumPlan = Math.round((cumPlan + planSum) * 10) / 10;
      cumAch = Math.round((cumAch + achSum) * 10) / 10;

      const cumPct = mrmBaselinePlan === 'both'
        ? (cumR1 > 0 ? Math.round((cumAch / cumR1) * 100) : 0)
        : (cumPlan > 0 ? Math.round((cumAch / cumPlan) * 100) : 0);

      const isFutureMonth = !hasExplicitAch && months.indexOf(m) > 3;

      return {
        month: m,
        Plan: planSum,
        PlanR0: planR0Sum,
        PlanR1: planR1Sum,
        Achievement: isFutureMonth ? null : achSum,
        'Achievement %': isFutureMonth ? null : pct,
        CumPlanR0: cumR0,
        CumPlanR1: cumR1,
        CumPlan: cumPlan,
        CumAchievement: isFutureMonth ? null : cumAch,
        'CumAchievement %': isFutureMonth ? null : cumPct
      };
    });
  }, [s2ProjectsForActiveLeader, mrmChartMetric, mrmBaselinePlan, activeFy]);

  const currentMrmConfig = mrmMetricConfigs[mrmChartMetric];

  // Index of the last completed month in mrmMonthlyData (e.g. Jul-26)
  const lastCompletedMonthIndex = useMemo(() => {
    for (let i = mrmMonthlyData.length - 1; i >= 0; i--) {
      if (mrmMonthlyData[i].Achievement !== null && mrmMonthlyData[i].Achievement !== undefined) {
        return i;
      }
    }
    return 3; // Fallback to index 3 ("Jul-26")
  }, [mrmMonthlyData]);

  // Data label renderer for Monthly Bars (Presentation-ready font size)
  const renderBarPlanLabel = useCallback((props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const cx = x + (width ? width / 2 : 0);
    return (
      <text
        x={cx}
        y={y - 5}
        fill="#475569"
        fontSize={10.5}
        fontWeight={800}
        textAnchor="middle"
      >
        {formatted}
      </text>
    );
  }, []);

  const renderBarAchLabel = useCallback((props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const cx = x + (width ? width / 2 : 0);
    return (
      <text
        x={cx}
        y={y - 5}
        fill={currentMrmConfig.colorAch}
        fontSize={10.5}
        fontWeight={800}
        textAnchor="middle"
      >
        {formatted}
      </text>
    );
  }, [currentMrmConfig.colorAch]);

  // Data label renderer for Cumulative Plan Line (Only for Mar 27 & Last Completed Month)
  const renderCumPlanLineLabel = useCallback((props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;

    const isLastCompleted = index === lastCompletedMonthIndex;
    const isMar27 = index === mrmMonthlyData.length - 1;

    if (!isLastCompleted && !isMar27) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;

    return (
      <g>
        <rect
          x={x - 24}
          y={y - 23}
          width={48}
          height={18}
          rx={4}
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth={1.5}
        />
        <text
          x={x}
          y={y - 10}
          fill="#1e293b"
          fontSize={10.5}
          fontWeight={800}
          textAnchor="middle"
        >
          {formatted}
        </text>
      </g>
    );
  }, [lastCompletedMonthIndex, mrmMonthlyData.length]);

  // Data label renderer for Cumulative Achievement Line (Only for Last Completed Month)
  const renderCumAchLineLabel = useCallback((props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;

    const isLastCompleted = index === lastCompletedMonthIndex;
    if (!isLastCompleted) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const row = mrmMonthlyData[index];
    const pct = row ? row['CumAchievement %'] : 0;
    const labelText = pct > 0 ? `${formatted} (${pct}%)` : `${formatted}`;

    return (
      <g>
        <rect
          x={x - 38}
          y={y - 25}
          width={76}
          height={20}
          rx={5}
          fill="#1e1b4b"
          stroke="#4f46e5"
          strokeWidth={1.5}
        />
        <text
          x={x}
          y={y - 11}
          fill="#ffffff"
          fontSize={10.5}
          fontWeight={800}
          textAnchor="middle"
        >
          {labelText}
        </text>
      </g>
    );
  }, [lastCompletedMonthIndex, mrmMonthlyData]);

  // Calculate On Track Count and SPI distribution based on Schedule B (SPI >= 1.0)
  const spiStats = useMemo(() => {
    if (!activeLeader) return { green: 0, amber: 0, red: 0 };
    let green = 0;
    let amber = 0;
    let red = 0;
    activeLeader.projects.forEach(p => {
      if (p.spi) {
        const val = parseFloat(p.spi);
        if (!isNaN(val)) {
          if (val >= 1.0) green++;
          else if (val >= 0.85) amber++;
          else red++;
        } else {
          if (p.status === 'Green') green++;
          else if (p.status === 'Amber') amber++;
          else red++;
        }
      } else {
        if (p.status === 'Green') green++;
        else if (p.status === 'Amber') amber++;
        else red++;
      }
    });
    return { green, amber, red };
  }, [activeLeader]);

  const onTrackCount = spiStats.green;

  // 1. Speed of construction = (VOWD ach / area) * 10^7 (unit: VOWD/Sqft)
  const speedOfConstruction = (stats && stats.areaUnderConstruction > 0
    ? (stats.vowd.ach / stats.areaUnderConstruction)
    : 0) * 10000000;

  // 2. Labour productivity = (VOWD ach / Labour ach) * 10^7 (unit: VOWD/lab/day)
  const labourProductivity = (stats && stats.labour.ach > 0
    ? (stats.vowd.ach / stats.labour.ach)
    : 0) * 10000000;

  // 3. Labour efficiency = labour productivity * 26 * 100 / 10^7 * 10^7 (unit: Cr. per 100 labours)
  const labourEfficiency = (stats && stats.labour.ach > 0
    ? (stats.vowd.ach / stats.labour.ach)
    : 0) * 26 * 100;

  const formatMetricValue = (val: number, decimals: number = 2) => {
    if (val === 0) return '0';
    if (val < 0.01) {
      return val.toFixed(4);
    }
    return val.toFixed(decimals);
  };

  // Auto-generated MRM Reporting Month (Previous Month relative to current date)
  const reportingMonthText = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g. "August 2026"
  }, []);

  if (filteredLeaderDataList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500" id="leader-no-data">
        <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="font-bold">No Leader Data Available</p>
        <p className="text-xs text-slate-400 mt-1">Please map leader column correctly or load valid spreadsheet data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans" id="leaderwise-dashboard-root">
      
      {/* PRINT-ONLY OFFICIAL REPORT HEADER */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 print-avoid-break" id="mrm-print-header">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase text-indigo-700 tracking-widest">Planedge Construction Management</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">Monthly Review Meeting (MRM)</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {selectedLeaderName !== 'all' 
                ? `Performance Report: Leader ${selectedLeaderName}` 
                : selectedVP !== 'all' 
                  ? `Performance Report: VP ${selectedVP} Consolidated` 
                  : 'Consolidated Portfolio Performance Report'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Generated on {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Filter Context: VP: <span className="font-bold">{selectedVP}</span> &bull; Leader: <span className="font-bold">{selectedLeaderName}</span> &bull; Active Projects: <span className="font-bold">{activeLeader?.projectsCount || 0}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-slate-800 tracking-tight">PLANEDGE</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Project Management Console</div>
          </div>
        </div>
      </div>

      {/* Upper Descriptive Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Monthly Review Meeting (MRM) Dashboard
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Reporting Month: <span className="font-bold text-slate-800">{reportingMonthText}</span>
          </p>
        </div>

        <button
          onClick={() => setShowExportModal(true)}
          className="inline-flex items-center px-4 py-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-2xs no-print cursor-pointer shrink-0"
          id="mrm-export-pdf-btn"
          title="Export Full Presentation Report formatted for A4 Landscape (matching 62-page reference)"
        >
          <Printer className="w-4 h-4 mr-2 text-indigo-600" />
          <span>Export PDF Report</span>
        </button>
      </div>

      {/* 3-Level Hierarchical Filter System */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs" id="mrm-3level-filter-card">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2 text-slate-800">
            <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Level-Based Filter System</h3>
          </div>
          
          <button
            onClick={() => {
              setSelectedVP('all');
              setSelectedLeaderName('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedVP === 'all' && selectedLeaderName === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Reset All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Level 1: All Projects */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Level 1: All Projects
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {totalProjectsCount} Projects
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedVP('all');
                setSelectedLeaderName('all');
              }}
              className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
                selectedVP === 'all' && selectedLeaderName === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {selectedVP === 'all' && selectedLeaderName === 'all' ? '✓ Displaying All' : 'Select All Projects'}
            </button>
          </div>

          {/* Level 2: VP */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Level 2: VP
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {vpList.length} VPs
              </span>
            </div>
            <select
              value={selectedVP}
              onChange={(e) => {
                const newVp = e.target.value;
                setSelectedVP(newVp);
                setSelectedLeaderName('all');
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="all">🌐 All VPs (Consolidated)</option>
              {vpList.map(vp => (
                <option key={vp} value={vp}>👤 VP: {vp}</option>
              ))}
            </select>
          </div>

          {/* Level 3: Leader */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Level 3: Leader
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {leaderList.length} Leaders
              </span>
            </div>
            <select
              value={selectedLeaderName}
              onChange={(e) => {
                const newLeader = e.target.value;
                if (newLeader === 'all') {
                  setSelectedLeaderName('all');
                } else {
                  setSelectedLeaderName(newLeader);
                  const found = filteredLeaderDataList.find(l => l.name === newLeader);
                  if (found && found.vpName) {
                    setSelectedVP(found.vpName);
                  }
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="all">👥 All Leaders (Summary)</option>
              {filteredLeaderDataList.map(l => {
                const isOutsideVP = selectedVP !== 'all' && l.vpName !== selectedVP;
                return (
                  <option 
                    key={l.name} 
                    value={l.name}
                    className={isOutsideVP ? 'text-slate-400 bg-slate-50' : ''}
                  >
                    Leader: {l.name} ({l.vpName}){isOutsideVP ? ' - outside selected VP' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Leader Selector Bar - placed below title horizontally */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4.5 shadow-xs space-y-3" id="leader-selector-horizontal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Active Leaders ({selectedVP === 'all' ? filteredLeaderDataList.length : filteredLeaderDataList.filter(l => l.vpName === selectedVP).length})
          </span>
          <p className="text-[11px] text-slate-500">Select a leader to load their full performance window.</p>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200" id="leader-horizontal-list">
          {/* Summary option button */}
          <button
            onClick={() => setSelectedLeaderName('all')}
            className={`flex-shrink-0 text-left px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-3 relative group cursor-pointer ${
              selectedLeaderName === 'all' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15' 
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300'
            }`}
            id="leader-btn-all-summary"
          >
            <div className="truncate pr-1">
              <span className={`text-xs font-extrabold truncate block ${selectedLeaderName === 'all' ? 'text-white' : 'text-slate-800'}`}>
                🌐 All Leaders Summary
              </span>
              <span className={`text-[9px] block mt-0.5 ${selectedLeaderName === 'all' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {activeLeader?.projectsCount || totalProjectsCount} Projects Consolidated
              </span>
            </div>
          </button>

          {filteredLeaderDataList
            .filter(leader => selectedVP === 'all' || leader.vpName === selectedVP)
            .map((leader) => {
              const isSelected = leader.name === selectedLeaderName;
              const statusG = leader.statusCounts['Green'] || 0;
              const statusA = leader.statusCounts['Amber'] || 0;
              const statusR = leader.statusCounts['Red'] || 0;

              return (
                <button
                  key={leader.name}
                  onClick={() => {
                    setSelectedLeaderName(leader.name);
                    if (leader.vpName) setSelectedVP(leader.vpName);
                  }}
                  className={`flex-shrink-0 text-left px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-3 relative group cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15' 
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300'
                  }`}
                  id={`leader-btn-${leader.name.replace(/\s+/g, '-')}`}
                >
                  <div className="truncate pr-1">
                    <span className={`text-xs font-extrabold truncate block ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {leader.name}
                    </span>
                    <span className={`text-[9px] block mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {leader.projectsCount} {leader.projectsCount === 1 ? 'Project' : 'Projects'} &bull; <span className="font-semibold">{leader.vpName}</span>
                    </span>
                  </div>

                  {/* Tiny Status Pills */}
                  <div className="flex items-center space-x-1.5 shrink-0 border-l pl-2.5 border-dashed border-current/15">
                    {statusG > 0 && (
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} title={`${statusG} Green`} />
                    )}
                    {statusA > 0 && (
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-400'}`} title={`${statusA} Amber`} />
                    )}
                    {statusR > 0 && (
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-500'}`} title={`${statusR} Red`} />
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* FULL WIDTH DASHBOARD MAIN VIEW */}
      <div className="space-y-6" id="leader-dashboard-main-view">
        
        {activeLeader && stats ? (
            <>
              {/* Leader Meta Header Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden" id="leader-window-header">
                <div className="absolute top-0 right-0 h-full w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
                  <Gauge className="w-48 h-48 text-indigo-400" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold tracking-tight">{activeLeader.name}</h3>
                      <p className="text-xs text-slate-300">
                        Overseeing a collection of <span className="text-indigo-300 font-bold">{activeLeader.projectsCount} operational projects</span> under <span className="text-slate-200 font-semibold">{activeLeader.vpName}</span>.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center flex-wrap">
                      <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl p-2.5 px-4 shadow-sm">
                        <div>
                          <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">Health Standing</span>
                          <span className="text-sm font-extrabold text-white">
                            {onTrackCount} / {activeLeader.projectsCount} On Track
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive KPI Aggregate Highlights Row: 1. Under Management vs 2. Under Construction */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="leader-primary-kpis-grid">
                
                {/* 1. Under Management Panel */}
                <div className="bg-gradient-to-br from-white via-indigo-50/25 to-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3.5 relative overflow-hidden" id="leader-kpi-under-management">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">1. Under Management</h4>
                        <p className="text-[10px] text-slate-400">Total portfolio active scope across all stages</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-extrabold">
                      {stats.underManagement.count} {stats.underManagement.count === 1 ? 'Project' : 'Projects'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">No. of Projects</span>
                      <span className="text-xl font-black text-slate-900 block mt-0.5">{stats.underManagement.count}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Total portfolio</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Area</span>
                      <span className="text-base sm:text-lg font-black text-indigo-700 block mt-0.5 truncate">
                        {stats.underManagement.area > 0 ? stats.underManagement.area.toLocaleString() : '0'}{' '}
                        <span className="text-[10px] font-bold text-slate-500">Sqft</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Mapped spatial</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Budget</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5 truncate">
                        {stats.underManagement.budget > 0 ? `₹ ${stats.underManagement.budgetFormatted}` : 'N/A'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Portfolio budget</span>
                    </div>
                  </div>
                </div>

                {/* 2. Under Construction Panel */}
                <div className="bg-gradient-to-br from-white via-emerald-50/25 to-slate-50 border border-emerald-200/80 rounded-3xl p-5 shadow-xs space-y-3.5 relative overflow-hidden" id="leader-kpi-under-construction">
                  <div className="flex items-center justify-between border-b border-emerald-100/70 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">2. Under Construction</h4>
                        <p className="text-[10px] text-emerald-600 font-medium">Start • Ongoing • Finishing • Nearing Comp</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full text-[10px] font-extrabold">
                      {stats.underConstruction.count} {stats.underConstruction.count === 1 ? 'Project' : 'Projects'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-2xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">No. of Projects</span>
                      <span className="text-xl font-black text-emerald-800 block mt-0.5">{stats.underConstruction.count}</span>
                      <span className="text-[9px] text-emerald-600/80 font-medium">In active execution</span>
                    </div>

                    <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-2xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Const. Area</span>
                      <span className="text-base sm:text-lg font-black text-emerald-700 block mt-0.5 truncate">
                        {stats.underConstruction.area > 0 ? stats.underConstruction.area.toLocaleString() : '0'}{' '}
                        <span className="text-[10px] font-bold text-emerald-600/70">Sqft</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Active site area</span>
                    </div>

                    <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-2xs">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Const. Budget</span>
                      <span className="text-base sm:text-lg font-black text-emerald-800 block mt-0.5 truncate">
                        {stats.underConstruction.budget > 0 ? `₹ ${stats.underConstruction.budgetFormatted}` : '₹ 0 Cr.'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Construction budget</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Separate Block for Project Stages Distribution */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 relative overflow-visible" id="leader-stages-distribution">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">Stage-wise Project Distribution</h4>
                  <span className="text-[10px] text-slate-400 font-semibold italic">Hover over any stage to see project names</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 relative overflow-visible">
                  {/* Upcoming */}
                  <div 
                    onClick={() => setSelectedStageKey('upcoming')}
                    className={`group relative hover:z-[100] bg-slate-50 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'upcoming' ? 'ring-2 ring-slate-600 border-slate-400 shadow-sm' : 'border border-slate-150 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Upcoming</span>
                    <span className="text-lg font-extrabold text-slate-700 block mt-1">{stats.stageCounts.upcoming}</span>
                    
                    {/* Tooltip Popup (Left-aligned) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full left-0 z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-slate-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Upcoming Stage</span>
                        <span className="bg-slate-700 text-white px-2 py-0.5 rounded text-[10px] font-black">{stats.upcomingProjects.length} {stats.upcomingProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.upcomingProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.upcomingProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full left-6 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* Design Stage */}
                  <div 
                    onClick={() => setSelectedStageKey('design')}
                    className={`group relative hover:z-[100] bg-indigo-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'design' ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-sm' : 'border border-indigo-100 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-tight block">Design</span>
                    <span className="text-lg font-extrabold text-indigo-700 block mt-1">{stats.stageCounts.design}</span>

                    {/* Tooltip Popup (Left-aligned) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full left-0 z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-indigo-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Design Stage</span>
                        <span className="bg-indigo-900 text-indigo-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.designProjects.length} {stats.designProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.designProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.designProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full left-8 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* Excavation Stage */}
                  <div 
                    onClick={() => setSelectedStageKey('excavation')}
                    className={`group relative hover:z-[100] bg-amber-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'excavation' ? 'ring-2 ring-amber-500 border-amber-400 shadow-sm' : 'border border-amber-100 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-tight block">Excavation</span>
                    <span className="text-lg font-extrabold text-amber-700 block mt-1">{stats.stageCounts.excavation}</span>

                    {/* Tooltip Popup (Centered) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full left-1/2 -translate-x-1/2 z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-amber-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Excavation Stage</span>
                        <span className="bg-amber-900 text-amber-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.excavationProjects.length} {stats.excavationProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.excavationProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.excavationProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* Construction Start */}
                  <div 
                    onClick={() => setSelectedStageKey('constructionStart')}
                    className={`group relative hover:z-[100] bg-cyan-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'constructionStart' ? 'ring-2 ring-cyan-500 border-cyan-400 shadow-sm' : 'border border-cyan-100 hover:border-cyan-300'
                    }`}
                  >
                    <span className="text-[10px] text-cyan-500 font-extrabold uppercase tracking-tight block">Start</span>
                    <span className="text-lg font-extrabold text-cyan-700 block mt-1">{stats.stageCounts.constructionStart}</span>

                    {/* Tooltip Popup (Centered) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full left-1/2 -translate-x-1/2 z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-cyan-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Construction Start</span>
                        <span className="bg-cyan-900 text-cyan-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.constructionStartProjects.length} {stats.constructionStartProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.constructionStartProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.constructionStartProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* On Going project */}
                  <div 
                    onClick={() => setSelectedStageKey('ongoing')}
                    className={`group relative hover:z-[100] bg-blue-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'ongoing' ? 'ring-2 ring-blue-500 border-blue-400 shadow-sm' : 'border border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-[10px] text-blue-500 font-extrabold uppercase tracking-tight block">Ongoing</span>
                    <span className="text-lg font-extrabold text-blue-700 block mt-1">{stats.stageCounts.ongoing}</span>

                    {/* Tooltip Popup (Centered) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full left-1/2 -translate-x-1/2 z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-blue-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Ongoing Stage</span>
                        <span className="bg-blue-900 text-blue-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.ongoingProjects.length} {stats.ongoingProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.ongoingProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.ongoingProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* Finishing stage */}
                  <div 
                    onClick={() => setSelectedStageKey('finishing')}
                    className={`group relative hover:z-[100] bg-violet-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'finishing' ? 'ring-2 ring-violet-500 border-violet-400 shadow-sm' : 'border border-violet-100 hover:border-violet-300'
                    }`}
                  >
                    <span className="text-[10px] text-violet-500 font-extrabold uppercase tracking-tight block">Finishing</span>
                    <span className="text-lg font-extrabold text-violet-700 block mt-1">{stats.stageCounts.finishing}</span>

                    {/* Tooltip Popup (Centered) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full left-1/2 -translate-x-1/2 z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-violet-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Finishing Stage</span>
                        <span className="bg-violet-900 text-violet-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.finishingProjects.length} {stats.finishingProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.finishingProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.finishingProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* Nearing completion */}
                  <div 
                    onClick={() => setSelectedStageKey('nearingCompletion')}
                    className={`group relative hover:z-[100] bg-emerald-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'nearingCompletion' ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-sm' : 'border border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-tight block">Nearing Comp</span>
                    <span className="text-lg font-extrabold text-emerald-700 block mt-1">{stats.stageCounts.nearingCompletion}</span>

                    {/* Tooltip Popup (Centered) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full left-1/2 -translate-x-1/2 z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-emerald-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Nearing Completion</span>
                        <span className="bg-emerald-900 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.nearingCompletionProjects.length} {stats.nearingCompletionProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.nearingCompletionProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.nearingCompletionProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* Handover stage */}
                  <div 
                    onClick={() => setSelectedStageKey('handover')}
                    className={`group relative hover:z-[100] bg-teal-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'handover' ? 'ring-2 ring-teal-500 border-teal-400 shadow-sm' : 'border border-teal-100 hover:border-teal-300'
                    }`}
                  >
                    <span className="text-[10px] text-teal-500 font-extrabold uppercase tracking-tight block">Handover</span>
                    <span className="text-lg font-extrabold text-teal-700 block mt-1">{stats.stageCounts.handover}</span>

                    {/* Tooltip Popup (Right-aligned) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full right-0 left-auto z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-teal-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>Handover Stage</span>
                        <span className="bg-teal-900 text-teal-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.handoverProjects.length} {stats.handoverProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.handoverProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.handoverProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full right-8 translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>

                  {/* Hold */}
                  <div 
                    onClick={() => setSelectedStageKey('hold')}
                    className={`group relative hover:z-[100] bg-rose-50/40 p-3 rounded-2xl text-center flex flex-col justify-between cursor-pointer transition-all ${
                      selectedStageKey === 'hold' ? 'ring-2 ring-rose-500 border-rose-400 shadow-sm' : 'border border-rose-100 hover:border-rose-300'
                    }`}
                  >
                    <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-tight block">On Hold</span>
                    <span className="text-lg font-extrabold text-rose-700 block mt-1">{stats.stageCounts.hold}</span>

                    {/* Tooltip Popup (Right-aligned) */}
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute bottom-full right-0 left-auto z-[999] mb-2 w-72 rounded-2xl bg-slate-900/98 backdrop-blur-md p-3.5 text-left text-[11px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover:opacity-100 border border-slate-700/80">
                      <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider text-rose-300 mb-2 border-b border-slate-800 pb-1.5">
                        <span>On Hold Stage</span>
                        <span className="bg-rose-900 text-rose-100 px-2 py-0.5 rounded text-[10px] font-black">{stats.holdProjects.length} {stats.holdProjects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      {stats.holdProjects.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {stats.holdProjects.map((p, i) => (
                            <div key={i} className="py-1 border-b border-slate-800/70 last:border-0 text-xs font-semibold text-slate-100 leading-snug flex items-start space-x-1.5">
                              <span className="text-slate-500 font-mono text-[10px] shrink-0">{i + 1}.</span>
                              <span className="flex-1">{p.name || p.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-center py-1">0 projects in this stage</div>
                      )}
                      <div className="absolute top-full right-6 translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Stage Names Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="leader-stages-name-highlights">
                
                {/* 1st Box: Design & Excavation Projects names */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      Design & Excavation Stage Projects
                    </span>
                    
                    <div className="space-y-4">
                      {/* Design Stage */}
                      <div>
                        <div className="group/dhdr relative inline-flex items-center gap-1.5 mb-1.5 cursor-help">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <h5 className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">
                            Design Stage ({stats.designProjects.length} {stats.designProjects.length === 1 ? 'Project' : 'Projects'})
                          </h5>
                          {/* Hover Tooltip on Stage Header */}
                          <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-60 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2.5 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/dhdr:opacity-100 border border-slate-700">
                            <span className="font-extrabold text-indigo-300 block text-xs">Design Stage: {stats.designProjects.length} Projects</span>
                            <span className="text-slate-300 block text-[9px] mt-0.5">Click stage pill in distribution grid above to view details.</span>
                          </div>
                        </div>
                        {stats.designProjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {stats.designProjects.map((p, i) => (
                              <div key={i} className="group/chip relative inline-block">
                                <span className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 shadow-2xs block cursor-pointer transition-colors">
                                  {p.name}
                                </span>
                                {/* Hover tooltip on project chip */}
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-1.5 w-56 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/chip:opacity-100 border border-slate-700">
                                  <span className="font-bold text-slate-100 block text-xs truncate">{p.name}</span>
                                  <span className="text-slate-400 block text-[9px] mt-1 border-t border-slate-800 pt-1">
                                    Stage: <span className="text-indigo-200 font-semibold">Design ({stats.designProjects.length} total)</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic block pl-3.5">0 projects in Design Stage</span>
                        )}
                      </div>

                      {/* Excavation Stage */}
                      <div>
                        <div className="group/ehdr relative inline-flex items-center gap-1.5 mb-1.5 cursor-help">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <h5 className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">
                            Excavation Stage ({stats.excavationProjects.length} {stats.excavationProjects.length === 1 ? 'Project' : 'Projects'})
                          </h5>
                          {/* Hover Tooltip on Stage Header */}
                          <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-60 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2.5 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/ehdr:opacity-100 border border-slate-700">
                            <span className="font-extrabold text-amber-300 block text-xs">Excavation Stage: {stats.excavationProjects.length} Projects</span>
                            <span className="text-slate-300 block text-[9px] mt-0.5">Click stage pill in distribution grid above to view details.</span>
                          </div>
                        </div>
                        {stats.excavationProjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {stats.excavationProjects.map((p, i) => (
                              <div key={i} className="group/chip relative inline-block">
                                <span className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100 shadow-2xs block cursor-pointer transition-colors">
                                  {p.name}
                                </span>
                                {/* Hover tooltip on project chip */}
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-1.5 w-56 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/chip:opacity-100 border border-slate-700">
                                  <span className="font-bold text-slate-100 block text-xs truncate">{p.name}</span>
                                  <span className="text-slate-400 block text-[9px] mt-1 border-t border-slate-800 pt-1">
                                    Stage: <span className="text-amber-200 font-semibold">Excavation ({stats.excavationProjects.length} total)</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic block pl-3.5">0 projects in Excavation Stage</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2nd Box: Handover Stage Projects names */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      Handover Stage Projects
                    </span>
                    
                    <div className="space-y-4">
                      {/* Handover Stage */}
                      <div>
                        <div className="group/hhdr relative inline-flex items-center gap-1.5 mb-1.5 cursor-help">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          <h5 className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider">
                            Handover Stage ({stats.handoverProjects.length} {stats.handoverProjects.length === 1 ? 'Project' : 'Projects'})
                          </h5>
                          {/* Hover Tooltip on Stage Header */}
                          <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-60 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2.5 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/hhdr:opacity-100 border border-slate-700">
                            <span className="font-extrabold text-teal-300 block text-xs">Handover Stage: {stats.handoverProjects.length} Projects</span>
                            <span className="text-slate-300 block text-[9px] mt-0.5">Click stage pill in distribution grid above to view details.</span>
                          </div>
                        </div>
                        {stats.handoverProjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {stats.handoverProjects.map((p, i) => (
                              <div key={i} className="group/chip relative inline-block">
                                <span className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold rounded-lg border border-teal-100 shadow-2xs block cursor-pointer transition-colors">
                                  {p.name}
                                </span>
                                {/* Hover tooltip on project chip */}
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-1.5 w-56 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/chip:opacity-100 border border-slate-700">
                                  <span className="font-bold text-slate-100 block text-xs truncate">{p.name}</span>
                                  <span className="text-slate-400 block text-[9px] mt-1 border-t border-slate-800 pt-1">
                                    Stage: <span className="text-teal-200 font-semibold">Handover ({stats.handoverProjects.length} total)</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic block pl-3.5">0 projects in Handover Stage</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3rd Box: Other (Selected Stage Projects) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Other Stages
                      </span>
                      <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-wider">
                        {(STAGE_CONFIGS[selectedStageKey] || STAGE_CONFIGS.hold).label}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {(() => {
                        const config = STAGE_CONFIGS[selectedStageKey] || STAGE_CONFIGS.hold;
                        const stageProjects = stats[`${selectedStageKey}Projects` as keyof typeof stats] as Project[] || [];

                        return (
                          <div>
                            <div className="group/othdr relative inline-flex items-center gap-1.5 mb-1.5 cursor-help">
                              <span className={`w-2 h-2 rounded-full ${config.dotBg}`} />
                              <h5 className={`text-[11px] font-extrabold ${config.badgeText} uppercase tracking-wider`}>
                                {config.title} ({stageProjects.length} {stageProjects.length === 1 ? 'Project' : 'Projects'})
                              </h5>
                              {/* Hover Tooltip on Stage Header */}
                              <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-60 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2.5 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/othdr:opacity-100 border border-slate-700">
                                <span className="font-extrabold text-slate-100 block text-xs">{config.title}: {stageProjects.length} Projects</span>
                                <span className="text-slate-400 block text-[9px] mt-0.5">Click any stage in grid above to switch this category.</span>
                              </div>
                            </div>
                            {stageProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {stageProjects.map((p, i) => (
                                  <div key={i} className="group/chip relative inline-block">
                                    <span className={`px-2.5 py-1 ${config.badgeBg} ${config.badgeText} text-[10px] font-bold rounded-lg border ${config.badgeBorder} shadow-2xs block cursor-pointer transition-colors hover:brightness-95`}>
                                      {p.name}
                                    </span>
                                    {/* Hover tooltip on project chip */}
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-1.5 w-56 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/chip:opacity-100 border border-slate-700">
                                      <span className="font-bold text-slate-100 block text-xs truncate">{p.name}</span>
                                      <span className="text-slate-400 block text-[9px] mt-1 border-t border-slate-800 pt-1">
                                        Stage: <span className="text-indigo-200 font-semibold">{config.label} ({stageProjects.length} total)</span>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic block pl-3.5">
                                0 projects in {config.label} Stage
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

              </div>

               {/* Execution Targets Overview - Placed at the top above the comparison graph */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 space-y-4" id="leader-targets-overview">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Execution Targets Overview
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Milestones Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
                      <span>Milestones Target</span>
                      <span className="text-indigo-700 font-black bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">{stats.milestones.pct}%</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-slate-900">{stats.milestones.ach}</span>
                      <span className="text-xs font-bold text-slate-500">/ {stats.milestones.plan} Planned</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-indigo-50/90 border border-indigo-200/80 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-indigo-900">
                      <span>Next Month Forecast:</span>
                      <span className="bg-white text-indigo-800 font-black px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">{stats.milestones.fr}</span>
                    </div>
                  </div>

                  {/* VOWD Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
                      <span>Value of Work Done</span>
                      <span className="text-violet-700 font-black bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-100">{stats.vowd.pct}%</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-slate-900">{formatValue(stats.vowd.ach, true)}</span>
                      <span className="text-xs font-bold text-slate-500">/ {formatValue(stats.vowd.plan, true)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-violet-50/90 border border-violet-200/80 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-violet-900">
                      <span>Next Month Forecast:</span>
                      <span className="bg-white text-violet-800 font-black px-2 py-0.5 rounded-md border border-violet-200 shadow-2xs">{formatValue(stats.vowd.fr, true)}</span>
                    </div>
                  </div>

                  {/* Labour Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
                      <span>Labour</span>
                      <span className="text-blue-700 font-black bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">{stats.labour.pct}%</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-slate-900">{stats.labour.ach}</span>
                      <span className="text-xs font-bold text-slate-500">/ {stats.labour.plan} Planned</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-blue-50/90 border border-blue-200/80 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-blue-900">
                      <span>Next Month Forecast:</span>
                      <span className="bg-white text-blue-800 font-black px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">{stats.labour.fr}</span>
                    </div>
                  </div>

                  {/* Schedule Performance Index (SPI) Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
                      <span>Schedule Performance (SPI)</span>
                      <span className={`font-black text-xs px-2.5 py-0.5 rounded-md border ${
                        stats.avgSpi === null ? 'bg-slate-100 text-slate-500 border-slate-200' :
                        stats.avgSpi >= 1.0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        stats.avgSpi >= 0.85 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {stats.avgSpi !== null ? stats.avgSpi.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-slate-900">
                        {stats.avgSpi !== null ? stats.avgSpi.toFixed(2) : 'N/A'}
                      </span>
                      {stats.avgSpi !== null && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold border uppercase tracking-wider ${
                          stats.avgSpi >= 1.0 ? 'bg-emerald-500 text-white border-emerald-500' :
                          stats.avgSpi >= 0.85 ? 'bg-amber-500 text-white border-amber-500' :
                          'bg-rose-500 text-white border-rose-500'
                        }`}>
                          {stats.avgSpi >= 1.0 ? 'On Track' : stats.avgSpi >= 0.85 ? 'Behind' : 'Slippage'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 pt-1">Portfolio Average SPI rating</p>
                  </div>

                  {/* Speed of Construction Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
                      <span>Speed of Construction</span>
                      <span className="text-emerald-700 font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">Speed</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-slate-900">{formatMetricValue(speedOfConstruction, 2)}</span>
                      <span className="text-xs font-bold text-slate-600">Rs./Sqft</span>
                    </div>
                  </div>

                  {/* Labour Output Merged Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 lg:col-span-2 md:col-span-2 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      <span>Labour Output</span>
                      <span className="text-indigo-700 font-black bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">Labour KPI</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Labour Productivity */}
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-700 block uppercase tracking-wider">Labour Productivity</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-2xl font-black text-slate-900">
                            {formatMetricValue(Math.round(labourProductivity), 0)}
                          </span>
                          <span className="text-xs font-bold text-slate-600">Rs./Lab/Day</span>
                        </div>
                      </div>

                      {/* Labour Efficiency */}
                      <div className="space-y-1 sm:border-l sm:border-slate-150 sm:pl-4">
                        <span className="text-xs font-black text-slate-700 block uppercase tracking-wider">Labour Efficiency</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-2xl font-black text-slate-900">
                            {formatMetricValue(labourEfficiency, 2)}
                          </span>
                          <span className="text-xs font-bold text-slate-600">Cr. per 100 labours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quality, Safety & Avg QHSE Ratings Card */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      <span>Quality & Safety Ratings</span>
                      <span className="text-violet-700 font-black bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-100">QHSE KPI</span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Quality Rating */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Quality Rating</span>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${
                          stats.leaderQualityRating === null ? 'bg-slate-100 text-slate-500 border-slate-200' :
                          stats.leaderQualityRating >= 8.5 || stats.leaderQualityRating >= 85 ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs' :
                          stats.leaderQualityRating >= 7.0 || stats.leaderQualityRating >= 70 ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' :
                          'bg-rose-500 text-white border-rose-500 shadow-2xs'
                        }`}>
                          {stats.leaderQualityRating !== null ? stats.leaderQualityRating.toFixed(2) : 'N/A'}
                        </span>
                      </div>

                      {/* Safety Rating */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Safety Rating</span>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${
                          stats.leaderSafetyRating === null ? 'bg-slate-100 text-slate-500 border-slate-200' :
                          stats.leaderSafetyRating >= 8.5 || stats.leaderSafetyRating >= 85 ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs' :
                          stats.leaderSafetyRating >= 7.0 || stats.leaderSafetyRating >= 70 ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' :
                          'bg-rose-500 text-white border-rose-500 shadow-2xs'
                        }`}>
                          {stats.leaderSafetyRating !== null ? stats.leaderSafetyRating.toFixed(2) : 'N/A'}
                        </span>
                      </div>

                      {/* Avg QHSE Rating */}
                      <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2 font-black">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Avg QHSE Rating</span>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${
                          stats.leaderAvgQhseRating === null ? 'bg-slate-100 text-slate-500 border-slate-200' :
                          stats.leaderAvgQhseRating >= 8.5 || stats.leaderAvgQhseRating >= 85 ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs' :
                          stats.leaderAvgQhseRating >= 7.0 || stats.leaderAvgQhseRating >= 70 ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' :
                          'bg-rose-500 text-white border-rose-500 shadow-2xs'
                        }`}>
                          {stats.leaderAvgQhseRating !== null ? stats.leaderAvgQhseRating.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FY 26-27 Monthly Progress Curve Visual Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 print-page-break" id="leader-visuals-panel">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>{getFiscalYearConfig(activeFy).label} Monthly Progress Curve</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Aggregated monthly progress and cumulative S-curve trend across selected portfolio ({activeLeader?.projectsCount || 0} projects)
                    </p>
                  </div>

                  {/* Display Mode Toggles (Moved to Top-Right Header in place of Metric Tabs) */}
                  <div className="flex items-center gap-2 no-print" id="mrm-display-mode-toggles">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hidden sm:inline-block">Display Mode:</span>
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-2xs">
                      <button
                        onClick={() => {
                          if (!mrmShowMonthlyBars && mrmShowCumulativeLines) return;
                          setMrmShowMonthlyBars(!mrmShowMonthlyBars);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                          mrmShowMonthlyBars
                            ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                            : 'bg-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Monthly Bars
                      </button>
                      <button
                        onClick={() => {
                          if (mrmShowMonthlyBars && !mrmShowCumulativeLines) return;
                          setMrmShowCumulativeLines(!mrmShowCumulativeLines);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                          mrmShowCumulativeLines
                            ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                            : 'bg-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Cumulative S-Curve
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-header controls: Baseline Plan & Metric Switcher Tabs (Shifted in place of Display Mode) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-150 no-print">
                  {/* Baseline Plan Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Baseline Plan:</span>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                      <button
                        onClick={() => setMrmBaselinePlan('r0')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          mrmBaselinePlan === 'r0'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        R0 Plan
                      </button>
                      <button
                        onClick={() => setMrmBaselinePlan('r1')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          mrmBaselinePlan === 'r1'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        R1 Plan
                      </button>
                      <button
                        onClick={() => setMrmBaselinePlan('both')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          mrmBaselinePlan === 'both'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Both plan (Compare)
                      </button>
                    </div>
                  </div>

                  {/* Metric Switcher Toggles (Shifted in place of Display Mode) */}
                  <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs" id="mrm-metric-toggles">
                    <button
                      onClick={() => setMrmChartMetric('vowd')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        mrmChartMetric === 'vowd'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      💰 VOWD
                    </button>
                    <button
                      onClick={() => setMrmChartMetric('milestone')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        mrmChartMetric === 'milestone'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      🎯 Milestones
                    </button>
                    <button
                      onClick={() => setMrmChartMetric('labour')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        mrmChartMetric === 'labour'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      👷 Labour
                    </button>
                    <button
                      onClick={() => setMrmChartMetric('ur')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        mrmChartMetric === 'ur'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      🏡 Unit Delivery (Residential)
                    </button>
                    <button
                      onClick={() => setMrmChartMetric('uc')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        mrmChartMetric === 'uc'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      🏢 Unit Delivery (Commercial)
                    </button>
                  </div>
                </div>

                {/* Custom Graph Legend */}
                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 text-[10px] font-bold px-1 pt-1">
                  {mrmShowMonthlyBars && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 uppercase tracking-wider text-[8px] font-black">Monthly Bars:</span>
                      {mrmBaselinePlan === 'both' ? (
                        <>
                          <div className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded bg-slate-400" />
                            <span className="text-slate-600">R0 Plan</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: currentMrmConfig.colorPlan }} />
                            <span className="text-slate-600">R1 Plan</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: currentMrmConfig.colorPlan }} />
                          <span className="text-slate-600">{mrmBaselinePlan.toUpperCase()} Plan</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: currentMrmConfig.colorAch }} />
                        <span className="text-slate-600">Actual</span>
                      </div>
                    </div>
                  )}

                  {mrmShowCumulativeLines && (
                    <div className={`flex items-center gap-2 ${mrmShowMonthlyBars ? 'border-l border-slate-200 pl-3' : ''}`}>
                      <span className="text-slate-400 uppercase tracking-wider text-[8px] font-black">S-Curve Lines:</span>
                      {mrmBaselinePlan === 'both' ? (
                        <>
                          <div className="flex items-center space-x-1">
                            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
                            <span className="text-slate-600">Cum R0</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="inline-block w-4 h-0.5 border-t-2 border-solid" style={{ borderColor: currentMrmConfig.colorPlan }} />
                            <span className="text-slate-600">Cum R1</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="inline-block w-4 h-0.5 border-t-2 border-solid" style={{ borderColor: currentMrmConfig.colorPlan }} />
                          <span className="text-slate-600">Cum {mrmBaselinePlan.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <span className="inline-block w-4 h-0.5 border-t-2 border-solid" style={{ borderColor: currentMrmConfig.colorAch }} />
                        <span className="text-slate-600">Cum Actual</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-[340px] w-full" id="leader-recharts-container">
                  {mrmMonthlyData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                      No metrics found to build monthly progress curves.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={mrmMonthlyData}
                        margin={{ top: 15, right: mrmShowMonthlyBars && mrmShowCumulativeLines ? 30 : 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          fontWeight={600} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={5} 
                        />
                        
                        <YAxis 
                          yAxisId="left"
                          stroke="#94a3b8" 
                          fontSize={10} 
                          fontWeight={600} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(val) => formatValue(val, currentMrmConfig.isCurrency)}
                        />

                        {mrmShowMonthlyBars && mrmShowCumulativeLines && (
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="#94a3b8" 
                            fontSize={10} 
                            fontWeight={600} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(val) => formatValue(val, currentMrmConfig.isCurrency)}
                          />
                        )}

                        <Tooltip
                          cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-2 max-w-[280px]">
                                  <p className="font-extrabold text-slate-800 border-b border-slate-100 pb-1 flex justify-between">
                                    <span>{d.month}</span>
                                    <span className="text-[10px] text-indigo-600 font-bold">{currentMrmConfig.shortLabel}</span>
                                  </p>

                                  {mrmShowMonthlyBars && (
                                    <div className="space-y-1 text-[11px]">
                                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Monthly Breakdown</p>
                                      {mrmBaselinePlan === 'both' ? (
                                        <>
                                          <div className="flex justify-between space-x-4">
                                            <span className="text-slate-500">R0 Plan:</span>
                                            <span className="font-bold text-slate-800">{formatValue(d.PlanR0, currentMrmConfig.isCurrency)}</span>
                                          </div>
                                          <div className="flex justify-between space-x-4">
                                            <span className="text-slate-500">R1 Plan:</span>
                                            <span className="font-bold text-indigo-600">{formatValue(d.PlanR1, currentMrmConfig.isCurrency)}</span>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex justify-between space-x-4">
                                          <span className="text-slate-500">{mrmBaselinePlan === 'r0' ? 'R0 Plan' : 'R1 Plan'}:</span>
                                          <span className="font-bold text-slate-800">{formatValue(d.Plan, currentMrmConfig.isCurrency)}</span>
                                        </div>
                                      )}
                                      {d.Achievement !== null && (
                                        <div className="flex justify-between space-x-4">
                                          <span className="text-slate-500">Actual:</span>
                                          <span className="font-bold text-emerald-600">{formatValue(d.Achievement, currentMrmConfig.isCurrency)}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {mrmShowCumulativeLines && (
                                    <div className="space-y-1 text-[11px] pt-1 border-t border-slate-100">
                                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Cumulative S-Curve</p>
                                      {mrmBaselinePlan === 'both' ? (
                                        <>
                                          <div className="flex justify-between space-x-4">
                                            <span className="text-slate-500">Cum R0:</span>
                                            <span className="font-bold text-slate-800">{formatValue(d.CumPlanR0, currentMrmConfig.isCurrency)}</span>
                                          </div>
                                          <div className="flex justify-between space-x-4">
                                            <span className="text-slate-500">Cum R1:</span>
                                            <span className="font-bold text-indigo-600">{formatValue(d.CumPlanR1, currentMrmConfig.isCurrency)}</span>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex justify-between space-x-4">
                                          <span className="text-slate-500">Cum Plan:</span>
                                          <span className="font-bold text-slate-800">{formatValue(d.CumPlan, currentMrmConfig.isCurrency)}</span>
                                        </div>
                                      )}
                                      {d.CumAchievement !== null && (
                                        <div className="flex justify-between space-x-4">
                                          <span className="text-slate-500">Cum Actual:</span>
                                          <span className="font-bold text-emerald-600">{formatValue(d.CumAchievement, currentMrmConfig.isCurrency)} ({d['CumAchievement %']}%)</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        {/* Monthly Bars */}
                        {mrmShowMonthlyBars && (
                          <>
                            {mrmBaselinePlan === 'both' ? (
                              <>
                                <Bar yAxisId="left" dataKey="PlanR0" name="R0 Plan" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={18}>
                                  <LabelList dataKey="PlanR0" content={renderBarPlanLabel} />
                                </Bar>
                                <Bar yAxisId="left" dataKey="PlanR1" name="R1 Plan" fill={currentMrmConfig.colorPlan} radius={[3, 3, 0, 0]} maxBarSize={18}>
                                  <LabelList dataKey="PlanR1" content={renderBarPlanLabel} />
                                </Bar>
                              </>
                            ) : (
                              <Bar yAxisId="left" dataKey="Plan" name={`${mrmBaselinePlan.toUpperCase()} Plan`} fill={currentMrmConfig.colorPlan} radius={[3, 3, 0, 0]} maxBarSize={22}>
                                <LabelList dataKey="Plan" content={renderBarPlanLabel} />
                              </Bar>
                            )}
                            <Bar yAxisId="left" dataKey="Achievement" name="Actual" fill={currentMrmConfig.colorAch} radius={[3, 3, 0, 0]} maxBarSize={22}>
                              <LabelList dataKey="Achievement" content={renderBarAchLabel} />
                            </Bar>
                          </>
                        )}

                        {/* Cumulative S-Curve Lines */}
                        {mrmShowCumulativeLines && (
                          <>
                            {mrmBaselinePlan === 'both' ? (
                              <>
                                <Line 
                                  yAxisId={mrmShowMonthlyBars ? "right" : "left"} 
                                  type="monotone" 
                                  dataKey="CumPlanR0" 
                                  name="Cum R0" 
                                  stroke="#94a3b8" 
                                  strokeWidth={2} 
                                  strokeDasharray="4 4" 
                                  dot={false} 
                                >
                                  <LabelList dataKey="CumPlanR0" content={renderCumPlanLineLabel} />
                                </Line>
                                <Line 
                                  yAxisId={mrmShowMonthlyBars ? "right" : "left"} 
                                  type="monotone" 
                                  dataKey="CumPlanR1" 
                                  name="Cum R1" 
                                  stroke={currentMrmConfig.colorPlan} 
                                  strokeWidth={2.5} 
                                  dot={false} 
                                >
                                  <LabelList dataKey="CumPlanR1" content={renderCumPlanLineLabel} />
                                </Line>
                              </>
                            ) : (
                              <Line 
                                yAxisId={mrmShowMonthlyBars ? "right" : "left"} 
                                type="monotone" 
                                dataKey="CumPlan" 
                                name={`Cum ${mrmBaselinePlan.toUpperCase()}`} 
                                stroke={currentMrmConfig.colorPlan} 
                                strokeWidth={2.5} 
                                dot={false} 
                              >
                                <LabelList dataKey="CumPlan" content={renderCumPlanLineLabel} />
                              </Line>
                            )}
                            <Line 
                              yAxisId={mrmShowMonthlyBars ? "right" : "left"} 
                              type="monotone" 
                              dataKey="CumAchievement" 
                              name="Cum Actual" 
                              stroke={currentMrmConfig.colorAch} 
                              strokeWidth={3} 
                              dot={{ r: 3, fill: currentMrmConfig.colorAch }} 
                            >
                              <LabelList dataKey="CumAchievement" content={renderCumAchLineLabel} />
                            </Line>
                          </>
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Comprehensive Monthly Progress Table for Full Report Coverage */}
                <div className="mt-6 border-t border-slate-100 pt-4" id="leader-monthly-data-table">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Detailed Metric Analyzer Table — {getFiscalYearConfig(activeFy).label} ({currentMrmConfig.label})</span>
                      </h5>
                      <button
                        type="button"
                        onClick={() => setIsMrmTableCollapsed(!isMrmTableCollapsed)}
                        className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all flex items-center gap-1 cursor-pointer no-print shadow-2xs"
                        title={isMrmTableCollapsed ? "Expand Breakdown Table" : "Collapse Breakdown Table"}
                      >
                        {isMrmTableCollapsed ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Expand Table</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Collapse Table</span>
                          </>
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Baseline: {mrmBaselinePlan}</span>
                  </div>

                  {!isMrmTableCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[9px] tracking-wider border-y border-slate-200">
                            <th className="py-2 px-2.5">Month</th>
                            {mrmBaselinePlan === 'both' ? (
                              <>
                                <th className="py-2 px-2 text-right">R0 Plan</th>
                                <th className="py-2 px-2 text-right text-indigo-700">R1 Plan</th>
                              </>
                            ) : (
                              <th className="py-2 px-2 text-right">{mrmBaselinePlan.toUpperCase()} Plan</th>
                            )}
                            <th className="py-2 px-2 text-right text-emerald-700">Monthly Actual</th>
                            {mrmBaselinePlan === 'both' ? (
                              <>
                                <th className="py-2 px-2 text-right">Cum R0 Plan</th>
                                <th className="py-2 px-2 text-right text-indigo-700">Cum R1 Plan</th>
                              </>
                            ) : (
                              <th className="py-2 px-2 text-right">Cum Plan</th>
                            )}
                            <th className="py-2 px-2 text-right text-emerald-700">Cum Actual</th>
                            <th className="py-2 px-2.5 text-right font-black">Cum Ach %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-medium">
                          {mrmMonthlyData.map((row, idx) => {
                            const isFuture = row.Achievement === null;
                            return (
                              <tr key={row.month} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.month}</td>
                                {mrmBaselinePlan === 'both' ? (
                                  <>
                                    <td className="py-1.5 px-2 text-right text-slate-600">{formatValue(row.PlanR0, currentMrmConfig.isCurrency)}</td>
                                    <td className="py-1.5 px-2 text-right font-bold text-indigo-700">{formatValue(row.PlanR1, currentMrmConfig.isCurrency)}</td>
                                  </>
                                ) : (
                                  <td className="py-1.5 px-2 text-right font-bold text-slate-700">{formatValue(row.Plan, currentMrmConfig.isCurrency)}</td>
                                )}
                                <td className="py-1.5 px-2 text-right font-extrabold text-emerald-700">
                                  {isFuture ? '-' : formatValue(row.Achievement, currentMrmConfig.isCurrency)}
                                </td>
                                {mrmBaselinePlan === 'both' ? (
                                  <>
                                    <td className="py-1.5 px-2 text-right text-slate-600">{formatValue(row.CumPlanR0, currentMrmConfig.isCurrency)}</td>
                                    <td className="py-1.5 px-2 text-right font-bold text-indigo-700">{formatValue(row.CumPlanR1, currentMrmConfig.isCurrency)}</td>
                                  </>
                                ) : (
                                  <td className="py-1.5 px-2 text-right text-slate-700">{formatValue(row.CumPlan, currentMrmConfig.isCurrency)}</td>
                                )}
                                <td className="py-1.5 px-2 text-right font-extrabold text-emerald-700">
                                  {isFuture ? '-' : formatValue(row.CumAchievement, currentMrmConfig.isCurrency)}
                                </td>
                                <td className="py-1.5 px-2.5 text-right font-black">
                                  {isFuture || !row['CumAchievement %'] ? (
                                    <span className="text-slate-400 font-normal">-</span>
                                  ) : (
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                      row['CumAchievement %'] >= 90 ? 'bg-emerald-100 text-emerald-800 font-extrabold' :
                                      row['CumAchievement %'] >= 75 ? 'bg-amber-100 text-amber-800 font-extrabold' :
                                      'bg-rose-100 text-rose-800 font-extrabold'
                                    }`}>
                                      {row['CumAchievement %']}%
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Leader Window: Comprehensive Individual Project Detail Cards */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 print-page-break" id="leader-projects-window">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      Projects ({sortedProjects.length})
                    </h4>
                  </div>

                  {/* Inline search bar */}
                  <div className="relative max-w-xs w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter project ID, stage, area..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Main Cards Blocks Layout */}
                {sortedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="leader-projects-blocks-grid">
                    {sortedProjects.map((p) => {
                      const parsedSpi = p.spi ? parseFloat(p.spi) : null;
                      const vowdPct = getPercent(p.vowdPctAch, p.vowdPlan, p.vowdAch);
                      const milestonePct = getPercent(p.milestonePctAch, p.milestonePlan, p.milestoneAch);
                      const labourPct = getPercent(p.labourPctAch, p.labourPlan, p.labourAch);

                      const formattedArea = p.areaSqft 
                        ? parseFloat(p.areaSqft.replace(/,/g, '')).toLocaleString() 
                        : '';

                      return (
                        <div 
                          key={p.code} 
                          className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden"
                          id={`project-block-${p.code}`}
                        >
                          {/* Status Accent Top Border */}
                          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                            p.status === 'Green' ? 'bg-emerald-500' :
                            p.status === 'Amber' ? 'bg-amber-500' :
                            p.status === 'Red' ? 'bg-rose-500' : 'bg-slate-400'
                          }`} />

                          {/* Block Header */}
                          <div className="flex items-start justify-between gap-3 pt-1">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {p.code && p.code.toLowerCase().trim() !== p.name.toLowerCase().trim() && (
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-md text-[10px] uppercase tracking-wide">
                                    {p.code}
                                  </span>
                                )}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                  p.status === 'Green' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  p.status === 'Amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  p.status === 'Red' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                  'bg-slate-50 text-slate-700 border-slate-100'
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                              <h5 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug truncate" title={p.name}>
                                {p.name}
                              </h5>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                <span>Area: <span className="font-semibold text-slate-600">{formattedArea ? `${formattedArea} Sqft` : 'N/A'}</span></span>
                                <span>&bull;</span>
                                <span className="relative group/stage inline-block cursor-help">
                                  <span>Stage: </span>
                                  <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/80 hover:bg-indigo-100 transition-colors">
                                    {p.projectStage || 'N/A'}
                                  </span>
                                  <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-64 rounded-xl bg-slate-900/95 backdrop-blur-sm p-2.5 text-left text-[10px] text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/stage:opacity-100 border border-slate-700">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                                      <span className="font-mono text-indigo-300 text-[9px] font-bold">{p.code}</span>
                                      <span className="text-[9px] font-extrabold text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800">
                                        {filteredProjects.filter(item => (item.projectStage || '').trim().toLowerCase() === (p.projectStage || '').trim().toLowerCase()).length} in stage
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-100 block text-xs truncate mt-0.5">{p.name}</span>
                                    <span className="text-slate-400 block mt-1 text-[9px]">
                                      Current Stage: <span className="text-indigo-200 font-semibold">{p.projectStage || 'N/A'}</span>
                                    </span>
                                  </span>
                                </span>
                              </p>
                            </div>
                            
                            <button
                              onClick={() => onProjectSelect(p)}
                              className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shrink-0 cursor-pointer"
                              title="View Project Details"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Performance & Achievements Section */}
                          <div className="space-y-3">
                            {/* SPI Block */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Gauge className="w-4 h-4 text-indigo-600" />
                                SPI Index
                              </span>
                              <span className={`text-xs font-black px-3 py-1 rounded-lg border ${
                                parsedSpi !== null && parsedSpi >= 1.0 ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs' :
                                parsedSpi !== null && parsedSpi >= 0.85 ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' :
                                parsedSpi !== null ? 'bg-rose-500 text-white border-rose-500 shadow-2xs' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {parsedSpi !== null ? parsedSpi.toFixed(2) : 'N/A'}
                              </span>
                            </div>

                            {/* VOWD, Milestone & Labour Prominent Performance Block */}
                            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                              {/* VOWD Row */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2" id={`vowd-${p.code}`}>
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">VOWD</span>
                                  <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-base font-black text-slate-900">{vowdPct}</span>
                                    <span className="text-xs font-bold text-slate-500">
                                      ({p.vowdAch || '0'}/{p.vowdPlan || '0'}{String(p.vowdPlan || '').toLowerCase().includes('cr') ? '' : ' Cr'})
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-violet-50/90 border border-violet-200 px-3 py-1 rounded-xl text-right shrink-0">
                                  <span className="text-[10px] font-black text-violet-700 uppercase tracking-wide block">Forecast</span>
                                  <span className="text-xs font-black text-violet-900">
                                    {p.vowdFr ? (String(p.vowdFr).toLowerCase().includes('cr') ? p.vowdFr : `${p.vowdFr} Cr`) : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {/* Milestone Row */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2" id={`milestone-${p.code}`}>
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">Milestone</span>
                                  <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-base font-black text-slate-900">{milestonePct}</span>
                                    <span className="text-xs font-bold text-slate-500">({p.milestoneAch || '0'}/{p.milestonePlan || '0'})</span>
                                  </div>
                                </div>
                                <div className="bg-indigo-50/90 border border-indigo-200 px-3 py-1 rounded-xl text-right shrink-0">
                                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wide block">Forecast</span>
                                  <span className="text-xs font-black text-indigo-900">{p.milestoneFr || 'N/A'}</span>
                                </div>
                              </div>

                              {/* Labour Row */}
                              <div className="flex items-center justify-between gap-2" id={`labour-${p.code}`}>
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">Labour</span>
                                  <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-base font-black text-slate-900">{labourPct}</span>
                                    <span className="text-xs font-bold text-slate-500">({p.labourAch || '0'}/{p.labourPlan || '0'})</span>
                                  </div>
                                </div>
                                <div className="bg-blue-50/90 border border-blue-200 px-3 py-1 rounded-xl text-right shrink-0">
                                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wide block">Forecast</span>
                                  <span className="text-xs font-black text-blue-900">{p.labourFr || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Timeline & Variance Section */}
                          <div className="pt-2.5 border-t border-slate-200 flex flex-col gap-2.5">
                            {/* Baseline Finish Date */}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                Baseline Finish:
                              </span>
                              <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                {p.baseline1Finish || p.baselineFinish || 'N/A'}
                              </span>
                            </div>

                            {/* Proposed Finish Date */}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                Proposed Finish:
                              </span>
                              <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                {p.proposedFinish || p.targetDate || 'N/A'}
                              </span>
                            </div>

                            {/* Schedule Variance & Delay */}
                            <div className="grid grid-cols-2 gap-2.5 mt-1">
                              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                                <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Schedule Variance</span>
                                <span className={`text-xs font-black mt-0.5 block ${
                                  p.scheduleVariance && (p.scheduleVariance.includes('+') || parseFloat(p.scheduleVariance) > 0) ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                  {formatDaysUnit(p.scheduleVariance)}
                                </span>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                                <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Delay in Month</span>
                                <span className={`text-xs font-black mt-0.5 block ${
                                  p.delayInCurrentMonth && (p.delayInCurrentMonth.includes('+') || parseFloat(p.delayInCurrentMonth) > 0 || parseInt(p.delayInCurrentMonth) > 0) ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                  {formatDaysUnit(p.delayInCurrentMonth)}
                                </span>
                              </div>
                            </div>

                            {/* Avg QHSE Rating Block */}
                            <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 mt-1">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-violet-600" />
                                Avg QHSE Rating
                              </span>
                              {(() => {
                                const raw = p.avgQhseRating || p.qhseRating;
                                if (!raw || raw === '-' || raw.toUpperCase() === 'N/A') {
                                  return <span className="text-xs font-black px-2.5 py-0.5 rounded-md border bg-slate-100 text-slate-500 border-slate-200">N/A</span>;
                                }
                                const qhseVal = parseFloat(String(raw).replace(/%/g, ''));
                                const isValValid = !isNaN(qhseVal);
                                return (
                                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${
                                    !isValValid ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                    qhseVal >= 8.5 || qhseVal >= 85 ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs' :
                                    qhseVal >= 7.0 || qhseVal >= 70 ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' :
                                    'bg-rose-500 text-white border-rose-500 shadow-2xs'
                                  }`}>
                                    {isValValid ? qhseVal.toFixed(2) : (raw && raw !== '-' ? raw : 'N/A')}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400 italic text-xs">
                    No active projects matching '{projectSearchQuery}' found inside {activeLeader.name}'s portfolio.
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              Select a leader from the selector panel to render the Operational Dashboard.
            </div>
          )}

        </div>

      {/* Attention Needed — Top 7 Critical Projects Tab / Section */}
      <AttentionNeededProjects
        projects={allLeaderProjects}
        software2Projects={software2Projects}
        onSelectProject={onProjectSelect}
        selectedVP={selectedVP}
        selectedLeader={selectedLeaderName}
      />

      {/* Multi-page Presentation PDF Export Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        projects={allLeaderProjects}
        leaderDataList={filteredLeaderDataList}
        software2Projects={software2Projects}
        defaultTitle={getDefaultMRMTitle()}
        selectedVP={selectedVP}
        selectedLeaderName={selectedLeaderName}
      />

    </div>
  );
}
