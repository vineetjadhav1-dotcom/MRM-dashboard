import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Software2Project, MonthlyMetric, Software2Mapping, Project, FiscalYearKey } from '@/src/types';
import { isCompleteOrLostStage, isTempProject } from '@/src/utils/customOrder';
import { getFiscalYearConfig, getStoredFiscalYear, setStoredFiscalYear, FISCAL_YEAR_KEYS } from '@/src/utils/fiscalYear';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  ComposedChart,
  LabelList,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Building2, 
  Users, 
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  Home,
  Briefcase,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Settings,
  SlidersHorizontal,
  Check,
  FileSpreadsheet,
  HelpCircle,
  X,
  Search,
  Database,
  Sliders,
  Filter,
  RefreshCw,
  Zap,
  Gauge,
  Award,
  AlertTriangle,
  Maximize2
} from 'lucide-react';

interface ProjectDashboardProps {
  projects: Software2Project[];
  allProjects?: Project[];
  sheetRows?: string[][];
  headerRowIndex?: number;
  mapping?: Software2Mapping;
  onUpdateMapping?: (newMapping: Software2Mapping, newHeaderIdx: number) => void;
  isUsingDemo?: boolean;
}

type MetricType = 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc';

function getColLetter(index: number): string {
  let temp = index;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

const fy26Months = [
  { key: 'Apr-26', label: 'April 2026' },
  { key: 'May-26', label: 'May 2026' },
  { key: 'Jun-26', label: 'June 2026' },
  { key: 'Jul-26', label: 'July 2026' },
  { key: 'Aug-26', label: 'August 2026' },
  { key: 'Sep-26', label: 'September 2026' },
  { key: 'Oct-26', label: 'October 2026' },
  { key: 'Nov-26', label: 'November 2026' },
  { key: 'Dec-26', label: 'December 2026' },
  { key: 'Jan-27', label: 'January 2027' },
  { key: 'Feb-27', label: 'February 2027' },
  { key: 'Mar-27', label: 'March 2027' }
];

const fy25Months = [
  { key: 'Apr-25', label: 'Apr 2025' },
  { key: 'May-25', label: 'May 2025' },
  { key: 'Jun-25', label: 'Jun 2025' },
  { key: 'Jul-25', label: 'Jul 2025' },
  { key: 'Aug-25', label: 'Aug 2025' },
  { key: 'Sep-25', label: 'Sep 2025' },
  { key: 'Oct-25', label: 'Oct 2025' },
  { key: 'Nov-25', label: 'Nov 2025' },
  { key: 'Dec-25', label: 'Dec 2025' },
  { key: 'Jan-26', label: 'Jan 2026' },
  { key: 'Feb-26', label: 'Feb 2026' },
  { key: 'Mar-26', label: 'Mar 2026' }
];

export default function ProjectDashboard({ 
  projects,
  allProjects = [],
  sheetRows = [],
  headerRowIndex = 3,
  mapping = {
    codeIndex: 1, // Col B - Project ID
    nameIndex: 2, // Col C - Project Name
    leaderIndex: 3, // Col D - Leader
    vpIndex: 4, // Col E - VP
    stageIndex: 5, // Col F - Stage
    areaIndex: -1,
    spiIndex: 6, // Col G - SPI
    qualityRatingIndex: 8, // Col I - Quality Rating
    safetyRatingIndex: 9, // Col J - Safety Rating
    avgQhseRatingIndex: 10 // Col K - Avg QHSE Rating
  },
  onUpdateMapping,
  isUsingDemo = true
}: ProjectDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('vowd');
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>('all');
  const [selectedLeader, setSelectedLeader] = useState<string>('all');
  const [selectedVP, setSelectedVP] = useState<string>('all');
  const [selectedPlanType, setSelectedPlanType] = useState<'r0' | 'r1' | 'both'>('r1');
  const [showMonthlyBars, setShowMonthlyBars] = useState<boolean>(true);
  const [showCumulativeLines, setShowCumulativeLines] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'metadata' | 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc'>('vowd');
  const [drawerSearch, setDrawerSearch] = useState<string>('');
  const [isDetailTableCollapsed, setIsDetailTableCollapsed] = useState<boolean>(true);
  const [isBreakdownTableCollapsed, setIsBreakdownTableCollapsed] = useState<boolean>(true);

  // Project Searchable Dropdown state
  const [isProjectComboboxOpen, setIsProjectComboboxOpen] = useState<boolean>(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const projectComboboxRef = useRef<HTMLDivElement | null>(null);

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectComboboxRef.current && !projectComboboxRef.current.contains(e.target as Node)) {
        setIsProjectComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lists of unique leaders and VPs for filtering
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
      if (!isTempProject(p.code) && p.leader) leaders.add(String(p.leader).trim());
    });
    return Array.from(leaders).sort();
  }, [projects]);

  // Coordinate Leader selection when VP changes
  const filteredLeaders = useMemo(() => {
    const leaders = new Set<string>();
    projects.forEach(p => {
      if (isTempProject(p.code)) return;
      const matchesVP = selectedVP === 'all' || (p.vp && String(p.vp).trim() === selectedVP);
      if (matchesVP && p.leader) {
        leaders.add(String(p.leader).trim());
      }
    });
    return Array.from(leaders).sort();
  }, [projects, selectedVP]);

  const handleVPChange = (vp: string) => {
    setSelectedVP(vp);
    setSelectedProjectCode('all');
    if (selectedLeader !== 'all') {
      const validLeaders = projects
        .filter(p => !isTempProject(p.code) && (vp === 'all' || (p.vp && String(p.vp).trim() === vp)))
        .map(p => p.leader ? String(p.leader).trim() : '');
      if (!validLeaders.includes(selectedLeader)) {
        setSelectedLeader('all');
      }
    }
  };

  const handleLeaderChange = (leader: string) => {
    setSelectedLeader(leader);
    setSelectedProjectCode('all');
    if (leader !== 'all') {
      const proj = projects.find(p => !isTempProject(p.code) && p.leader && String(p.leader).trim() === leader);
      if (proj && proj.vp) {
        setSelectedVP(String(proj.vp).trim());
      }
    }
  };

  // Primary filtering (includes temp and complete/lost projects so their parameters are considered)
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesVP = selectedVP === 'all' || (p.vp && String(p.vp).trim() === selectedVP);
      const matchesLeader = selectedLeader === 'all' || (p.leader && String(p.leader).trim() === selectedLeader);
      const matchesProject = selectedProjectCode === 'all' || p.code === selectedProjectCode;
      return matchesVP && matchesLeader && matchesProject;
    });
  }, [projects, selectedVP, selectedLeader, selectedProjectCode]);

  // Metric visual configuration
  const metricsConfig = {
    vowd: {
      label: 'Value of Work Done (VOWD)',
      shortLabel: 'VOWD Target',
      unit: 'Cr.',
      isCurrency: true,
      colorPlan: '#93c5fd', // blue-300
      colorAch: '#1d4ed8',  // blue-700
      colorR0: '#cbd5e1',   // slate-300
      icon: TrendingUp,
      bgClass: 'bg-blue-50 border-blue-100',
      textClass: 'text-blue-700'
    },
    milestone: {
      label: 'Milestones met vs planned',
      shortLabel: 'Milestone Delivery',
      unit: 'Nos.',
      isCurrency: false,
      colorPlan: '#86efac', // green-300
      colorAch: '#15803d',  // green-700
      colorR0: '#cbd5e1',
      icon: Calendar,
      bgClass: 'bg-emerald-50 border-emerald-100',
      textClass: 'text-emerald-700'
    },
    labour: {
      label: 'Labour Headcount & Deployment',
      shortLabel: 'Labour Deployment',
      unit: 'Labours',
      isCurrency: false,
      colorPlan: '#c4b5fd', // purple-300
      colorAch: '#6d28d9',  // purple-700
      colorR0: '#cbd5e1',
      icon: Users,
      bgClass: 'bg-purple-50 border-purple-100',
      textClass: 'text-purple-700'
    },
    ur: {
      label: 'Unit Delivery - Residential',
      shortLabel: 'Unit Delivery - Residential',
      unit: 'Units',
      isCurrency: false,
      colorPlan: '#fdba74', // orange-300
      colorAch: '#c2410c',  // orange-700
      colorR0: '#cbd5e1',
      icon: Home,
      bgClass: 'bg-orange-50 border-orange-100',
      textClass: 'text-orange-700'
    },
    uc: {
      label: 'Unit Delivery - Commercial',
      shortLabel: 'Unit Delivery - Commercial',
      unit: 'Sqft',
      isCurrency: false,
      colorPlan: '#fcd34d', // amber-300
      colorAch: '#b45309',  // amber-700
      colorR0: '#cbd5e1',
      icon: Briefcase,
      bgClass: 'bg-amber-50 border-amber-100',
      textClass: 'text-amber-700'
    }
  };

  const [activeFy, setActiveFy] = useState<FiscalYearKey>(() => getStoredFiscalYear());

  useEffect(() => {
    const handleFyChanged = () => setActiveFy(getStoredFiscalYear());
    window.addEventListener('mrm-fiscal-year-changed', handleFyChanged);
    return () => window.removeEventListener('mrm-fiscal-year-changed', handleFyChanged);
  }, []);

  const currentConfig = metricsConfig[activeMetric];

  // List of projects for selector dropdown
  const projectList = useMemo(() => {
    const subset = projects.filter(p => {
      if (isTempProject(p.code)) return false;
      const matchesVP = selectedVP === 'all' || (p.vp && String(p.vp).trim() === selectedVP);
      const matchesLeader = selectedLeader === 'all' || (p.leader && String(p.leader).trim() === selectedLeader);
      return matchesVP && matchesLeader;
    });
    return subset.map(p => ({ code: p.code, name: p.name }));
  }, [projects, selectedVP, selectedLeader]);

  // Aggregate monthly values across all filtered projects for the active metric
  const monthlyData = useMemo(() => {
    const fyConfig = getFiscalYearConfig(activeFy);
    const monthKeys = fyConfig.months.map(m => m.key);
    
    let cumR0 = 0;
    let cumR1 = 0;
    let cumPlan = 0;
    let cumAch = 0;

    return monthKeys.map((m, idx) => {
      let planSum = 0;
      let planR0Sum = 0;
      let planR1Sum = 0;
      let achSum = 0;
      let hasRecord = false;

      filteredProjects.forEach(p => {
        const metricList = p[activeMetric];
        const monthData = metricList ? metricList.find(d => d.month === m) : null;
        if (monthData) {
          hasRecord = true;
          const pR0 = monthData.planR0 !== undefined ? monthData.planR0 : monthData.plan;
          const pR1 = monthData.planR1 !== undefined ? monthData.planR1 : pR0;
          
          planR0Sum += pR0;
          planR1Sum += pR1;
          achSum += monthData.achievement;

          if (selectedPlanType === 'r0') {
            planSum += pR0;
          } else {
            planSum += pR1;
          }
        }
      });

      // Format decimals cleanly
      planSum = Math.round(planSum * 10) / 10;
      planR0Sum = Math.round(planR0Sum * 10) / 10;
      planR1Sum = Math.round(planR1Sum * 10) / 10;
      achSum = Math.round(achSum * 10) / 10;
      const pct = planSum > 0 ? Math.round((achSum / planSum) * 100) : 0;

      cumR0 = Math.round((cumR0 + planR0Sum) * 10) / 10;
      cumR1 = Math.round((cumR1 + planR1Sum) * 10) / 10;
      cumPlan = Math.round((cumPlan + planSum) * 10) / 10;
      cumAch = Math.round((cumAch + achSum) * 10) / 10;

      const cumPct = selectedPlanType === 'both'
        ? (cumR1 > 0 ? Math.round((cumAch / cumR1) * 100) : 0)
        : (cumPlan > 0 ? Math.round((cumAch / cumPlan) * 100) : 0);

      // Show achievement if achSum > 0, or if it is among elapsed months up to August 2026
      const hasActualValue = achSum > 0 || idx <= 4;

      return {
        month: m,
        Plan: planSum,
        PlanR0: planR0Sum,
        PlanR1: planR1Sum,
        Achievement: hasActualValue ? achSum : null,
        'Achievement %': hasActualValue ? pct : null,
        CumPlanR0: cumR0,
        CumPlanR1: cumR1,
        CumPlan: cumPlan,
        CumAchievement: hasActualValue ? cumAch : null,
        'CumAchievement %': hasActualValue ? cumPct : null
      };
    });
  }, [filteredProjects, activeMetric, selectedPlanType]);

  // Overall KPI summaries for active metric
  const totals = useMemo(() => {
    let totalPlan = 0;
    let totalAch = 0;

    monthlyData.forEach(d => {
      totalPlan += d.Plan;
      totalAch += (d.Achievement || 0);
    });

    totalPlan = Math.round(totalPlan * 10) / 10;
    totalAch = Math.round(totalAch * 10) / 10;
    const achievementPercentage = totalPlan > 0 ? Math.round((totalAch / totalPlan) * 100) : 0;

    return {
      plan: totalPlan,
      achievement: totalAch,
      percentage: achievementPercentage,
      variance: Math.round((totalAch - totalPlan) * 10) / 10
    };
  }, [monthlyData]);

  // Consolidated values across ALL 5 Core Metrics (VOWD, Milestone, Labour, UR, UC)
  const consolidatedMetrics = useMemo(() => {
    let vowdPlan = 0, vowdAch = 0;
    let milestonePlan = 0, milestoneAch = 0;
    let labourPlan = 0, labourAch = 0;
    let urPlan = 0, urAch = 0;
    let ucPlan = 0, ucAch = 0;

    let totalAreaSqft = 0;
    let areaUnderConstruction = 0;

    filteredProjects.forEach(p => {
      // VOWD
      p.vowd?.forEach(m => {
        const pR1 = m.planR1 !== undefined ? m.planR1 : m.plan;
        const planVal = selectedPlanType === 'r0' ? (m.planR0 !== undefined ? m.planR0 : m.plan) : pR1;
        vowdPlan += planVal;
        vowdAch += m.achievement;
      });

      // Milestone
      p.milestone?.forEach(m => {
        const pR1 = m.planR1 !== undefined ? m.planR1 : m.plan;
        const planVal = selectedPlanType === 'r0' ? (m.planR0 !== undefined ? m.planR0 : m.plan) : pR1;
        milestonePlan += planVal;
        milestoneAch += m.achievement;
      });

      // Labour
      p.labour?.forEach(m => {
        const pR1 = m.planR1 !== undefined ? m.planR1 : m.plan;
        const planVal = selectedPlanType === 'r0' ? (m.planR0 !== undefined ? m.planR0 : m.plan) : pR1;
        labourPlan += planVal;
        labourAch += m.achievement;
      });

      // UR
      p.ur?.forEach(m => {
        const pR1 = m.planR1 !== undefined ? m.planR1 : m.plan;
        const planVal = selectedPlanType === 'r0' ? (m.planR0 !== undefined ? m.planR0 : m.plan) : pR1;
        urPlan += planVal;
        urAch += m.achievement;
      });

      // UC
      p.uc?.forEach(m => {
        const pR1 = m.planR1 !== undefined ? m.planR1 : m.plan;
        const planVal = selectedPlanType === 'r0' ? (m.planR0 !== undefined ? m.planR0 : m.plan) : pR1;
        ucPlan += planVal;
        ucAch += m.achievement;
      });

      // Standard project area (Only count for active projects, exclude temp and Complete, Complete-old, Lost)
      const stdProj = allProjects?.find(ap => ap.code === p.code);
      const isTemp = isTempProject(p.code);
      const stage = (stdProj?.projectStage || p.stage || '').trim();
      const isCompletedOrLost = isCompleteOrLostStage(stage);

      if (!isTemp && !isCompletedOrLost) {
        if (stdProj && stdProj.areaSqft) {
          const areaVal = parseFloat(String(stdProj.areaSqft).replace(/,/g, ''));
          if (!isNaN(areaVal)) {
            totalAreaSqft += areaVal;
            const stageLower = stage.toLowerCase();
            if (
              stageLower.includes('excavation') ||
              stageLower.includes('construction') ||
              stageLower.includes('ongoing') ||
              stageLower.includes('finishing') ||
              stageLower.includes('nearing')
            ) {
              areaUnderConstruction += areaVal;
            }
          }
        } else if (p.area) {
          const areaVal = parseFloat(String(p.area).replace(/,/g, ''));
          if (!isNaN(areaVal)) {
            totalAreaSqft += areaVal;
            areaUnderConstruction += areaVal;
          }
        }
      }
    });

    let totalSpi = 0, spiCount = 0;
    let totalQuality = 0, qualityCount = 0;
    let totalSafety = 0, safetyCount = 0;
    let totalQhse = 0, qhseCount = 0;

    filteredProjects.forEach(p => {
      if (p.spi) {
        const val = parseFloat(String(p.spi));
        if (!isNaN(val)) {
          totalSpi += val;
          spiCount++;
        }
      }
      if (p.qualityRating) {
        const val = parseFloat(String(p.qualityRating).replace(/%/g, ''));
        if (!isNaN(val)) {
          totalQuality += val;
          qualityCount++;
        }
      }
      if (p.safetyRating) {
        const val = parseFloat(String(p.safetyRating).replace(/%/g, ''));
        if (!isNaN(val)) {
          totalSafety += val;
          safetyCount++;
        }
      }
      if (p.avgQhseRating) {
        const val = parseFloat(String(p.avgQhseRating).replace(/%/g, ''));
        if (!isNaN(val)) {
          totalQhse += val;
          qhseCount++;
        }
      }
    });

    const avgSpi = spiCount > 0 ? totalSpi / spiCount : 0;
    const avgQuality = qualityCount > 0 ? totalQuality / qualityCount : null;
    const avgSafety = safetyCount > 0 ? totalSafety / safetyCount : null;
    const avgQhse = qhseCount > 0 ? totalQhse / qhseCount : null;

    vowdPlan = Math.round(vowdPlan * 10) / 10;
    vowdAch = Math.round(vowdAch * 10) / 10;
    milestonePlan = Math.round(milestonePlan * 10) / 10;
    milestoneAch = Math.round(milestoneAch * 10) / 10;
    labourPlan = Math.round(labourPlan * 10) / 10;
    labourAch = Math.round(labourAch * 10) / 10;
    urPlan = Math.round(urPlan * 10) / 10;
    urAch = Math.round(urAch * 10) / 10;
    ucPlan = Math.round(ucPlan * 10) / 10;
    ucAch = Math.round(ucAch * 10) / 10;

    const speedOfConstruction = areaUnderConstruction > 0
      ? (vowdAch / areaUnderConstruction) * 10000000
      : 0;

    const labourProductivity = labourAch > 0
      ? (vowdAch / labourAch) * 10000000
      : 0;

    return {
      vowd: { plan: vowdPlan, ach: vowdAch, pct: vowdPlan > 0 ? Math.round((vowdAch / vowdPlan) * 100) : 0 },
      milestone: { plan: milestonePlan, ach: milestoneAch, pct: milestonePlan > 0 ? Math.round((milestoneAch / milestonePlan) * 100) : 0 },
      labour: { plan: labourPlan, ach: labourAch, pct: labourPlan > 0 ? Math.round((labourAch / labourPlan) * 100) : 0 },
      ur: { plan: urPlan, ach: urAch, pct: urPlan > 0 ? Math.round((urAch / urPlan) * 100) : 0 },
      uc: { plan: ucPlan, ach: ucAch, pct: ucPlan > 0 ? Math.round((ucAch / ucPlan) * 100) : 0 },
      speedOfConstruction,
      labourProductivity,
      totalAreaSqft,
      areaUnderConstruction,
      avgSpi,
      avgQuality,
      avgSafety,
      avgQhse
    };
  }, [filteredProjects, selectedPlanType, allProjects]);

  // Multi-Metric Monthly Data for side-by-side time series cards
  const multiMetricMonthlyData = useMemo(() => {
    const fyConfig = getFiscalYearConfig(activeFy);
    const months = fyConfig.months.map(m => m.key);
    
    return months.map((m, idx) => {
      let vowdPlan = 0, vowdAch = 0;
      let milestonePlan = 0, milestoneAch = 0;
      let labourPlan = 0, labourAch = 0;
      let urPlan = 0, urAch = 0;
      let ucPlan = 0, ucAch = 0;

      filteredProjects.forEach(p => {
        const vData = p.vowd?.find(d => d.month === m);
        if (vData) {
          const pR1 = vData.planR1 !== undefined ? vData.planR1 : vData.plan;
          const planVal = selectedPlanType === 'r0' ? (vData.planR0 !== undefined ? vData.planR0 : vData.plan) : pR1;
          vowdPlan += planVal;
          vowdAch += vData.achievement;
        }

        const mData = p.milestone?.find(d => d.month === m);
        if (mData) {
          const pR1 = mData.planR1 !== undefined ? mData.planR1 : mData.plan;
          const planVal = selectedPlanType === 'r0' ? (mData.planR0 !== undefined ? mData.planR0 : mData.plan) : pR1;
          milestonePlan += planVal;
          milestoneAch += mData.achievement;
        }

        const lData = p.labour?.find(d => d.month === m);
        if (lData) {
          const pR1 = lData.planR1 !== undefined ? lData.planR1 : lData.plan;
          const planVal = selectedPlanType === 'r0' ? (lData.planR0 !== undefined ? lData.planR0 : lData.plan) : pR1;
          labourPlan += planVal;
          labourAch += lData.achievement;
        }

        const urData = p.ur?.find(d => d.month === m);
        if (urData) {
          const pR1 = urData.planR1 !== undefined ? urData.planR1 : urData.plan;
          const planVal = selectedPlanType === 'r0' ? (urData.planR0 !== undefined ? urData.planR0 : urData.plan) : pR1;
          urPlan += planVal;
          urAch += urData.achievement;
        }

        const ucData = p.uc?.find(d => d.month === m);
        if (ucData) {
          const pR1 = ucData.planR1 !== undefined ? ucData.planR1 : ucData.plan;
          const planVal = selectedPlanType === 'r0' ? (ucData.planR0 !== undefined ? ucData.planR0 : ucData.plan) : pR1;
          ucPlan += planVal;
          ucAch += ucData.achievement;
        }
      });

      const hasVal = idx <= 4;

      return {
        month: m,
        vowdPlan: Math.round(vowdPlan * 10) / 10,
        vowdAch: hasVal || vowdAch > 0 ? Math.round(vowdAch * 10) / 10 : null,
        milestonePlan: Math.round(milestonePlan * 10) / 10,
        milestoneAch: hasVal || milestoneAch > 0 ? Math.round(milestoneAch * 10) / 10 : null,
        labourPlan: Math.round(labourPlan * 10) / 10,
        labourAch: hasVal || labourAch > 0 ? Math.round(labourAch * 10) / 10 : null,
        urPlan: Math.round(urPlan * 10) / 10,
        urAch: hasVal || urAch > 0 ? Math.round(urAch * 10) / 10 : null,
        ucPlan: Math.round(ucPlan * 10) / 10,
        ucAch: hasVal || ucAch > 0 ? Math.round(ucAch * 10) / 10 : null
      };
    });
  }, [filteredProjects, selectedPlanType]);

  // 5 Achievement Monthwise Curves: SPI, Labour Productivity, Quality Rating, Safety Rating, Avg QHSE Rating (Scale 0-10 for ratings)
  const ratingsMonthlyData = useMemo(() => {
    const fyConfig = getFiscalYearConfig(activeFy);
    const months = fyConfig.months.map(m => m.key);

    return months.map((m) => {
      let spiTotal = 0;
      let spiCount = 0;
      let vowdAchTotal = 0;
      let labourAchTotal = 0;
      let qualityTotal = 0;
      let qualityCount = 0;
      let safetyTotal = 0;
      let safetyCount = 0;
      let qhseTotal = 0;
      let qhseCount = 0;

      filteredProjects.forEach(p => {
        // 1. SPI from spiHistory
        const spiItem = p.spiHistory?.find(d => d.month === m);
        if (spiItem && spiItem.achievement !== undefined && spiItem.achievement !== null) {
          const val = Number(spiItem.achievement);
          if (!isNaN(val) && val > 0) {
            spiTotal += val;
            spiCount++;
          }
        }

        // 2. VOWD & Labour for Labour Productivity
        const vowdItem = p.vowd?.find(d => d.month === m);
        const labourItem = p.labour?.find(d => d.month === m);
        if (vowdItem && vowdItem.achievement !== undefined && vowdItem.achievement !== null) {
          const v = Number(vowdItem.achievement);
          if (!isNaN(v) && v > 0) vowdAchTotal += v;
        }
        if (labourItem && labourItem.achievement !== undefined && labourItem.achievement !== null) {
          const l = Number(labourItem.achievement);
          if (!isNaN(l) && l > 0) labourAchTotal += l;
        }

        // 3. Quality Rating from qualityHistory (Scale 0 to 10)
        const qualItem = p.qualityHistory?.find(d => d.month === m);
        if (qualItem && qualItem.achievement !== undefined && qualItem.achievement !== null) {
          let val = Number(qualItem.achievement);
          if (!isNaN(val) && val > 0) {
            if (val > 10) val = val / 10;
            qualityTotal += val;
            qualityCount++;
          }
        }

        // 4. Safety Rating from safetyHistory (Scale 0 to 10)
        const safItem = p.safetyHistory?.find(d => d.month === m);
        if (safItem && safItem.achievement !== undefined && safItem.achievement !== null) {
          let val = Number(safItem.achievement);
          if (!isNaN(val) && val > 0) {
            if (val > 10) val = val / 10;
            safetyTotal += val;
            safetyCount++;
          }
        }

        // 5. Avg QHSE Rating from avgQhseHistory (Scale 0 to 10)
        const qhseItem = p.avgQhseHistory?.find(d => d.month === m);
        if (qhseItem && qhseItem.achievement !== undefined && qhseItem.achievement !== null) {
          let val = Number(qhseItem.achievement);
          if (!isNaN(val) && val > 0) {
            if (val > 10) val = val / 10;
            qhseTotal += val;
            qhseCount++;
          }
        }
      });

      // Strict check: DO NOT show data if any parameter for that month is blank/absent
      const avgSpi = spiCount > 0 ? Math.round((spiTotal / spiCount) * 100) / 100 : null;
      const labourProd = (labourAchTotal > 0 && vowdAchTotal > 0)
        ? Math.round((vowdAchTotal / labourAchTotal) * 10000000)
        : null;
      const avgQuality = qualityCount > 0 ? Math.round((qualityTotal / qualityCount) * 10) / 10 : null;
      const avgSafety = safetyCount > 0 ? Math.round((safetyTotal / safetyCount) * 10) / 10 : null;
      const avgQhse = qhseCount > 0 ? Math.round((qhseTotal / qhseCount) * 10) / 10 : null;

      return {
        month: m,
        spi: avgSpi,
        labourProductivity: labourProd,
        quality: avgQuality,
        safety: avgSafety,
        qhse: avgQhse
      };
    });
  }, [filteredProjects, activeFy]);

  // Project breakdown table (filters out temp and completed/lost projects for clean tabular display)
  const projectBreakdown = useMemo(() => {
    return filteredProjects
      .filter(p => !isTempProject(p.code) && !isCompleteOrLostStage(p.stage))
      .map(p => {
        let pPlan = 0;
        let pAch = 0;

        const metricList = p[activeMetric] || [];
        metricList.forEach(d => {
          const pR0 = d.planR0 !== undefined ? d.planR0 : d.plan;
          const pR1 = d.planR1 !== undefined ? d.planR1 : pR0;
          pPlan += selectedPlanType === 'r0' ? pR0 : pR1;
          pAch += d.achievement;
        });

        pPlan = Math.round(pPlan * 10) / 10;
        pAch = Math.round(pAch * 10) / 10;
        const pct = pPlan > 0 ? Math.round((pAch / pPlan) * 100) : 0;

        return {
          code: p.code,
          name: p.name,
          leader: p.leader,
          vp: p.vp,
          stage: p.stage,
          area: p.area,
          plan: pPlan,
          achievement: pAch,
          pct,
          variance: Math.round((pAch - pPlan) * 10) / 10
        };
      })
      .sort((a, b) => b.plan - a.plan);
  }, [filteredProjects, activeMetric, selectedPlanType]);

  // Index of the last completed month in monthlyData (e.g. Jul-26)
  const lastCompletedMonthIndex = useMemo(() => {
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i].Achievement !== null && monthlyData[i].Achievement !== undefined) {
        return i;
      }
    }
    return 3; // Fallback to index 3 ("Jul-26")
  }, [monthlyData]);

  // Custom data label renderers
  const renderPlanLabel = useCallback((props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const cx = x + (width ? width / 2 : 0);
    return (
      <text x={cx} y={y - 6} fill="#64748b" fontSize={8} fontWeight={600} textAnchor="middle">
        {formatted}
      </text>
    );
  }, []);

  const renderAchievementLabel = useCallback((props: any) => {
    const { x, y, width, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;
    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    let text = String(formatted);
    const row = monthlyData[index];
    if (row && row['Achievement %'] !== null && row['Achievement %'] > 0) {
      text = `${formatted} (${row['Achievement %']}%)`;
    }
    const cx = x + (width ? width / 2 : 0);
    return (
      <text x={cx} y={y - 6} fill={currentConfig.colorAch} fontSize={8} fontWeight={700} textAnchor="middle">
        {text}
      </text>
    );
  }, [monthlyData, currentConfig.colorAch]);

  // Data label renderer for Cumulative Plan Line (Only for Mar 27 & Last Completed Month)
  const renderCumPlanLineLabel = useCallback((props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;

    const isLastCompleted = index === lastCompletedMonthIndex;
    const isMar27 = index === monthlyData.length - 1;

    if (!isLastCompleted && !isMar27) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;

    return (
      <g>
        <rect
          x={x - 24}
          y={y - 25}
          width={48}
          height={18}
          rx={4}
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth={1.5}
        />
        <text
          x={x}
          y={y - 12}
          fill="#1e293b"
          fontSize={10}
          fontWeight={800}
          textAnchor="middle"
        >
          {formatted}
        </text>
      </g>
    );
  }, [lastCompletedMonthIndex, monthlyData.length]);

  // Data label renderer for Cumulative Achievement Line (Only for Last Completed Month)
  const renderCumAchLineLabel = useCallback((props: any) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;

    const isLastCompleted = index === lastCompletedMonthIndex;
    if (!isLastCompleted) return null;

    const formatted = typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value;
    const row = monthlyData[index];
    const pct = row ? row['CumAchievement %'] : 0;
    const labelText = pct > 0 ? `${formatted} (${pct}%)` : `${formatted}`;

    return (
      <g>
        <rect
          x={x - 38}
          y={y + 8}
          width={76}
          height={20}
          rx={5}
          fill="#1e1b4b"
          stroke="#4f46e5"
          strokeWidth={1.5}
        />
        <text
          x={x}
          y={y + 22}
          fill="#ffffff"
          fontSize={10}
          fontWeight={800}
          textAnchor="middle"
        >
          {labelText}
        </text>
      </g>
    );
  }, [lastCompletedMonthIndex, monthlyData]);

  // Data label renderers for Executive Productivity & Rating Monthwise Curves
  const renderSpiRatingLabel = useCallback((props: any) => {
    const { x, y, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    return (
      <text x={x} y={y - 8} fill="#0284c7" fontSize={8.5} fontWeight={800} textAnchor="middle">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </text>
    );
  }, []);

  const renderLabourProdMonthlyLabel = useCallback((props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const cx = x + (width ? width / 2 : 0);
    const num = Number(value);
    const formatted = num >= 1000 ? `₹${(num / 1000).toFixed(1)}k` : `₹${Math.round(num)}`;
    return (
      <text x={cx} y={y - 6} fill="#7c3aed" fontSize={8} fontWeight={800} textAnchor="middle">
        {formatted}
      </text>
    );
  }, []);

  const renderQualityRatingLabel = useCallback((props: any) => {
    const { x, y, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    return (
      <text x={x} y={y - 8} fill="#059669" fontSize={8.5} fontWeight={800} textAnchor="middle">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </text>
    );
  }, []);

  const renderSafetyRatingLabel = useCallback((props: any) => {
    const { x, y, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    return (
      <text x={x} y={y - 8} fill="#d97706" fontSize={8.5} fontWeight={800} textAnchor="middle">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </text>
    );
  }, []);

  const renderQhseRatingLabel = useCallback((props: any) => {
    const { x, y, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    return (
      <text x={x} y={y - 8} fill="#4f46e5" fontSize={8.5} fontWeight={800} textAnchor="middle">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </text>
    );
  }, []);

  const renderEfficiencyRateLabel = useCallback((props: any) => {
    const { x, y, value } = props;
    if (value === undefined || value === null) return null;
    return (
      <text
        x={x}
        y={y - 8}
        fill={currentConfig.colorAch || '#0284c7'}
        fontSize={8.5}
        fontWeight={800}
        textAnchor="middle"
      >
        {`${Math.round(value)}%`}
      </text>
    );
  }, [currentConfig.colorAch]);

  return (
    <div className="space-y-6 font-sans" id="project-dashboard-consolidated-root">
      
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4" id="project-dashboard-header-banner">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Project Performance Dashboard</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated Executive Window • {getFiscalYearConfig(activeFy).label} Monthly Timeline, S-Curve Trends &amp; Detailed Metric Analyzer
            </p>
          </div>
        </div>
      </div>

      {/* Level-Based Hierarchical Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs" id="project-dashboard-hierarchy-filters">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Level-Based Filter System</h3>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSelectedVP('all');
              setSelectedLeader('all');
              setSelectedProjectCode('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedVP === 'all' && selectedLeader === 'all' && selectedProjectCode === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Projects Summary</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Level 1: All Projects */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Level 1
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {projects.length} Projects
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">All Projects Summary</h4>
            </div>
            <button
              onClick={() => {
                setSelectedVP('all');
                setSelectedLeader('all');
                setSelectedProjectCode('all');
              }}
              className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                selectedVP === 'all' && selectedLeader === 'all' && selectedProjectCode === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {selectedVP === 'all' && selectedLeader === 'all' ? '✓ Showing All' : 'Reset to All'}
            </button>
          </div>

          {/* Level 2: Executive VP Selector */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Level 2
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {vpList.length} VPs
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Select Executive VP</h4>
            </div>
            <select
              value={selectedVP}
              onChange={(e) => handleVPChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All VPs</option>
              {vpList.map(vp => (
                <option key={vp} value={vp}>{vp}</option>
              ))}
            </select>
          </div>

          {/* Level 3: Reporting Leader Selector */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Level 3
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {filteredLeaders.length} Leaders
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Select Project Leader</h4>
            </div>
            <select
              value={selectedLeader}
              onChange={(e) => handleLeaderChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">All Leaders</option>
              {filteredLeaders.map(lead => (
                <option key={lead} value={lead}>{lead}</option>
              ))}
            </select>
          </div>

          {/* Specific Project Selector (Searchable by Project Name) */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-150 flex flex-col justify-between relative" ref={projectComboboxRef}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Specific Project
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {filteredProjects.length} Available
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Drilldown Project</h4>
            </div>

            {/* Combobox Trigger Button */}
            <button
              type="button"
              onClick={() => setIsProjectComboboxOpen(!isProjectComboboxOpen)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 text-left flex items-center justify-between shadow-2xs hover:border-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <span className="truncate">
                {selectedProjectCode === 'all' 
                  ? `All Projects (${projectList.length})` 
                  : (projectList.find(p => p.code === selectedProjectCode)?.name || 'Select Project')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Searchable Projects List Dropdown */}
            {isProjectComboboxOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 min-w-[260px]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by project name..."
                    value={projectSearchTerm}
                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectCode('all');
                      setIsProjectComboboxOpen(false);
                      setProjectSearchTerm('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedProjectCode === 'all' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    All Projects ({projectList.length})
                  </button>

                  {projectList
                    .filter(p => p.name.toLowerCase().includes(projectSearchTerm.toLowerCase()))
                    .map(p => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => {
                          setSelectedProjectCode(p.code);
                          setIsProjectComboboxOpen(false);
                          setProjectSearchTerm('');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer truncate block ${
                          selectedProjectCode === p.code ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        title={p.name}
                      >
                        {p.name}
                      </button>
                    ))}

                  {projectList.filter(p => p.name.toLowerCase().includes(projectSearchTerm.toLowerCase())).length === 0 && (
                    <div className="py-3 text-center text-[11px] text-slate-400 italic">
                      No projects matching "{projectSearchTerm}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards (VOWD, Milestones, Labour, Residential UR, Commercial UC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" id="project-dashboard-metric-cards">
        {[
          { 
            key: 'vowd' as MetricType, 
            label: 'VOWD', 
            unit: 'Cr.', 
            titleColor: 'text-blue-600',
            badgeBg: 'bg-blue-50 text-blue-600', 
            barColor: 'bg-blue-600',
            activeRing: 'ring-2 ring-blue-500 border-blue-300' 
          },
          { 
            key: 'milestone' as MetricType, 
            label: 'MILESTONES', 
            unit: 'Nos.', 
            titleColor: 'text-emerald-700',
            badgeBg: 'bg-emerald-50 text-emerald-700', 
            barColor: 'bg-emerald-600',
            activeRing: 'ring-2 ring-emerald-500 border-emerald-300' 
          },
          { 
            key: 'labour' as MetricType, 
            label: 'LABOUR', 
            unit: 'Labours', 
            titleColor: 'text-purple-600',
            badgeBg: 'bg-purple-50 text-purple-600', 
            barColor: 'bg-purple-600',
            activeRing: 'ring-2 ring-purple-500 border-purple-300' 
          },
          { 
            key: 'ur' as MetricType, 
            label: 'UNIT DELIVERY - RESIDENTIAL', 
            unit: 'Units', 
            titleColor: 'text-orange-600',
            badgeBg: 'bg-orange-50 text-orange-600', 
            barColor: 'bg-orange-600',
            activeRing: 'ring-2 ring-orange-500 border-orange-300' 
          },
          { 
            key: 'uc' as MetricType, 
            label: 'UNIT DELIVERY - COMMERCIAL', 
            unit: 'Sqft', 
            titleColor: 'text-amber-700',
            badgeBg: 'bg-amber-50 text-amber-700', 
            barColor: 'bg-amber-600',
            activeRing: 'ring-2 ring-amber-500 border-amber-300' 
          },
        ].map((card) => {
          const metricData = consolidatedMetrics[card.key];
          const isActive = activeMetric === card.key;
          const pct = metricData.pct;
          const cappedPct = Math.min(100, Math.max(0, pct));

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setActiveMetric(card.key)}
              className={`bg-white border rounded-2xl p-4 text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-sm ${
                isActive 
                  ? `${card.activeRing} shadow-md` 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Row: Title + Percentage Pill */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`text-[11px] font-black tracking-wider uppercase ${card.titleColor}`}>
                  {card.label}
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${card.badgeBg}`}>
                  {pct}%
                </span>
              </div>

              {/* Middle Row: Achieved / Planned */}
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  {metricData.ach.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  / {metricData.plan.toLocaleString()} {card.unit}
                </span>
              </div>

              {/* Bottom Row: Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${card.barColor}`}
                  style={{ width: `${cappedPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main FY 26-27 Monthly Progress Curve & Graph Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="project-dashboard-main-visualizer">
        
        {/* Composed Chart Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-2 space-y-4" id="project-dashboard-trend-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {getFiscalYearConfig(activeFy).label} Monthly Progress Curve — {currentConfig.label}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Monthly Planned vs Actuals + Cumulative Progress S-Curve
              </p>
            </div>

            {/* Controls: Plan Phase + Display Mode */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setSelectedPlanType('r0')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedPlanType === 'r0' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  R0 Plan
                </button>
                <button
                  onClick={() => setSelectedPlanType('r1')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedPlanType === 'r1' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  R1 Plan
                </button>
                <button
                  onClick={() => setSelectedPlanType('both')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedPlanType === 'both' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Compare
                </button>
              </div>

              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setShowMonthlyBars(!showMonthlyBars)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    showMonthlyBars ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Bars
                </button>
                <button
                  onClick={() => setShowCumulativeLines(!showCumulativeLines)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    showCumulativeLines ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  S-Curve
                </button>
              </div>
            </div>
          </div>

          {/* Graph Container */}
          <div className="h-[360px] w-full" id="project-dashboard-recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 20, right: showMonthlyBars && showCumulativeLines ? 30 : 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={600} 
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                />
                {showMonthlyBars && showCumulativeLines && (
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600} 
                    tickLine={false}
                    axisLine={false}
                    dx={5}
                  />
                )}

                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataObj = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-[10px] font-medium space-y-2 max-w-[280px]">
                          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{dataObj.month}</p>
                          
                          {showMonthlyBars && (
                            <div className="space-y-1">
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Monthly Breakdown</p>
                              {selectedPlanType === 'both' ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">R0 Plan:</span>
                                    <span className="font-bold text-slate-800">{dataObj.PlanR0} {currentConfig.unit}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">R1 Plan:</span>
                                    <span className="font-bold" style={{ color: currentConfig.colorPlan }}>{dataObj.PlanR1} {currentConfig.unit}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">{selectedPlanType === 'r0' ? 'R0' : 'R1'} Plan:</span>
                                  <span className="font-bold text-slate-800">{dataObj.Plan} {currentConfig.unit}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Actual Completed:</span>
                                <span className="font-bold" style={{ color: currentConfig.colorAch }}>
                                  {dataObj.Achievement !== null ? `${dataObj.Achievement} ${currentConfig.unit}` : 'N/A'}
                                </span>
                              </div>
                              {dataObj['Achievement %'] !== null && (
                                <div className="flex items-center justify-between font-bold border-t border-slate-100 pt-0.5">
                                  <span className="text-slate-500">Ach. Rate:</span>
                                  <span className="text-indigo-600">{dataObj['Achievement %']}%</span>
                                </div>
                              )}
                            </div>
                          )}

                          {showCumulativeLines && (
                            <div className="space-y-1 pt-1 border-t border-slate-100">
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Cumulative Total</p>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Cum. Plan:</span>
                                <span className="font-bold text-slate-800">{dataObj.CumPlan} {currentConfig.unit}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Cum. Actual:</span>
                                <span className="font-bold" style={{ color: currentConfig.colorAch }}>
                                  {dataObj.CumAchievement !== null ? `${dataObj.CumAchievement} ${currentConfig.unit}` : 'N/A'}
                                </span>
                              </div>
                              {dataObj['CumAchievement %'] !== null && (
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-slate-500">Cum. Ach. Rate:</span>
                                  <span className="text-emerald-600">{dataObj['CumAchievement %']}%</span>
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
                {showMonthlyBars && (
                  selectedPlanType === 'both' ? (
                    <>
                      <Bar yAxisId="left" dataKey="PlanR0" name="R0 Plan" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={15}>
                        <LabelList dataKey="PlanR0" content={renderPlanLabel} />
                      </Bar>
                      <Bar yAxisId="left" dataKey="PlanR1" name="R1 Plan" fill={currentConfig.colorPlan} radius={[4, 4, 0, 0]} maxBarSize={15}>
                        <LabelList dataKey="PlanR1" content={renderPlanLabel} />
                      </Bar>
                      <Bar yAxisId="left" dataKey="Achievement" name="Actual Ach" fill={currentConfig.colorAch} radius={[4, 4, 0, 0]} maxBarSize={15}>
                        <LabelList dataKey="Achievement" content={renderAchievementLabel} />
                      </Bar>
                    </>
                  ) : (
                    <>
                      <Bar yAxisId="left" dataKey="Plan" name={`${selectedPlanType === 'r0' ? 'R0' : 'R1'} Plan`} fill={currentConfig.colorPlan} radius={[4, 4, 0, 0]} maxBarSize={28}>
                        <LabelList dataKey="Plan" content={renderPlanLabel} />
                      </Bar>
                      <Bar yAxisId="left" dataKey="Achievement" name="Actual Ach" fill={currentConfig.colorAch} radius={[4, 4, 0, 0]} maxBarSize={28}>
                        <LabelList dataKey="Achievement" content={renderAchievementLabel} />
                      </Bar>
                    </>
                  )
                )}

                {/* Cumulative S-Curves */}
                {showCumulativeLines && (
                  selectedPlanType === 'both' ? (
                    <>
                      <Line 
                        yAxisId={showMonthlyBars ? "right" : "left"} 
                        type="monotone" 
                        dataKey="CumPlanR0" 
                        name="Cum R0 Plan" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                      >
                        <LabelList dataKey="CumPlanR0" content={renderCumPlanLineLabel} />
                      </Line>
                      <Line 
                        yAxisId={showMonthlyBars ? "right" : "left"} 
                        type="monotone" 
                        dataKey="CumPlanR1" 
                        name="Cum R1 Plan" 
                        stroke={currentConfig.colorPlan} 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      >
                        <LabelList dataKey="CumPlanR1" content={renderCumPlanLineLabel} />
                      </Line>
                      <Line 
                        yAxisId={showMonthlyBars ? "right" : "left"} 
                        type="monotone" 
                        dataKey="CumAchievement" 
                        name="Cum Actual" 
                        stroke={currentConfig.colorAch} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      >
                        <LabelList dataKey="CumAchievement" content={renderCumAchLineLabel} />
                      </Line>
                    </>
                  ) : (
                    <>
                      <Line 
                        yAxisId={showMonthlyBars ? "right" : "left"} 
                        type="monotone" 
                        dataKey="CumPlan" 
                        name={`Cum ${selectedPlanType === 'r0' ? 'R0' : 'R1'} Plan`} 
                        stroke={currentConfig.colorPlan} 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      >
                        <LabelList dataKey="CumPlan" content={renderCumPlanLineLabel} />
                      </Line>
                      <Line 
                        yAxisId={showMonthlyBars ? "right" : "left"} 
                        type="monotone" 
                        dataKey="CumAchievement" 
                        name="Cum Actual" 
                        stroke={currentConfig.colorAch} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      >
                        <LabelList dataKey="CumAchievement" content={renderCumAchLineLabel} />
                      </Line>
                    </>
                  )
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Achievement Efficiency Rate Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4" id="project-dashboard-delivery-ratio-panel">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Achievement Efficiency Rate</h3>
            <p className="text-[10px] text-slate-400">Month-by-month targets met vs variance curve</p>
          </div>

          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 18, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  fontWeight={500} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  fontWeight={500} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 150]}
                  unit="%"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const rate = payload[0].value as number;
                      return (
                        <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-[9px] font-bold">
                          {payload[0].payload.month}: {rate}% Met
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Achievement %" 
                  stroke={currentConfig.colorAch} 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 1 }} 
                  activeDot={{ r: 6 }} 
                >
                  <LabelList dataKey="Achievement %" content={renderEfficiencyRateLabel} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-700 block">Executive Target Benchmark</span>
              <span className="text-[9px] text-slate-500 leading-relaxed block">
                Target achievement rates above 90% indicate on-track execution. Deliveries below 75% trigger executive review.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Month-by-Month Metric Analyzer Table (Consolidated in the same window) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4" id="project-dashboard-monthly-analyzer-table">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Detailed Metric Analyzer Table — {getFiscalYearConfig(activeFy).label} ({currentConfig.label})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Month-by-month targets, revised baselines, and cumulative accomplishment
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDetailTableCollapsed(!isDetailTableCollapsed)}
              className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all flex items-center gap-1 cursor-pointer no-print shadow-2xs"
              title={isDetailTableCollapsed ? "Expand Breakdown Table" : "Collapse Breakdown Table"}
            >
              {isDetailTableCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Expand Table</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Collapse Table</span>
                </>
              )}
            </button>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold">
            Unit: {currentConfig.unit}
          </span>
        </div>

        {!isDetailTableCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-y border-slate-200">
                  <th className="py-3 px-3">Month</th>
                  {selectedPlanType === 'both' ? (
                    <>
                      <th className="py-3 px-3 text-right">R0 Plan</th>
                      <th className="py-3 px-3 text-right text-indigo-700">R1 Plan</th>
                    </>
                  ) : (
                    <th className="py-3 px-3 text-right">{selectedPlanType.toUpperCase()} Plan</th>
                  )}
                  <th className="py-3 px-3 text-right text-emerald-700">Monthly Actual</th>
                  <th className="py-3 px-3 text-right">Monthly Ach %</th>
                  {selectedPlanType === 'both' ? (
                    <>
                      <th className="py-3 px-3 text-right">Cum R0 Plan</th>
                      <th className="py-3 px-3 text-right text-indigo-700">Cum R1 Plan</th>
                    </>
                  ) : (
                    <th className="py-3 px-3 text-right">Cum Plan</th>
                  )}
                  <th className="py-3 px-3 text-right text-emerald-700">Cum Actual</th>
                  <th className="py-3 px-3 text-right font-black">Cum Ach %</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                {monthlyData.map((row, idx) => {
                  const isFuture = row.Achievement === null;
                  const cumPct = row['CumAchievement %'];

                  return (
                    <tr key={row.month} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.month}</td>
                      {selectedPlanType === 'both' ? (
                        <>
                          <td className="py-2.5 px-3 text-right text-slate-600">{row.PlanR0.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{row.PlanR1.toLocaleString()}</td>
                        </>
                      ) : (
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{row.Plan.toLocaleString()}</td>
                      )}
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                        {isFuture ? '-' : row.Achievement?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {isFuture || row['Achievement %'] === null ? (
                          <span className="text-slate-400 font-normal">-</span>
                        ) : (
                          <span className={row['Achievement %'] >= 90 ? 'text-emerald-600' : row['Achievement %'] >= 75 ? 'text-amber-600' : 'text-rose-600'}>
                            {row['Achievement %']}%
                          </span>
                        )}
                      </td>
                      {selectedPlanType === 'both' ? (
                        <>
                          <td className="py-2.5 px-3 text-right text-slate-600">{row.CumPlanR0.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{row.CumPlanR1.toLocaleString()}</td>
                        </>
                      ) : (
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{row.CumPlan.toLocaleString()}</td>
                      )}
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                        {isFuture ? '-' : row.CumAchievement?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        {isFuture || cumPct === null ? (
                          <span className="text-slate-400 font-normal">-</span>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            cumPct >= 90 ? 'bg-emerald-100 text-emerald-800 font-extrabold' :
                            cumPct >= 75 ? 'bg-amber-100 text-amber-800 font-extrabold' :
                            'bg-rose-100 text-rose-800 font-extrabold'
                          }`}>
                            {cumPct}%
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isFuture ? (
                          <span className="text-slate-400 text-[10px]">Upcoming</span>
                        ) : cumPct !== null && cumPct >= 90 ? (
                          <span className="text-emerald-700 font-bold text-[10px]">🟢 On Track</span>
                        ) : cumPct !== null && cumPct >= 75 ? (
                          <span className="text-amber-700 font-bold text-[10px]">🟡 Moderate</span>
                        ) : (
                          <span className="text-rose-700 font-bold text-[10px]">🔴 Critical</span>
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



      {/* Multi-Metric Time Series Trend Curves Grid */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Multi-Metric Trend Curves ({getFiscalYearConfig(activeFy).label})
          </h3>
          <p className="text-xs text-slate-500">
            Visual comparisons across all 5 key deliverable metrics
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* VOWD Mini Card */}
          <div 
            onClick={() => setActiveMetric('vowd')}
            className={`bg-white border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
              activeMetric === 'vowd' ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Metric 1</span>
                <h4 className="text-xs font-bold text-slate-800">Value of Work Done (VOWD)</h4>
              </div>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {consolidatedMetrics.vowd.pct}%
              </span>
            </div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiMetricMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="vowdAch" stroke="#1d4ed8" strokeWidth={2} fill="#3b82f6" fillOpacity={0.15} name="Actual" />
                  <Line type="monotone" dataKey="vowdPlan" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Plan" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Milestone Mini Card */}
          <div 
            onClick={() => setActiveMetric('milestone')}
            className={`bg-white border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
              activeMetric === 'milestone' ? 'ring-2 ring-emerald-500 border-emerald-300' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Metric 2</span>
                <h4 className="text-xs font-bold text-slate-800">Milestone Delivery</h4>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {consolidatedMetrics.milestone.pct}%
              </span>
            </div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiMetricMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="milestoneAch" stroke="#15803d" strokeWidth={2} fill="#22c55e" fillOpacity={0.15} name="Actual" />
                  <Line type="monotone" dataKey="milestonePlan" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Plan" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Labour Mini Card */}
          <div 
            onClick={() => setActiveMetric('labour')}
            className={`bg-white border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
              activeMetric === 'labour' ? 'ring-2 ring-purple-500 border-purple-300' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Metric 3</span>
                <h4 className="text-xs font-bold text-slate-800">Labour Deployment</h4>
              </div>
              <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {consolidatedMetrics.labour.pct}%
              </span>
            </div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiMetricMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="labourAch" stroke="#6d28d9" strokeWidth={2} fill="#a855f7" fillOpacity={0.15} name="Actual" />
                  <Line type="monotone" dataKey="labourPlan" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Plan" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unit Delivery - Residential Mini Card */}
          <div 
            onClick={() => setActiveMetric('ur')}
            className={`bg-white border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
              activeMetric === 'ur' ? 'ring-2 ring-orange-500 border-orange-300' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Metric 4</span>
                <h4 className="text-xs font-bold text-slate-800">Unit Delivery - Residential</h4>
              </div>
              <span className="text-xs font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                {consolidatedMetrics.ur.pct}%
              </span>
            </div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiMetricMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="urAch" stroke="#c2410c" strokeWidth={2} fill="#f97316" fillOpacity={0.15} name="Actual" />
                  <Line type="monotone" dataKey="urPlan" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Plan" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unit Delivery - Commercial Mini Card */}
          <div 
            onClick={() => setActiveMetric('uc')}
            className={`bg-white border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
              activeMetric === 'uc' ? 'ring-2 ring-amber-500 border-amber-300' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Metric 5</span>
                <h4 className="text-xs font-bold text-slate-800">Unit Delivery - Commercial</h4>
              </div>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {consolidatedMetrics.uc.pct}%
              </span>
            </div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiMetricMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="ucAch" stroke="#b45309" strokeWidth={2} fill="#f59e0b" fillOpacity={0.15} name="Actual" />
                  <Line type="monotone" dataKey="ucPlan" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Plan" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Achievement Monthwise Curves: SPI, Labour Productivity, Quality Rating, Safety Rating, Avg QHSE Rating */}
      <div className="space-y-4 pt-2" id="project-dashboard-ratings-curves">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-600" />
              <span>Executive Productivity &amp; Rating Monthwise Curves ({getFiscalYearConfig(activeFy).label})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Month-by-month achieved trend for SPI, Labour Productivity, Quality Rating, Safety Rating &amp; Composite QHSE
            </p>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            Achievement Only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. SPI Monthly Trend */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Performance</span>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>Schedule Performance Index (SPI)</span>
                </h4>
              </div>
              <span className="text-xs font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                Target: 1.00+
              </span>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingsMonthlyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} domain={[0.5, 1.5]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value;
                        return (
                          <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-[9px] font-bold">
                            {payload[0].payload.month}: SPI {val !== null ? val : 'N/A'}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="spi" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3.5, fill: '#0284c7' }} name="SPI">
                    <LabelList dataKey="spi" content={renderSpiRatingLabel} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Labour Productivity Monthly Trend */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</span>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>Labour Productivity</span>
                </h4>
              </div>
              <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                ₹/Lab./Day
              </span>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingsMonthlyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value;
                        return (
                          <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-[9px] font-bold">
                            {payload[0].payload.month}: ₹{val ? Number(val).toLocaleString() : 'N/A'} /Lab./Day
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="labourProductivity" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={22} name="Productivity">
                    <LabelList dataKey="labourProductivity" content={renderLabourProdMonthlyLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Quality Rating Monthly Trend (Scale 0-10) */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Rating</span>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>Quality Rating</span>
                </h4>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Target: 8.5 / 10
              </span>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingsMonthlyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value;
                        return (
                          <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-[9px] font-bold">
                            {payload[0].payload.month}: Quality {val !== null ? `${val} / 10` : 'N/A'}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="quality" stroke="#059669" strokeWidth={2.5} fill="#10b981" fillOpacity={0.15} name="Quality">
                    <LabelList dataKey="quality" content={renderQualityRatingLabel} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Safety Rating Monthly Trend (Scale 0-10) */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">HSE Compliance</span>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>Safety Rating</span>
                </h4>
              </div>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Target: 8.5 / 10
              </span>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingsMonthlyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value;
                        return (
                          <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-[9px] font-bold">
                            {payload[0].payload.month}: Safety {val !== null ? `${val} / 10` : 'N/A'}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="safety" stroke="#d97706" strokeWidth={2.5} fill="#f59e0b" fillOpacity={0.15} name="Safety">
                    <LabelList dataKey="safety" content={renderSafetyRatingLabel} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Avg QHSE Rating Monthly Trend (Scale 0-10) */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Composite Rating</span>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>Avg QHSE Rating</span>
                </h4>
              </div>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Scale: 0–10
              </span>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingsMonthlyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value;
                        return (
                          <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-[9px] font-bold">
                            {payload[0].payload.month}: QHSE {val !== null ? `${val} / 10` : 'N/A'}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="qhse" stroke="#4f46e5" strokeWidth={2.5} fill="#6366f1" fillOpacity={0.15} name="Avg QHSE">
                    <LabelList dataKey="qhse" content={renderQhseRatingLabel} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Project-Wise Contribution Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs" id="project-dashboard-breakdown-list">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project-Wise Contribution Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Individual project planned vs achieved values for {currentConfig.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsBreakdownTableCollapsed(!isBreakdownTableCollapsed)}
              className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all flex items-center gap-1 cursor-pointer no-print shadow-2xs"
              title={isBreakdownTableCollapsed ? "Expand Breakdown Table" : "Collapse Breakdown Table"}
            >
              {isBreakdownTableCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Expand Table</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Collapse Table</span>
                </>
              )}
            </button>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
            {projectBreakdown.length} Projects Contributing
          </span>
        </div>

        {!isBreakdownTableCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="py-3 px-6">Project Metadata</th>
                  <th className="py-3 px-4">VP Division</th>
                  <th className="py-3 px-4">Project Leader</th>
                  <th className="py-3 px-4 text-right">Target (Plan)</th>
                  <th className="py-3 px-4 text-right">Actual (Achieved)</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-6 text-right">% Achieved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {projectBreakdown.map((row) => (
                  <tr 
                    key={row.code}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedProjectCode(row.code)}
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {row.code}
                        </span>
                        <div className="space-y-0.5 max-w-[240px]">
                          <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition-colors">
                            {row.name}
                          </span>
                          {row.stage && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {row.stage}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{row.vp}</td>
                    <td className="py-3.5 px-4 text-slate-600">{row.leader}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {row.plan.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{currentConfig.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold" style={{ color: currentConfig.colorAch }}>
                      {row.achievement.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{currentConfig.unit}</span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-semibold ${
                      row.variance >= 0 ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {row.variance > 0 ? '+' : ''}{row.variance}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.pct >= 90 ? 'bg-emerald-50 text-emerald-700' : row.pct >= 75 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {row.pct}%
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
