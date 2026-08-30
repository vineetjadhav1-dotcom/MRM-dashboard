import React from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toJpeg } from 'html-to-image';
import { Project, Software2Project, LeaderData } from '@/src/types';
import { 
  CoverSlide, 
  SummarySlide, 
  ProgressCurveSlide, 
  ProjectCardsSlide,
  AttentionNeededSlide,
  LeaderStats,
  ProgressCurveMonthData
} from '@/src/components/report/MRMReportSlides';
import { 
  sortVpNames, 
  sortLeaderItems, 
  isCompleteOrLostStage, 
  isTempProject,
  parseSpiNumeric, 
  getStageRankForBlankSpi 
} from '@/src/utils/customOrder';
import { isUnderConstructionStage, parseBudgetValue } from '@/src/utils/sheetParser';
import { DEMO_SOFTWARE2_PROJECTS } from '@/src/hooks/useGoogleSheets';
import { getFiscalYearConfig, getStoredFiscalYear } from '@/src/utils/fiscalYear';

export interface MRMReportExportOptions {
  title?: string;
  scope?: 'full' | 'vp_only' | 'vp_full' | 'leader_only' | 'current';
  selectedVP?: string;
  selectedLeaderName?: string;
  baselinePlan?: 'r0' | 'r1' | 'both';
  projects: Project[];
  leaderDataList: LeaderData[];
  software2Projects?: Software2Project[];
  onProgress?: (current: number, total: number, message: string) => void;
}

const MONTHS_LIST = [
  'Apr-26', 'May-26', 'Jun-26', 'Jul-26', 
  'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 
  'Dec-26', 'Jan-27', 'Feb-27', 'Mar-27'
];

/**
 * Generates the standard MRM report title based on the last completed month.
 * e.g. If current month is September 2026, returns "MRM - August 26".
 * If current month is August 2026, returns "MRM - July 26".
 */
export function getDefaultMRMTitle(customDate?: Date): string {
  const now = customDate || new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthName = lastMonthDate.toLocaleString('en-US', { month: 'long' });
  const year2Digit = lastMonthDate.getFullYear().toString().slice(-2);
  return `Planedge Monthly Review Meeting (MRM) - ${monthName} ${year2Digit}`;
}

/**
 * Calculates comprehensive stats for a given set of projects
 */
