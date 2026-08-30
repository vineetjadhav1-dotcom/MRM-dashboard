import { useState, useEffect, useCallback } from 'react';
import { Project, ColumnMapping, Software2Project, Software2Mapping, FiscalYearKey, Software3Milestone } from '@/src/types';
import { getAccessToken, initAuth } from '@/src/lib/firebase';
import { scoreHeaderRow, detectColumnMapping, parseSheetData, parseSoftware2Data, parseSoftware3Data } from '@/src/utils/sheetParser';
import { fetchPublicGoogleSheet, TARGET_SPREADSHEET_ID, TAB_SOFTWARE_1, TAB_SOFTWARE_2, TAB_SOFTWARE_3 } from '@/src/utils/googleSheetsApi';
import { getFiscalYearConfig, getStoredFiscalYear } from '@/src/utils/fiscalYear';

const SPREADSHEET_ID = TARGET_SPREADSHEET_ID;
const SHEET_NAME = TAB_SOFTWARE_1;
const SHEET_NAME_2 = TAB_SOFTWARE_2;
const SHEET_NAME_3 = TAB_SOFTWARE_3;

// Sleek demo data for immediate preview or fallback
export const DEMO_PROJECTS: Project[] = [
  { 
    code: "PRJ-2026-001", 
    name: "Enterprise Cloud Migration", 
    leader: "Sarah Jenkins", 
    vp: "Rajesh Kumar", 
    area: "Infrastructure", 
    status: "Green", 
    progress: "85%", 
    targetDate: "2026-09-30", 
    update: "Phase 2 migration completed successfully. Databases are now in Cloud Spanner. On track for global switchover.",
    areaSqft: "45,000",
    projectStage: "Execution",
    pmSiteIncharge: "Aleksei Tarasov",
    baselineFinish: "2026-09-15",
    baseline1Finish: "2026-09-20",
    proposedFinish: "2026-09-30",
    scheduleVariance: "+15 Days",
    delayInCurrentMonth: "0 Days",
    totalBudget: "$450,000",
    totalLabours: "150",
    totalMilestone: "12",
    spi: "1.05",
    qhseRating: "A+",
    milestonePlan: "12", milestoneAch: "11", milestonePctAch: "91.6%", milestoneFr: "4",
    vowdPlan: "$350,000", vowdAch: "$345,000", vowdPctAch: "98.5%", vowdFr: "$280,000",
    labourPlan: "150", labourAch: "148", labourPctAch: "98.6%", labourFr: "160",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-002", 
    name: "Omnichannel Checkout Flow", 
    leader: "Marcus Vance", 
    vp: "Elena Rostova", 
    area: "Core Commerce", 
    status: "Amber", 
    progress: "60%", 
    targetDate: "2026-11-15", 
    update: "Friction points identified in card tokenization API. Working with provider to resolve latency.",
    areaSqft: "28,500",
    projectStage: "Engineering",
    baselineFinish: "2026-10-31",
    baseline1Finish: "2026-11-05",
    proposedFinish: "2026-11-15",
    scheduleVariance: "+15 Days",
    delayInCurrentMonth: "10 Days",
    spi: "0.92",
    qhseRating: "A",
    milestonePlan: "8", milestoneAch: "6", milestonePctAch: "75%", milestoneFr: "3",
    vowdPlan: "$180,000", vowdAch: "$165,000", vowdPctAch: "91.6%", vowdFr: "$150,000",
    labourPlan: "90", labourAch: "85", labourPctAch: "94.4%", labourFr: "95",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-003", 
    name: "AI Customer Co-Pilot Integration", 
    leader: "Sarah Jenkins", 
    vp: "Rajesh Kumar", 
    area: "AI & Innovation", 
    status: "Green", 
    progress: "90%", 
    targetDate: "2026-08-15", 
    update: "V3 model fine-tuning yielded 95% CSAT on beta users. Setting up final production deployment configs.",
    areaSqft: "15,000",
    projectStage: "Testing",
    baselineFinish: "2026-08-10",
    baseline1Finish: "2026-08-12",
    proposedFinish: "2026-08-15",
    scheduleVariance: "+5 Days",
    delayInCurrentMonth: "3 Days",
    spi: "1.12",
    qhseRating: "A+",
    milestonePlan: "10", milestoneAch: "10", milestonePctAch: "100%", milestoneFr: "1",
    vowdPlan: "$120,000", vowdAch: "$120,000", vowdPctAch: "100%", vowdFr: "$45,000",
    labourPlan: "40", labourAch: "40", labourPctAch: "100%", labourFr: "15",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-004", 
    name: "Global HR Portal Upgrade", 
    leader: "David Blake", 
    vp: "Elena Rostova", 
    area: "Enterprise Systems", 
    status: "Green", 
    progress: "40%", 
    targetDate: "2026-12-15", 
    update: "Completed requirement gather phase. Core schemas signed off by global payroll.",
    areaSqft: "32,000",
    projectStage: "Requirements",
    baselineFinish: "2026-12-15",
    baseline1Finish: "2026-12-15",
    proposedFinish: "2026-12-15",
    scheduleVariance: "0 Days",
    delayInCurrentMonth: "0 Days",
    spi: "1.00",
    qhseRating: "A-",
    milestonePlan: "5", milestoneAch: "2", milestonePctAch: "40%", milestoneFr: "3",
    vowdPlan: "$90,000", vowdAch: "$88,000", vowdPctAch: "97.7%", vowdFr: "$110,000",
    labourPlan: "35", labourAch: "35", labourPctAch: "100%", labourFr: "45",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-005", 
    name: "GDPR & CCPA Automated Erasure Pipeline", 
    leader: "Ananya Patel", 
    vp: "Marcus Sterling", 
    area: "Security & Compliance", 
    status: "Red", 
    progress: "25%", 
    targetDate: "2026-10-01", 
    update: "Delayed due to legacy system architecture blocker. Require dedicated DB admin support.",
    areaSqft: "22,000",
    projectStage: "Execution",
    baselineFinish: "2026-08-31",
    baseline1Finish: "2026-09-15",
    proposedFinish: "2026-10-01",
    scheduleVariance: "+30 Days",
    delayInCurrentMonth: "16 Days",
    spi: "0.74",
    qhseRating: "B-",
    milestonePlan: "15", milestoneAch: "5", milestonePctAch: "33.3%", milestoneFr: "8",
    vowdPlan: "$210,000", vowdAch: "$150,000", vowdPctAch: "71.4%", vowdFr: "$180,000",
    labourPlan: "80", labourAch: "60", labourPctAch: "75%", labourFr: "85",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-006", 
    name: "Mobile App Dark Theme & Accessibility", 
    leader: "Chen Wei", 
    vp: "Elena Rostova", 
    area: "Core Commerce", 
    status: "Green", 
    progress: "100%", 
    targetDate: "2026-06-30", 
    update: "Launched successfully to App Store and Play Store. Positive user feedback on accessibility improvements.",
    areaSqft: "18,000",
    projectStage: "Completed",
    baselineFinish: "2026-06-30",
    baseline1Finish: "2026-06-30",
    proposedFinish: "2026-06-30",
    scheduleVariance: "0 Days",
    delayInCurrentMonth: "0 Days",
    spi: "1.08",
    qhseRating: "A+",
    milestonePlan: "6", milestoneAch: "6", milestonePctAch: "100%", milestoneFr: "0",
    vowdPlan: "$75,000", vowdAch: "$75,000", vowdPctAch: "100%", vowdFr: "$0",
    labourPlan: "24", labourAch: "24", labourPctAch: "100%", labourFr: "0",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-007", 
    name: "Predictive Supply Chain Forecasting", 
    leader: "Ananya Patel", 
    vp: "Rajesh Kumar", 
    area: "AI & Innovation", 
    status: "Amber", 
    progress: "50%", 
    targetDate: "2026-11-30", 
    update: "Telemetry collection set up. Models are training on Q1-Q2 data, though missing some supplier shipping logs.",
    areaSqft: "39,000",
    projectStage: "Execution",
    baselineFinish: "2026-10-15",
    baseline1Finish: "2026-11-10",
    proposedFinish: "2026-11-30",
    scheduleVariance: "+45 Days",
    delayInCurrentMonth: "20 Days",
    spi: "0.88",
    qhseRating: "B+",
    milestonePlan: "14", milestoneAch: "9", milestonePctAch: "64.2%", milestoneFr: "4",
    vowdPlan: "$240,000", vowdAch: "$210,000", vowdPctAch: "87.5%", vowdFr: "$190,000",
    labourPlan: "110", labourAch: "102", labourPctAch: "92.7%", labourFr: "105",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-008", 
    name: "Zero-Trust Network Access Rollout", 
    leader: "David Blake", 
    vp: "Marcus Sterling", 
    area: "Security & Compliance", 
    status: "Green", 
    progress: "70%", 
    targetDate: "2026-10-15", 
    update: "VPN deprecation is active. 75% of headquarters migrated to ZTNA portal. Remote users next.",
    areaSqft: "50,000",
    projectStage: "Execution",
    baselineFinish: "2026-10-01",
    baseline1Finish: "2026-10-10",
    proposedFinish: "2026-10-15",
    scheduleVariance: "+14 Days",
    delayInCurrentMonth: "5 Days",
    spi: "1.02",
    qhseRating: "A",
    milestonePlan: "18", milestoneAch: "15", milestonePctAch: "83.3%", milestoneFr: "6",
    vowdPlan: "$410,000", vowdAch: "$398,000", vowdPctAch: "97%", vowdFr: "$350,000",
    labourPlan: "210", labourAch: "205", labourPctAch: "97.6%", labourFr: "200",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-009", 
    name: "Next-Gen Analytics Warehouse", 
    leader: "Chen Wei", 
    vp: "Rajesh Kumar", 
    area: "Infrastructure", 
    status: "Red", 
    progress: "15%", 
    targetDate: "2027-01-15", 
    update: "Vaporizer cluster provisioning failed due to region quotas. VP approval submitted for quota expansion.",
    areaSqft: "65,000",
    projectStage: "Procurement",
    baselineFinish: "2026-11-30",
    baseline1Finish: "2026-12-15",
    proposedFinish: "2027-01-15",
    scheduleVariance: "+45 Days",
    delayInCurrentMonth: "30 Days",
    spi: "0.68",
    qhseRating: "A-",
    milestonePlan: "22", milestoneAch: "6", milestonePctAch: "27.2%", milestoneFr: "12",
    vowdPlan: "$580,000", vowdAch: "$400,000", vowdPctAch: "68.9%", vowdFr: "$450,000",
    labourPlan: "180", labourAch: "120", labourPctAch: "66.6%", labourFr: "185",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-010", 
    name: "SaaS Billing System Integration", 
    leader: "Marcus Vance", 
    vp: "Elena Rostova", 
    area: "Core Commerce", 
    status: "Amber", 
    progress: "45%", 
    targetDate: "2026-10-31", 
    update: "Stripe API migration in progress. Some edge cases on recurring corporate tier tiers require backend rewrite.",
    areaSqft: "24,000",
    projectStage: "Execution",
    baselineFinish: "2026-09-30",
    baseline1Finish: "2026-10-15",
    proposedFinish: "2026-10-31",
    scheduleVariance: "+31 Days",
    delayInCurrentMonth: "16 Days",
    spi: "0.85",
    qhseRating: "B+",
    milestonePlan: "11", milestoneAch: "7", milestonePctAch: "63.6%", milestoneFr: "4",
    vowdPlan: "$150,000", vowdAch: "$130,000", vowdPctAch: "86.6%", vowdFr: "$140,000",
    labourPlan: "65", labourAch: "58", labourPctAch: "89.2%", labourFr: "70",
    rawRow: [] 
  },
  { 
    code: "PRJ-2026-011", 
    name: "Legacy Substation Refurbishment", 
    leader: "Sarah Jenkins", 
    vp: "Rajesh Kumar", 
    area: "Infrastructure", 
    status: "Amber", 
    progress: "15%", 
    targetDate: "2027-03-31", 
    update: "Project placed on hold pending regulatory land and safety clearance.",
    areaSqft: "30,000",
    projectStage: "On Hold",
    baselineFinish: "2027-01-15",
    baseline1Finish: "2027-02-15",
    proposedFinish: "2027-03-31",
    scheduleVariance: "+45 Days",
    delayInCurrentMonth: "0 Days",
    spi: "0.80",
    qhseRating: "A",
    milestonePlan: "10", milestoneAch: "3", milestonePctAch: "30%", milestoneFr: "0",
    vowdPlan: "$200,000", vowdAch: "$80,000", vowdPctAch: "40%", vowdFr: "$0",
    labourPlan: "50", labourAch: "20", labourPctAch: "40%", labourFr: "0",
    rawRow: [] 
  }
];

