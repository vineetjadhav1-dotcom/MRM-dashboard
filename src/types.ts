export interface Project {
  code: string;
  name: string;
  leader: string;
  vp: string;
  area: string;
  status: string; // "Green" | "Amber" | "Red" | "Gray" or similar
  progress: string; // e.g., "75%", "N/A"
  targetDate: string;
  update: string;

  // New fields from row 4
  areaSqft?: string; // area(Sqft)
  projectStage?: string; // Project stage
  pmSiteIncharge?: string; // PM/Site Incharge
  baselineFinish?: string; // Baseline finish
  baseline1Finish?: string; // Baseline 1 finish
  proposedFinish?: string; // Proposed finish (Current month)
  scheduleVariance?: string; // Schedule Variance
  delayInCurrentMonth?: string; // Delay in current month
  totalBudget?: string; // Total Budget
  totalLabours?: string; // Total Labours
  totalMilestone?: string; // Total Milestone
  spi?: string; // SPI
  qhseRating?: string; // QHSE rating
  qualityRating?: string;
  safetyRating?: string;
  avgQhseRating?: string;

  // Milestone sub-metrics (from Row 3 & 4 matching)
  milestonePlan?: string;
  milestoneAch?: string;
  milestonePctAch?: string;
  milestoneFr?: string;

  // VOWD sub-metrics (from Row 3 & 4 matching)
  vowdPlan?: string;
  vowdAch?: string;
  vowdPctAch?: string;
  vowdFr?: string;

  // Labour sub-metrics (from Row 3 & 4 matching)
  labourPlan?: string;
  labourAch?: string;
  labourPctAch?: string;
  labourFr?: string;

  rawRow: string[];
}

export interface ColumnMapping {
  codeIndex: number;
  nameIndex: number;
  leaderIndex: number;
  vpIndex: number;
  areaIndex: number;
  statusIndex: number;
  progressIndex: number;
  targetDateIndex: number;
  updateIndex: number;

  // New indices from row 4
  areaSqftIndex?: number;
  projectStageIndex?: number;
  pmSiteInchargeIndex?: number;
  baselineFinishIndex?: number;
  baseline1FinishIndex?: number;
  proposedFinishIndex?: number;
  scheduleVarianceIndex?: number;
  delayInCurrentMonthIndex?: number;
  totalBudgetIndex?: number;
  totalLaboursIndex?: number;
  totalMilestoneIndex?: number;
  spiIndex?: number;
  qhseRatingIndex?: number;
  qualityRatingIndex?: number;
  safetyRatingIndex?: number;
  avgQhseRatingIndex?: number;

  // Milestones columns
  milestonePlanIndex?: number;
  milestoneAchIndex?: number;
  milestonePctAchIndex?: number;
  milestoneFrIndex?: number;

  // VOWD columns
  vowdPlanIndex?: number;
  vowdAchIndex?: number;
  vowdPctAchIndex?: number;
  vowdFrIndex?: number;

  // Labour columns
  labourPlanIndex?: number;
  labourAchIndex?: number;
  labourPctAchIndex?: number;
  labourFrIndex?: number;
}

export interface VPData {
  name: string;
  projectsCount: number;
  statusCounts: Record<string, number>;
  leaders: Set<string>;
  areas: Set<string>;
  projects: Project[];
}

export interface LeaderData {
  name: string;
  vpName: string;
  projectsCount: number;
  statusCounts: Record<string, number>;
  areas: Set<string>;
  projects: Project[];
}

export interface AreaData {
  name: string;
  projectsCount: number;
  statusCounts: Record<string, number>;
  vps: Set<string>;
  leaders: Set<string>;
  projects: Project[];
}

export interface DashboardMetrics {
  totalProjects: number;
  totalVPs: number;
  totalLeaders: number;
  totalAreas: number;
  statusCounts: Record<string, number>;
  totalAreaUnderConstruction?: number;
  totalAreaSqft?: number;
}

export interface MonthlyMetric {
  month: string; // "Apr-26", "May-26", etc.
  plan: number;
  planR0?: number;
  planR1?: number;
  achievement: number;
}

export interface Software2Project {
  code: string;
  name: string;
  leader: string;
  vp: string;
  area: string;
  stage?: string;
  spi?: string;
  qualityRating?: string;
  safetyRating?: string;
  avgQhseRating?: string;
  vowd: MonthlyMetric[];
  milestone: MonthlyMetric[];
  labour: MonthlyMetric[];
  ur: MonthlyMetric[]; // unit delivery-Residential
  uc: MonthlyMetric[]; // unit delivery-Commercial
  spiHistory?: MonthlyMetric[];
  qualityHistory?: MonthlyMetric[];
  safetyHistory?: MonthlyMetric[];
  avgQhseHistory?: MonthlyMetric[];
}

export interface Software2Mapping {
  codeIndex: number;
  nameIndex: number;
  leaderIndex: number;
  vpIndex: number;
  stageIndex?: number;
  areaIndex: number;
  spiIndex?: number;
  qualityRatingIndex?: number;
  safetyRatingIndex?: number;
  avgQhseRatingIndex?: number;
  metricOverrides?: { [key: string]: number };
}