export function calculateEntityStats(projects: Project[]): LeaderStats {
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

  let qhseSum = 0;
  let qhseCount = 0;
  let qualitySum = 0;
  let qualityCount = 0;
  let safetySum = 0;
  let safetyCount = 0;

  let onTrackCount = 0;

  const stageCounts = {
    upcoming: 0,
    design: 0,
    excavation: 0,
    constructionStart: 0,
    ongoing: 0,
    finishing: 0,
    nearingCompletion: 0,
    handover: 0,
    hold: 0
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

  let totalBudgetUnderManagement = 0;
  let totalBudgetUnderConstruction = 0;
  let projectsUnderConstructionCount = 0;
  let activeProjectsCount = 0;

  projects.forEach((p) => {
    if (!p) return;
    const isTemp = isTempProject(p.code);
    const isCompletedOrLost = isCompleteOrLostStage(p.projectStage);
    const budgetVal = parseBudgetValue(p.totalBudget);

    // Spatial area
    let parsedArea = 0;
    if (p.areaSqft) {
      const parsed = parseFloat(String(p.areaSqft).replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        parsedArea = parsed;
      }
    }

    // 1. Under Management, Under Construction & Stages:
    // Only count active non-temp projects
    if (!isTemp && !isCompletedOrLost) {
      activeProjectsCount++;
      totalArea += parsedArea;
      totalBudgetUnderManagement += budgetVal;

      if (isUnderConstructionStage(p.projectStage)) {
        projectsUnderConstructionCount += 1;
        areaUnderConstruction += parsedArea;
        totalBudgetUnderConstruction += budgetVal;
      }

      // Health Standing / Status
      if (p.status?.toLowerCase() === 'green') {
        onTrackCount++;
      }

      // Stages classification
      const st = (p.projectStage || '').toLowerCase();
      const projName = p.name || p.code || 'Unnamed';

      if (st.includes('upcom') || st.includes('pipeline')) {
        stageCounts.upcoming++;
        upcomingProjectNames.push(projName);
      } else if (st.includes('design') || st.includes('drawing')) {
        stageCounts.design++;
        designProjectNames.push(projName);
      } else if (st.includes('excav')) {
        stageCounts.excavation++;
        excavationProjectNames.push(projName);
      } else if (st.includes('start') || st.includes('commenc')) {
        stageCounts.constructionStart++;
        constructionStartProjectNames.push(projName);
      } else if (st.includes('finish') || st.includes('interior')) {
        stageCounts.finishing++;
        finishingProjectNames.push(projName);
      } else if (st.includes('near') || st.includes('closure')) {
        stageCounts.nearingCompletion++;
        nearingCompletionProjectNames.push(projName);
      } else if (st.includes('handover') || st.includes('possession')) {
        stageCounts.handover++;
        handoverProjectNames.push(projName);
      } else if (st.includes('hold') || st.includes('stop') || st.includes('delay')) {
        stageCounts.hold++;
        holdProjectNames.push(projName);
      } else {
        stageCounts.ongoing++;
        ongoingProjectNames.push(projName);
      }
    }

    // 2. Parameters: VOWD, Labour, Milestone, SPI, QHSE:
    // ALWAYS consider for all projects (including temp and complete/lost)

    // SPI
    if (p.spi) {
      const s = parseFloat(p.spi);
      if (!isNaN(s)) {
        spiSum += s;
        spiCount++;
      }
    }

    // Milestones
    if (p.milestonePlan) msPlan += parseFloat(String(p.milestonePlan).replace(/,/g, '')) || 0;
    if (p.milestoneAch) msAch += parseFloat(String(p.milestoneAch).replace(/,/g, '')) || 0;
    if (p.milestoneFr) msFr += parseFloat(String(p.milestoneFr).replace(/,/g, '')) || 0;

    // VOWD
    if (p.vowdPlan) vowdPlan += parseFloat(String(p.vowdPlan).replace(/[$,\s]/g, '')) || 0;
    if (p.vowdAch) vowdAch += parseFloat(String(p.vowdAch).replace(/[$,\s]/g, '')) || 0;
    if (p.vowdFr) vowdFr += parseFloat(String(p.vowdFr).replace(/[$,\s]/g, '')) || 0;

    // Labour
    if (p.labourPlan) labPlan += parseFloat(String(p.labourPlan).replace(/,/g, '')) || 0;
    if (p.labourAch) labAch += parseFloat(String(p.labourAch).replace(/,/g, '')) || 0;
    if (p.labourFr) labFr += parseFloat(String(p.labourFr).replace(/,/g, '')) || 0;

    // QHSE Ratings
    const rawQhse = p.avgQhseRating || p.qhseRating;
    if (rawQhse && rawQhse !== '-' && rawQhse.toUpperCase() !== 'N/A') {
      const q = parseFloat(String(rawQhse).replace(/%/g, ''));
      if (!isNaN(q)) {
        qhseSum += q;
        qhseCount++;
      }
    }
    if (p.qualityRating && p.qualityRating !== '-' && p.qualityRating.toUpperCase() !== 'N/A') {
      const q = parseFloat(String(p.qualityRating).replace(/%/g, ''));
      if (!isNaN(q)) {
        qualitySum += q;
        qualityCount++;
      }
    }
    if (p.safetyRating && p.safetyRating !== '-' && p.safetyRating.toUpperCase() !== 'N/A') {
      const s = parseFloat(String(p.safetyRating).replace(/%/g, ''));
      if (!isNaN(s)) {
        safetySum += s;
        safetyCount++;
      }
    }
  });

  // Calculate secondary KPIs
  const vowdAchCr = vowdAch;
  const speedOfConstruction = areaUnderConstruction > 0 ? (vowdAchCr * 10000000) / areaUnderConstruction : 0;
  const workingDays = 26;
  const labourProductivity = labAch > 0 ? (vowdAchCr * 10000000) / (labAch * workingDays) : 0;
  const labourEfficiency = labAch > 0 ? (vowdAchCr / labAch) * 100 : 0;

  return {
    totalArea,
    areaUnderConstruction,
    totalBudgetUnderManagement,
    totalBudgetUnderConstruction,
    projectsUnderConstructionCount,
    activeProjectsCount,
    avgSpi: spiCount > 0 ? spiSum / spiCount : null,
    milestones: {
      plan: msPlan,
      ach: msAch,
      pct: msPlan > 0 ? Math.round((msAch / msPlan) * 100) : 0,
      fr: msFr
    },
    vowd: {
      plan: vowdPlan,
      ach: vowdAch,
      pct: vowdPlan > 0 ? Math.round((vowdAch / vowdPlan) * 100) : 0,
      fr: vowdFr
    },
    labour: {
      plan: labPlan,
      ach: labAch,
      pct: labPlan > 0 ? Math.round((labAch / labPlan) * 100) : 0,
      fr: labFr
    },
    stageCounts,
    leaderQualityRating: qualityCount > 0 ? qualitySum / qualityCount : null,
    leaderSafetyRating: safetyCount > 0 ? safetySum / safetyCount : null,
    leaderAvgQhseRating: qhseCount > 0 ? qhseSum / qhseCount : null,
    speedOfConstruction,
    labourProductivity,
    labourEfficiency,
    onTrackCount,
    upcomingProjectNames,
    designProjectNames,
    excavationProjectNames,
    constructionStartProjectNames,
    ongoingProjectNames,
    finishingProjectNames,
    nearingCompletionProjectNames,
    handoverProjectNames,
    holdProjectNames
  };
}

/**
 * Calculates 12-month progress curve data with monthly and cumulative metrics
 */
export function calculateMonthlyCurveData(
  projects: Project[],
  metricKey: 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc',
  baselinePlan: 'r0' | 'r1' | 'both',
  software2Projects: Software2Project[]
): ProgressCurveMonthData[] {
  const activeFy = getStoredFiscalYear();
  const fyConfig = getFiscalYearConfig(activeFy);
  const monthsList = fyConfig.months.map((m) => m.key);

  const projectCodes = new Set(projects.map((p) => p.code?.trim().toUpperCase()).filter(Boolean));
  const projectNames = new Set(projects.map((p) => p.name?.trim().toUpperCase()).filter(Boolean));

  // Find matching Software 2 metric records
  let matchingS2 = software2Projects.filter((s2) => {
    const code = s2.code?.trim().toUpperCase();
    const name = s2.name?.trim().toUpperCase();
    return (code && projectCodes.has(code)) || (name && projectNames.has(name));
  });

  // Fallback: If code/name matching returns empty, match by leader or VP
  if (matchingS2.length === 0 && software2Projects && software2Projects.length > 0) {
    const leaderNames = new Set(projects.map((p) => p.leader?.trim().toUpperCase()).filter(Boolean));
    const vpNames = new Set(projects.map((p) => p.vp?.trim().toUpperCase()).filter(Boolean));
    matchingS2 = software2Projects.filter((s2) => {
      const s2Leader = s2.leader?.trim().toUpperCase();
      const s2Vp = s2.vp?.trim().toUpperCase();
      return (s2Leader && leaderNames.has(s2Leader)) || (s2Vp && vpNames.has(s2Vp));
    });
  }

  const monthData: Record<string, { planR0: number; planR1: number; ach: number; hasAch: boolean }> = {};
  monthsList.forEach((m) => {
    monthData[m] = { planR0: 0, planR1: 0, ach: 0, hasAch: false };
  });

  const normalizeMonth = (mStr: string) => (mStr || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  matchingS2.forEach((s2Proj) => {
    let metricsArray = s2Proj.vowd;
    if (metricKey === 'milestone') metricsArray = s2Proj.milestone;
    else if (metricKey === 'labour') metricsArray = s2Proj.labour;
    else if (metricKey === 'ur') metricsArray = s2Proj.ur;
    else if (metricKey === 'uc') metricsArray = s2Proj.uc;

    if (Array.isArray(metricsArray)) {
      metricsArray.forEach((item) => {
        if (!item || !item.month) return;
        const normItemMonth = normalizeMonth(item.month);
        const targetMonth = monthsList.find((m) => normalizeMonth(m) === normItemMonth) || item.month;

        if (monthData[targetMonth]) {
          const entry = monthData[targetMonth];
          entry.planR0 += item.planR0 !== undefined ? item.planR0 : (item.plan || 0);
          entry.planR1 += item.planR1 !== undefined ? item.planR1 : (item.plan || 0);
          if (item.achievement !== null && item.achievement !== undefined) {
            entry.ach += item.achievement;
            entry.hasAch = true;
          }
        }
      });
    }
  });

  let cumPlanR0 = 0;
  let cumPlanR1 = 0;
  let cumAch = 0;
  let reachedCompletedMonth = true;

  return monthsList.map((month) => {
    const entry = monthData[month];
    const plan = baselinePlan === 'r1' ? entry.planR1 : entry.planR0;
    cumPlanR0 += entry.planR0;
    cumPlanR1 += entry.planR1;
    const cumPlan = baselinePlan === 'r1' ? cumPlanR1 : cumPlanR0;

    let achievement: number | null = null;
    let achPct: number | null = null;
    let cumAchVal: number | null = null;
    let cumAchPct: number | null = null;

    if (entry.hasAch && reachedCompletedMonth) {
      achievement = entry.ach;
      achPct = plan > 0 ? Math.round((achievement / plan) * 100) : 0;
      cumAch += achievement;
      cumAchVal = cumAch;
      cumAchPct = cumPlan > 0 ? Math.round((cumAch / cumPlan) * 100) : 0;
    } else {
      reachedCompletedMonth = false;
    }

    return {
      month,
      Plan: Math.round(plan * 10) / 10,
      PlanR0: Math.round(entry.planR0 * 10) / 10,
      PlanR1: Math.round(entry.planR1 * 10) / 10,
      Achievement: achievement !== null ? Math.round(achievement * 10) / 10 : null,
      'Achievement %': achPct,
      CumPlanR0: Math.round(cumPlanR0 * 10) / 10,
      CumPlanR1: Math.round(cumPlanR1 * 10) / 10,
      CumPlan: Math.round(cumPlan * 10) / 10,
      CumAchievement: cumAchVal !== null ? Math.round(cumAchVal * 10) / 10 : null,
      'CumAchievement %': cumAchPct
    };
  });
}

/**
 * Sorts project items by custom criteria
 */
export function sortProjectsForSlides(projects: Project[]): Project[] {
  return [...projects]
    .filter((p) => !isTempProject(p.code) && !isCompleteOrLostStage(p.projectStage))
    .sort((a, b) => {
      const spiA = parseSpiNumeric(a.spi);
      const spiB = parseSpiNumeric(b.spi);

      if (spiA !== null && spiB !== null) {
        return spiB - spiA;
      }
      if (spiA !== null) return -1;
      if (spiB !== null) return 1;

      const rankA = getStageRankForBlankSpi(a.projectStage);
      const rankB = getStageRankForBlankSpi(b.projectStage);
      if (rankA !== rankB) return rankA - rankB;

      return (a.code || a.name || '').localeCompare(b.code || b.name || '');
    });
}

interface SlideDescriptor {
  type: 'cover' | 'summary' | 'curve' | 'cards' | 'attention';
  element: React.ReactElement;
  label: string;
}

/**
 * High-performance, bulletproof full MRM multi-page PDF presentation generator
 * uses html-to-image (SVG foreignObject native browser rendering pipeline) to ensure
 * 100% compatibility with all CSS, colors, and layouts without parsing bugs.
 */
export async function generateFullMRMReport(options: MRMReportExportOptions): Promise<void> {
  const {
    title = getDefaultMRMTitle(),
    scope = 'full',
    selectedVP = 'all',
    selectedLeaderName = 'all',
    baselinePlan = 'r0',
    projects,
    leaderDataList,
    software2Projects,
    onProgress
  } = options;

  const s2List = software2Projects && software2Projects.length > 0 ? software2Projects : DEMO_SOFTWARE2_PROJECTS;

  // Determine leaders to include based on scope
  let targetLeaders: LeaderData[] = [];

  if (scope === 'leader_only' || (scope === 'current' && selectedLeaderName !== 'all')) {
    const single = leaderDataList.find((l) => l.name === selectedLeaderName);
    if (single) targetLeaders = [single];
    else if (leaderDataList.length > 0) targetLeaders = [leaderDataList[0]];
  } else if (scope === 'vp_full' || (scope === 'current' && selectedVP !== 'all')) {
    const vp = selectedVP !== 'all' ? selectedVP : 'KM';
    targetLeaders = leaderDataList.filter((l) => l.vpName === vp).sort(sortLeaderItems);
  } else if (scope === 'vp_only') {
    targetLeaders = []; // Only VP slides
  } else {
    // Full consolidated deck
    targetLeaders = [...leaderDataList].sort(sortLeaderItems);
  }

  // Determine top VP / Portfolio entity
  const vpLabel = selectedVP !== 'all' ? selectedVP : 'KM';
  const vpProjects = selectedVP !== 'all' ? projects.filter((p) => p.vp === selectedVP) : projects;

  const slides: SlideDescriptor[] = [];

  // =========================================================================
  // 1. VP / PORTFOLIO SECTION (Cover + Summary + 5 Progress Curves + Attention Needed)
  // =========================================================================
  if (scope === 'full' || scope === 'vp_only' || scope === 'vp_full' || (scope === 'current' && selectedLeaderName === 'all')) {
    // 1.1 Cover Slide
    slides.push({
      type: 'cover',
      label: `Team ${vpLabel} Cover`,
      element: <CoverSlide title={title} teamName={`Team ${vpLabel}`} />
    });

    // 1.2 VP Summary Slide
    const vpStats = calculateEntityStats(vpProjects);
    const vpActiveCount = vpStats.activeProjectsCount || 0;
    slides.push({
      type: 'summary',
      label: `VP: ${vpLabel} Summary`,
      element: (
        <SummarySlide
          title={`VP: ${vpLabel} Summary`}
          subtitle={`Overseeing a collection of ${vpActiveCount} active operational projects under ${vpLabel}.`}
          projectsCount={vpActiveCount}
          onTrackCount={vpStats.onTrackCount}
          stats={vpStats}
        />
      )
    });

    // 1.3 5 VP Monthly Progress Curves
    const curveKeys: Array<'vowd' | 'milestone' | 'labour' | 'ur' | 'uc'> = ['vowd', 'milestone', 'labour', 'ur', 'uc'];
    curveKeys.forEach((mKey) => {
      const curveData = calculateMonthlyCurveData(vpProjects, mKey, baselinePlan, s2List);
      slides.push({
        type: 'curve',
        label: `VP ${vpLabel} - ${mKey.toUpperCase()} Curve`,
        element: (
          <ProgressCurveSlide
            projectsCount={vpActiveCount}
            metricKey={mKey}
            baselinePlan={baselinePlan}
            monthlyData={curveData}
          />
        )
      });
    });

    // 1.4 Attention Needed Slide for VP Portfolio
    slides.push({
      type: 'attention',
      label: `VP ${vpLabel} - Attention Needed`,
      element: (
        <AttentionNeededSlide
          title={`Attention Needed — Critical Projects (${vpLabel})`}
          subtitle={`Key operational deliverable variances & prioritized recovery roadmap under Team ${vpLabel}.`}
          teamName={`Team ${vpLabel}`}
          projects={vpProjects}
          software2Projects={s2List}
        />
      )
    });
  }

  // =========================================================================
  // 2. TEAM LEADER SECTIONS (Cover -> Summary -> 5 Curves -> Attention Needed -> 6-card Project Pages)
  // =========================================================================
  targetLeaders.forEach((leader) => {
    const leaderProjects = leader.projects || [];
    const sortedActive = sortProjectsForSlides(leaderProjects);
    const leaderStats = calculateEntityStats(leaderProjects);
    const leaderActiveCount = leaderStats.activeProjectsCount || 0;

    // 2.1 Leader Cover Slide
    slides.push({
      type: 'cover',
      label: `Team ${leader.name} Cover`,
      element: <CoverSlide title={title} teamName={`Team ${leader.name}`} />
    });

    // 2.2 Leader Summary Slide
    slides.push({
      type: 'summary',
      label: `Leader: ${leader.name} Summary`,
      element: (
        <SummarySlide
          title={`Leader: ${leader.name} Portfolio`}
          subtitle={`Detailed operational overview of ${leader.name}'s ${leaderActiveCount} active projects.`}
          projectsCount={leaderActiveCount}
          onTrackCount={leaderStats.onTrackCount}
          stats={leaderStats}
        />
      )
    });

    // 2.3 5 Leader Monthly Progress Curves
    const curveKeys: Array<'vowd' | 'milestone' | 'labour' | 'ur' | 'uc'> = ['vowd', 'milestone', 'labour', 'ur', 'uc'];
    curveKeys.forEach((mKey) => {
      const curveData = calculateMonthlyCurveData(leaderProjects, mKey, baselinePlan, s2List);
      slides.push({
        type: 'curve',
        label: `Leader ${leader.name} - ${mKey.toUpperCase()} Curve`,
        element: (
          <ProgressCurveSlide
            projectsCount={leaderActiveCount}
            metricKey={mKey}
            baselinePlan={baselinePlan}
            monthlyData={curveData}
          />
        )
      });
    });

    // 2.4 Leader Project Cards Slides (Paginated in 6 cards per page)
    if (sortedActive.length > 0) {
      for (let i = 0; i < sortedActive.length; i += 6) {
        const chunk = sortedActive.slice(i, i + 6);
        const pageNum = Math.floor(i / 6) + 1;
        slides.push({
          type: 'cards',
          label: `Leader ${leader.name} Projects (Page ${pageNum})`,
          element: (
            <ProjectCardsSlide
              totalProjectsCount={sortedActive.length}
              projects={chunk}
            />
          )
        });
      }
    }

    // 2.5 Leader Attention Needed Slide (comes AFTER project cards)
    slides.push({
      type: 'attention',
      label: `Leader ${leader.name} - Attention Needed`,
      element: (
        <AttentionNeededSlide
          title={`Attention Needed — Top 7 Critical Projects`}
          subtitle={`In-depth performance diagnosis analyzing data from April 2026 to Aug-26. Highlights lagging deliverable parameters, shortfall gaps, labour productivity, efficiency, speed of construction, and executive recovery actions.`}
          teamName={`Team ${leader.name}`}
          projects={leaderProjects}
          software2Projects={s2List}
        />
      )
    });
  });

  const totalSlides = slides.length;
  if (totalSlides === 0) return;

  // Initialize jsPDF document (A4 Landscape = 297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = 297;
  const pdfHeight = 210;

  // Create temporary container for mounting slides visibly on-screen (behind the modal backdrop)
  const container = document.createElement('div');
  container.id = 'mrm-pdf-render-canvas';
  container.style.position = 'fixed';
  container.style.top = '0px';
  container.style.left = '0px';
  container.style.width = '1122px';
  container.style.height = '794px';
  container.style.overflow = 'hidden';
  container.style.zIndex = '40';
  container.style.backgroundColor = '#ffffff';
  container.style.pointerEvents = 'none';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    for (let index = 0; index < totalSlides; index++) {
      const slide = slides[index];

      if (onProgress) {
        onProgress(index + 1, totalSlides, `Rendering Slide ${index + 1} of ${totalSlides}: ${slide.label}`);
      }

      // Render slide component into container
      root.render(slide.element);

      // Fast async wait for React 18 DOM flush and SVG painting
      await new Promise((resolve) => setTimeout(resolve, 120));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      let imgData = '';
      try {
        // High-speed native SVG foreignObject image capture
        imgData = await toJpeg(container, {
          quality: 0.92,
          pixelRatio: 1.5,
          backgroundColor: '#ffffff',
          width: 1122,
          height: 794,
          skipFonts: true,
          cacheBust: false
        });
      } catch (fastErr) {
        console.warn('toJpeg fast capture warning, using html2canvas fallback:', fastErr);
        const canvas = await html2canvas(container, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1122,
          height: 794,
          logging: false
        });
        imgData = canvas.toDataURL('image/jpeg', 0.92);
      }

      if (index > 0) {
        pdf.addPage('a4', 'landscape');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    if (onProgress) {
      onProgress(totalSlides, totalSlides, 'Compiling and saving PDF document...');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const scopeTag = scope === 'leader_only' ? `Leader_${selectedLeaderName}` : selectedVP !== 'all' ? `VP_${selectedVP}` : 'Full_MRM_Deck';
    const finalFilename = `Planedge_MRM_Report_${scopeTag}_${timestamp}.pdf`;

    // Save and trigger download
    pdf.save(finalFilename);

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 2000);

  } finally {
    // Cleanup container and React root
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