function generateMonthlyMetrics(basePlan: number, variance: number, seed: number, fyKey?: string) {
  const fyConfig = getFiscalYearConfig(fyKey);
  const months = fyConfig.months.map(m => m.key);
  const h2Months = fyConfig.months.filter(m => m.hasR1).map(m => m.key);
  return months.map((month, idx) => {
    // Deterministic pseudo-random generation based on seed and idx
    const sin1 = Math.sin(seed + idx);
    const sin2 = Math.cos(seed * 1.5 + idx * 0.8);
    const factor = sin1 * 0.15 + 0.95; // around 0.8 to 1.1 of basePlan
    const planR0 = Math.round(basePlan * factor * 10) / 10;
    
    let planR1: number | undefined;
    const isH2 = h2Months.includes(month);
    if (isH2) {
      const r1Factor = Math.sin(seed * 2 + idx) * 0.15 + 1.05;
      planR1 = Math.round(planR0 * r1Factor * 10) / 10;
    }
    
    // Achievement is plan * achievement factor
    const achFactor = sin2 * variance + (1 - variance);
    const resolvedPlan = planR1 !== undefined ? planR1 : planR0;
    const achievement = Math.round(resolvedPlan * achFactor * 10) / 10;
    
    return {
      month,
      plan: Math.max(0, resolvedPlan),
      planR0: Math.max(0, planR0),
      planR1: planR1 !== undefined ? Math.max(0, planR1) : undefined,
      achievement: Math.max(0, achievement)
    };
  });
}

