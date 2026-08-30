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
  totalBudgetUnderManagement?: number;
  totalBudgetUnderConstruction?: number;
  projectsUnderConstructionCount?: number;
}

export interface MonthlyMetric {
  month: string; // "Apr-26", "May-26", etc.
  plan: number;
  planR0?: number;
  planR1?: number;
  achievement: number;
}

export interface MonthlyFinishDate {
  month: string;
  finishDate: string;
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
  proposedFinish?: string; // Proposed finish date (from software 2)
  proposedFinishHistory?: MonthlyFinishDate[]; // Monthwise forecast finish dates (Cols LZ to MK)
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
  proposedFinishIndex?: number;
  spiIndex?: number;
  qualityRatingIndex?: number;
  safetyRatingIndex?: number;
  avgQhseRatingIndex?: number;
  metricOverrides?: { [key: string]: number };
}

export type FiscalYearKey = 'FY26-27' | 'FY27-28' | 'FY28-29' | 'FY29-30' | 'FY30-31';

export type ActiveTab = 
  | 'projectDashboard' 
  | 'leader' 
  | 'leaderboard' 
  | 'insights' 
  | 'vp' 
  | 'all' 
  | 'overview'
  | 'milestones'
  | 'userAccess';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  role: UserRole;
  avatarBg?: string;
  createdAt?: string;
}

export interface UserPermissions {
  allowedNavTabs: ActiveTab[];
  showSourceSheet: boolean;
  canSyncSheet?: boolean;
  canExportReport?: boolean;
  canEditConfig?: boolean;
  canChangeFiscalYear?: boolean;
  allowedVPs?: string[]; // Empty or ['all'] for all VPs
  allowedLeaders?: string[]; // Empty or ['all'] for all leaders
  allowedProjectCodes?: string[]; // Empty or ['all'] for all projects
}

export interface UserManagementSettings {
  users: AppUser[];
  userPermissions: Record<string, UserPermissions>;
}

export interface Software3Milestone {
  id: string;
  projectCode: string;
  projectName: string;
  building: string;
  leader: string;
  vp?: string;
  milestone: string;
  category: string; // 'Start' | '50%' | 'Finish' | 'General'
  status: string; // 'Done' | 'Not Done'
  plannedWeek: string; // 'W1' | 'W2' | 'W3' | 'W4'
  isCritical: boolean;
  criticalRaw: string;
  reshuffle: string;
  month: string; // e.g. 'July-26', 'Aug-26' (month from which milestone is pending)
  
  // 7 Core Milestone Pre-requisites / Reading Parameters
  contractorApp: string;
  drawing: string;
  workFront: string;
  contractorMob: string;
  materialDelivery: string;
  labourAvailability: string;
  clientDecision: string;
  
  // Additional Attributes
  govtApproval: string;
  crm: string;
  other: string;
  remark: string;
  
  // Computed Intelligent Analysis
  failingConstraints: string[];
  primaryBottleneck: string;
  actionRecommendation: string;
}