function generateHistoryMetrics(baseValue: number, variance: number, seed: number, fyKey?: string) {
  const fyConfig = getFiscalYearConfig(fyKey);
  const months = fyConfig.months.map(m => m.key);
  return months.map((month, idx) => {
    const sinValue = Math.sin(seed + idx);
    const val = baseValue + sinValue * variance;
    return {
      month,
      plan: baseValue,
      achievement: Math.round(Math.max(0, val) * 100) / 100
    };
  });
}

export const DEMO_SOFTWARE2_PROJECTS: Software2Project[] = [
  {
    code: "PRJ-26-101",
    name: "Grand Horizon Residential Tower",
    leader: "Sarah Jenkins",
    vp: "Rajesh Kumar",
    area: "Infrastructure",
    stage: "Execution",
    spi: "1.02",
    qualityRating: "92%",
    safetyRating: "96%",
    avgQhseRating: "94.0%",
    vowd: generateMonthlyMetrics(2.5, 0.12, 100),
    milestone: generateMonthlyMetrics(3, 0.2, 200),
    labour: generateMonthlyMetrics(180, 0.08, 300),
    ur: generateMonthlyMetrics(15, 0.15, 400),
    uc: generateMonthlyMetrics(2, 0.1, 500),
    spiHistory: generateHistoryMetrics(1.02, 0.05, 100),
    qualityHistory: generateHistoryMetrics(92.0, 3.0, 200),
    safetyHistory: generateHistoryMetrics(96.0, 2.0, 300),
    avgQhseHistory: generateHistoryMetrics(94.0, 2.5, 400)
  },
  {
    code: "PRJ-26-102",
    name: "Metro Station Commercial Precinct",
    leader: "Marcus Vance",
    vp: "Elena Rostova",
    area: "Core Commerce",
    stage: "Planning",
    spi: "0.85",
    qualityRating: "88%",
    safetyRating: "92%",
    avgQhseRating: "90.0%",
    vowd: generateMonthlyMetrics(1.8, 0.15, 600),
    milestone: generateMonthlyMetrics(2, 0.25, 700),
    labour: generateMonthlyMetrics(120, 0.12, 800),
    ur: generateMonthlyMetrics(0, 0, 900),
    uc: generateMonthlyMetrics(10, 0.15, 1000),
    spiHistory: generateHistoryMetrics(0.85, 0.07, 600),
    qualityHistory: generateHistoryMetrics(88.0, 4.0, 700),
    safetyHistory: generateHistoryMetrics(92.0, 3.0, 800),
    avgQhseHistory: generateHistoryMetrics(90.0, 3.5, 900)
  },
  {
    code: "PRJ-26-103",
    name: "Riverside Premium Condominiums",
    leader: "Marcus Vance",
    vp: "Elena Rostova",
    area: "Infrastructure",
    stage: "Execution",
    spi: "1.15",
    qualityRating: "95%",
    safetyRating: "98%",
    avgQhseRating: "96.5%",
    vowd: generateMonthlyMetrics(3.2, 0.08, 1100),
    milestone: generateMonthlyMetrics(4, 0.15, 1200),
    labour: generateMonthlyMetrics(220, 0.05, 1300),
    ur: generateMonthlyMetrics(25, 0.1, 1400),
    uc: generateMonthlyMetrics(4, 0.12, 1500),
    spiHistory: generateHistoryMetrics(1.15, 0.04, 1100),
    qualityHistory: generateHistoryMetrics(95.0, 2.0, 1200),
    safetyHistory: generateHistoryMetrics(98.0, 1.0, 1300),
    avgQhseHistory: generateHistoryMetrics(96.5, 1.5, 1400)
  },
  {
    code: "PRJ-26-104",
    name: "Industrial Logistics Hub",
    leader: "Aleksei Tarasov",
    vp: "Rajesh Kumar",
    area: "Logistic Hubs",
    stage: "Closeout",
    spi: "0.98",
    qualityRating: "89%",
    safetyRating: "94%",
    avgQhseRating: "91.5%",
    vowd: generateMonthlyMetrics(1.2, 0.1, 1600),
    milestone: generateMonthlyMetrics(1, 0.2, 1700),
    labour: generateMonthlyMetrics(80, 0.15, 1800),
    ur: generateMonthlyMetrics(0, 0, 1900),
    uc: generateMonthlyMetrics(15, 0.08, 2000),
    spiHistory: generateHistoryMetrics(0.98, 0.06, 1600),
    qualityHistory: generateHistoryMetrics(89.0, 3.5, 1700),
    safetyHistory: generateHistoryMetrics(94.0, 2.0, 1800),
    avgQhseHistory: generateHistoryMetrics(91.5, 2.8, 1900)
  },
  {
    code: "PRJ-26-105",
    name: "Tech Park Smart Office Complex",
    leader: "Sarah Jenkins",
    vp: "Elena Rostova",
    area: "Core Commerce",
    stage: "Design",
    spi: "1.05",
    qualityRating: "91%",
    safetyRating: "95%",
    avgQhseRating: "93.0%",
    vowd: generateMonthlyMetrics(4.0, 0.1, 2100),
    milestone: generateMonthlyMetrics(5, 0.15, 2200),
    labour: generateMonthlyMetrics(300, 0.06, 2300),
    ur: generateMonthlyMetrics(5, 0.2, 2400),
    uc: generateMonthlyMetrics(20, 0.1, 2500),
    spiHistory: generateHistoryMetrics(1.05, 0.03, 2100),
    qualityHistory: generateHistoryMetrics(91.0, 2.5, 2200),
    safetyHistory: generateHistoryMetrics(95.0, 1.5, 2300),
    avgQhseHistory: generateHistoryMetrics(93.0, 2.0, 2400)
  }
];

export function useGoogleSheets() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [software2Projects, setSoftware2Projects] = useState<Software2Project[]>(DEMO_SOFTWARE2_PROJECTS);
  const [software3Milestones, setSoftware3Milestones] = useState<Software3Milestone[]>([]);
  const [isUsingDemo, setIsUsingDemo] = useState<boolean>(false);
  
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [software2SheetRows, setSoftware2SheetRows] = useState<string[][]>([]);
  const [software3SheetRows, setSoftware3SheetRows] = useState<string[][]>([]);
  const [software2HeaderRowIndex, setSoftware2HeaderRowIndex] = useState<number>(() => {
    const saved = localStorage.getItem('software2HeaderRowIndex');
    return saved !== null ? parseInt(saved, 10) : 3;
  });
  const [software2Mapping, setSoftware2Mapping] = useState<Software2Mapping>(() => {
    const saved = localStorage.getItem('software2Mapping');
    const parsed = saved !== null ? JSON.parse(saved) : {
      codeIndex: 1,
      nameIndex: 2,
      leaderIndex: 3,
      vpIndex: 4,
      stageIndex: 5,
      areaIndex: 6
    };

    return parsed;
  });
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(() => {
    const saved = localStorage.getItem('headerRowIndex');
    return saved !== null ? parseInt(saved, 10) : 3;
  });
  const [mapping, setMapping] = useState<ColumnMapping>(() => {
    const saved = localStorage.getItem('columnMapping');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return {
      codeIndex: 1, // Col B - Project ID
      nameIndex: 2, // Col C - Project Name
      areaSqftIndex: 3,
      areaIndex: 3,
      leaderIndex: 4, // Col E - Leader
      vpIndex: 5, // Col F - VP
      projectStageIndex: 6, // Col G - Stage
      stageIndex: 6,
      pmSiteInchargeIndex: 7,
      baselineFinishIndex: 8,
      baseline1FinishIndex: 9,
      proposedFinishIndex: 10,
      scheduleVarianceIndex: 11,
      delayInCurrentMonthIndex: 12,
      totalBudgetIndex: 13,
      totalLaboursIndex: 14,
      totalMilestoneIndex: 15,
      milestonePlanIndex: 17,
      milestoneAchIndex: 18,
      milestonePctAchIndex: 19,
      milestoneFrIndex: 20,
      vowdPlanIndex: 22,
      vowdAchIndex: 23,
      vowdPctAchIndex: 24,
      vowdFrIndex: 25,
      labourPlanIndex: 27,
      labourAchIndex: 28,
      labourPctAchIndex: 29,
      labourFrIndex: 30,
      spiIndex: 32,
      statusIndex: 33,
      progressIndex: -1,
      targetDateIndex: -1,
      updateIndex: 34,
      qhseRatingIndex: -1,
      qualityRatingIndex: -1,
      safetyRatingIndex: -1,
      avgQhseRatingIndex: -1
    };
  });

  const fetchSpreadsheetData = useCallback(async (tokenToUse?: string) => {
    const token = tokenToUse || getAccessToken();
    setIsLoading(true);
    setError(null);

    try {
      let rows: string[][] | null = null;
      let rows2: string[][] | null = null;
      let rows3: string[][] | null = null;

      // 1. Try Authenticated Google Sheets API if token is present
      if (token) {
        try {
          const range = `${SHEET_NAME}!A1:BZ1000`;
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
          const range2 = `${SHEET_NAME_2}!A1:MT1000`;
          const url2 = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range2)}`;
          const range3 = `${SHEET_NAME_3}!A1:ZZ1200`;
          const url3 = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range3)}`;

          const [res1, res2, res3] = await Promise.all([
            fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(url2, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
            fetch(url3, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
          ]);

          if (res1.ok) {
            const data = await res1.json();
            if (data.values && data.values.length > 0) {
              rows = data.values;
            }
            if (res2 && res2.ok) {
              const data2 = await res2.json();
              rows2 = data2.values;
            }
            if (res3 && res3.ok) {
              const data3 = await res3.json();
              rows3 = data3.values;
            }
          }
        } catch (authErr) {
          console.warn('Authenticated fetch failed, attempting direct fetch:', authErr);
        }
      }

      // 2. If no authenticated data yet, attempt direct public fetch
      if (!rows || rows.length === 0) {
        try {
          const [pubRows1, pubRows2, pubRows3] = await Promise.all([
            fetchPublicGoogleSheet(SPREADSHEET_ID, SHEET_NAME),
            fetchPublicGoogleSheet(SPREADSHEET_ID, SHEET_NAME_2).catch(() => null),
            fetchPublicGoogleSheet(SPREADSHEET_ID, SHEET_NAME_3).catch(() => null)
          ]);
          if (pubRows1 && pubRows1.length > 0) {
            rows = pubRows1;
            rows2 = pubRows2;
            rows3 = pubRows3;
          }
        } catch (pubErr: any) {
          console.warn('Direct fetch attempt note:', pubErr);
          if (!rows) {
            throw new Error(
              pubErr.message || 'Unable to connect to Google Sheets. Please ensure the sheet is accessible or import CSV.'
            );
          }
        }
      }

      if (!rows || rows.length === 0) {
        throw new Error(`No data found in spreadsheet tab: "${SHEET_NAME}". Please check tab name.`);
      }

      setSheetRows(rows);
      setIsUsingDemo(false);

      // 1. Detect the best header row index or use the saved one
      let bestRowIndex = 0;
      const savedHeaderIdx = localStorage.getItem('headerRowIndex');
      if (savedHeaderIdx !== null) {
        bestRowIndex = parseInt(savedHeaderIdx, 10);
      } else {
        let highestScore = 0;
        // Look at the first 15 rows to find the headers
        const rowsToAnalyze = Math.min(rows.length, 15);
        for (let i = 0; i < rowsToAnalyze; i++) {
          const score = scoreHeaderRow(rows[i]);
          if (score > highestScore) {
            highestScore = score;
            bestRowIndex = i;
          }
        }
      }

      setHeaderRowIndex(bestRowIndex);

      // 2. Detect column mapping based on that header row and the parent row for merged columns
      const parentRow = bestRowIndex > 0 ? rows[bestRowIndex - 1] : undefined;
      const detectedMapping = detectColumnMapping(rows[bestRowIndex], parentRow);
      setMapping(detectedMapping);

      // 3. Parse projects based on detected values
      const parsed = parseSheetData(rows, bestRowIndex, detectedMapping);
      if (parsed && parsed.length > 0) {
        setProjects(parsed);
      } else {
        console.warn('parseSheetData returned 0 projects. Preserving demo dataset.');
        setProjects(DEMO_PROJECTS);
      }

      // 4. Parse Software2 if available
      if (rows2 && rows2.length > 0) {
        setSoftware2SheetRows(rows2);
        
        const savedS2Idx = localStorage.getItem('software2HeaderRowIndex');
        const s2HeaderIdx = savedS2Idx !== null ? parseInt(savedS2Idx, 10) : 3;
        let s2Mapping: Partial<Software2Mapping> = {
          codeIndex: 1,
          nameIndex: 2,
          leaderIndex: 3,
          vpIndex: 4,
          stageIndex: 5,
          spiIndex: 6,
          qualityRatingIndex: 8,
          safetyRatingIndex: 9,
          avgQhseRatingIndex: 10
        };
        const savedS2Mapping = localStorage.getItem('software2Mapping');
        if (savedS2Mapping !== null) {
          try {
            const parsedS2 = JSON.parse(savedS2Mapping);
            if (parsedS2.leaderIndex === 4 && parsedS2.vpIndex === 5) {
              parsedS2.leaderIndex = 3;
              parsedS2.vpIndex = 4;
              parsedS2.stageIndex = 5;
              parsedS2.spiIndex = 6;
              localStorage.setItem('software2Mapping', JSON.stringify(parsedS2));
            }
            s2Mapping = { ...s2Mapping, ...parsedS2 };
          } catch (e) {
            console.error(e);
          }
        }
        
        const parsed2 = parseSoftware2Data(rows2, s2HeaderIdx, s2Mapping, getStoredFiscalYear());
        if (parsed2 && parsed2.length > 0) {
          setSoftware2Projects(parsed2);
        } else {
          setSoftware2Projects(DEMO_SOFTWARE2_PROJECTS);
        }
      }

      // 5. Parse Software3 (Milestones) if available
      if (rows3 && rows3.length > 0) {
        setSoftware3SheetRows(rows3);
        const parsed3 = parseSoftware3Data(rows3, parsed && parsed.length > 0 ? parsed : DEMO_PROJECTS);
        setSoftware3Milestones(parsed3);
      }
      
    } catch (err: any) {
      console.error('Fetch Sheets Error:', err);
      setError(err.message || 'An error occurred while loading spreadsheet data.');
      // Keep demo data as fallback
      setIsUsingDemo(true);
      setProjects(prev => prev && prev.length > 0 ? prev : DEMO_PROJECTS);
      setSoftware2Projects(prev => prev && prev.length > 0 ? prev : DEMO_SOFTWARE2_PROJECTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Track auth state
  useEffect(() => {
    const unsubscribe = initAuth((currentUser, token) => {
      setUser(currentUser);
      setIsAuthenticated(!!token);
      if (token) {
        fetchSpreadsheetData(token);
      }
    });
    return unsubscribe;
  }, [fetchSpreadsheetData]);

  // Automatically fetch live Google Spreadsheet data on initial load
  useEffect(() => {
    fetchSpreadsheetData();
  }, [fetchSpreadsheetData]);

  // Update projects when mapping or headerRowIndex changes manually
  const updateMappingAndParse = useCallback((newMapping: ColumnMapping, newHeaderIdx: number) => {
    setMapping(newMapping);
    setHeaderRowIndex(newHeaderIdx);
    localStorage.setItem('headerRowIndex', newHeaderIdx.toString());
    localStorage.setItem('columnMapping', JSON.stringify(newMapping));

    if (sheetRows && sheetRows.length > 0) {
      const parsed = parseSheetData(sheetRows, newHeaderIdx, newMapping);
      if (parsed && parsed.length > 0) {
        setProjects(parsed);
      }
    }
  }, [sheetRows]);

  // Update projects when Software2 mapping or headerRowIndex changes manually
  const updateSoftware2MappingAndParse = useCallback((newMapping: Software2Mapping, newHeaderIdx: number) => {
    setSoftware2Mapping(newMapping);
    setSoftware2HeaderRowIndex(newHeaderIdx);
    localStorage.setItem('software2HeaderRowIndex', newHeaderIdx.toString());
    localStorage.setItem('software2Mapping', JSON.stringify(newMapping));
    
    if (software2SheetRows && software2SheetRows.length > 0) {
      const parsed = parseSoftware2Data(software2SheetRows, newHeaderIdx, newMapping, getStoredFiscalYear());
      if (parsed && parsed.length > 0) {
        setSoftware2Projects(parsed);
      }
    }
  }, [software2SheetRows]);

  // Listen for Fiscal Year changes from ColumnMapper / Header
  useEffect(() => {
    const handleFyChange = () => {
      if (software2SheetRows && software2SheetRows.length > 0) {
        const parsed = parseSoftware2Data(software2SheetRows, software2HeaderRowIndex, software2Mapping, getStoredFiscalYear());
        if (parsed && parsed.length > 0) {
          setSoftware2Projects(parsed);
        }
      }
    };

    window.addEventListener('mrm-fiscal-year-changed', handleFyChange);
    return () => window.removeEventListener('mrm-fiscal-year-changed', handleFyChange);
  }, [software2SheetRows, software2HeaderRowIndex, software2Mapping]);

  const loadCustomData = useCallback((rows: string[][], rows2?: string[][]) => {
    if (!rows || rows.length === 0) return;
    setSheetRows(rows);
    setIsUsingDemo(false);

    let bestRowIndex = 0;
    const savedHeaderIdx = localStorage.getItem('headerRowIndex');
    if (savedHeaderIdx !== null) {
      bestRowIndex = parseInt(savedHeaderIdx, 10);
    } else {
      let highestScore = 0;
      const rowsToAnalyze = Math.min(rows.length, 15);
      for (let i = 0; i < rowsToAnalyze; i++) {
        const score = scoreHeaderRow(rows[i]);
        if (score > highestScore) {
          highestScore = score;
          bestRowIndex = i;
        }
      }
    }
    setHeaderRowIndex(bestRowIndex);

    const parentRow = bestRowIndex > 0 ? rows[bestRowIndex - 1] : undefined;
    const detectedMapping = detectColumnMapping(rows[bestRowIndex], parentRow);
    setMapping(detectedMapping);

    const parsed = parseSheetData(rows, bestRowIndex, detectedMapping);
    setProjects(parsed);

    if (rows2 && rows2.length > 0) {
      setSoftware2SheetRows(rows2);
      const savedS2Idx = localStorage.getItem('software2HeaderRowIndex');
      const s2HeaderIdx = savedS2Idx !== null ? parseInt(savedS2Idx, 10) : 3;
      const parsed2 = parseSoftware2Data(rows2, s2HeaderIdx, software2Mapping, getStoredFiscalYear());
      setSoftware2Projects(parsed2);
    }
  }, [software2Mapping]);

  const toggleUseDemo = useCallback((useDemo: boolean) => {
    setIsUsingDemo(useDemo);
    if (useDemo) {
      setProjects(DEMO_PROJECTS);
      setSoftware2Projects(DEMO_SOFTWARE2_PROJECTS);
      setError(null);
    } else {
      fetchSpreadsheetData();
    }
  }, [fetchSpreadsheetData]);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    projects,
    software2Projects,
    software3Milestones,
    isUsingDemo,
    sheetRows,
    software2SheetRows,
    software3SheetRows,
    headerRowIndex,
    software2HeaderRowIndex,
    mapping,
    software2Mapping,
    fetchSpreadsheetData,
    loadCustomData,
    updateMappingAndParse,
    updateSoftware2MappingAndParse,
    toggleUseDemo
  };
}
