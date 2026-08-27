import { Project, ColumnMapping, DashboardMetrics, VPData, LeaderData, AreaData, Software2Project, MonthlyMetric, Software2Mapping } from '@/src/types';
import { sortVpNames, sortLeaderItems } from '@/src/utils/customOrder';

/**
 * Score a row to determine how likely it is the header row
 */
export function scoreHeaderRow(row: string[]): number {
  if (!row || row.length === 0) return 0;
  
  let score = 0;
  const keywords = [
    /code|id|proj/i,
    /leader|lead|owner/i,
    /vp|v\.p\.|vice.*president/i,
    /area|vertical|domain|dept/i,
    /status|health|rag/i,
    /project|name|title|desc/i,
    /progress|%/i,
    /date|timeline|deadline/i,
    /update|remarks|comment/i
  ];

  row.forEach((cell) => {
    if (!cell) return;
    const val = String(cell).trim();
    keywords.forEach((regex) => {
      if (regex.test(val)) {
        score += 1;
      }
    });
  });

  return score;
}

/**
 * Automatically detect column mapping from the header row (row 4), using row 3 (parentRow) to match scoped parameters
 */
export function detectColumnMapping(headerRow: string[], parentRow?: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    codeIndex: -1,
    nameIndex: -1,
    leaderIndex: -1,
    vpIndex: -1,
    areaIndex: -1,
    statusIndex: -1,
    progressIndex: -1,
    targetDateIndex: -1,
    updateIndex: -1,

    areaSqftIndex: -1,
    projectStageIndex: -1,
    pmSiteInchargeIndex: -1,
    baselineFinishIndex: -1,
    baseline1FinishIndex: -1,
    proposedFinishIndex: -1,
    scheduleVarianceIndex: -1,
    delayInCurrentMonthIndex: -1,
    totalBudgetIndex: -1,
    totalLaboursIndex: -1,
    totalMilestoneIndex: -1,
    spiIndex: -1,
    qhseRatingIndex: -1,
    qualityRatingIndex: -1,
    safetyRatingIndex: -1,
    avgQhseRatingIndex: -1,

    milestonePlanIndex: -1,
    milestoneAchIndex: -1,
    milestonePctAchIndex: -1,
    milestoneFrIndex: -1,

    vowdPlanIndex: -1,
    vowdAchIndex: -1,
    vowdPctAchIndex: -1,
    vowdFrIndex: -1,

    labourPlanIndex: -1,
    labourAchIndex: -1,
    labourPctAchIndex: -1,
    labourFrIndex: -1
  };

  if (!headerRow || headerRow.length === 0) return mapping;

  headerRow.forEach((cell, idx) => {
    if (!cell) return;
    const val = String(cell).trim().toLowerCase();

    // Resolve parent category from parentRow if present (e.g. Row 3 above Row 4)
    let parentVal = "";
    if (parentRow && parentRow.length > idx) {
      for (let c = idx; c >= 0; c--) {
        const pVal = String(parentRow[c] || '').trim();
        if (pVal) {
          parentVal = pVal.toLowerCase();
          break;
        }
      }
    }

    const fullText = `${parentVal} ${val}`.trim();

    // --- 1. Milestone Tracking (Scoped or Standalone) ---
    if (parentVal.includes('milestone') || val.includes('milestone') || val.includes('mstone') || fullText.includes('milestone')) {
      if (val.includes('%') || val.includes('pct') || val.includes('achievment %') || val.includes('achievement %')) {
        mapping.milestonePctAchIndex = idx;
      } else if (val.includes('fr') || val.includes('forecast') || val.includes('next month') || val.includes('target next')) {
        mapping.milestoneFrIndex = idx;
      } else if (val.includes('ach') || val.includes('actual') || val.includes('achievement') || val.includes('achievment')) {
        mapping.milestoneAchIndex = idx;
      } else if (val.includes('plan') || val.includes('target') || val.includes('budget') || val === 'plan' || val === 'tgt') {
        mapping.milestonePlanIndex = idx;
      }
    }

    // --- 2. VOWD Tracking (Scoped or Standalone) ---
    if (parentVal.includes('vowd') || val.includes('vowd') || fullText.includes('value of work') || fullText.includes('vowd')) {
      if (val.includes('%') || val.includes('pct') || val.includes('achievment %') || val.includes('achievement %')) {
        mapping.vowdPctAchIndex = idx;
      } else if (val.includes('fr') || val.includes('forecast') || val.includes('next month') || val.includes('target next')) {
        mapping.vowdFrIndex = idx;
      } else if (val.includes('ach') || val.includes('actual') || val.includes('achievement') || val.includes('achievment')) {
        mapping.vowdAchIndex = idx;
      } else if (val.includes('plan') || val.includes('target') || val.includes('budget') || val === 'plan' || val === 'tgt') {
        mapping.vowdPlanIndex = idx;
      }
    }

    // --- 3. Labour Tracking (Scoped or Standalone) ---
    if (parentVal.includes('labour') || parentVal.includes('labor') || val.includes('labour') || val.includes('labor') || fullText.includes('labour') || fullText.includes('labor') || fullText.includes('manpower')) {
      if (val.includes('%') || val.includes('pct') || val.includes('achievment %') || val.includes('achievement %')) {
        mapping.labourPctAchIndex = idx;
      } else if (val.includes('fr') || val.includes('forecast') || val.includes('next month') || val.includes('target next')) {
        mapping.labourFrIndex = idx;
      } else if (val.includes('ach') || val.includes('actual') || val.includes('achievement') || val.includes('achievment') || val.includes('deployed')) {
        mapping.labourAchIndex = idx;
      } else if (val.includes('plan') || val.includes('target') || val.includes('budget') || val === 'plan' || val === 'tgt') {
        mapping.labourPlanIndex = idx;
      }
    }

    // --- 4. Core Identification & Team ---
    if (/project\s*(id|code)|proj\s*(id|code)|job\s*code|site\s*code|\bcode\b|\bid\b/i.test(val)) {
      if (!/vowd|mil|lab|area/i.test(fullText)) mapping.codeIndex = idx;
    } else if (/project\s*name|site\s*name|\bproject\b|\btitle\b|\bname\b/i.test(val)) {
      if (!/vowd|mil|lab|leader|vp|stage/i.test(fullText)) mapping.nameIndex = idx;
    } else if (/leader|lead|owner|reporting/i.test(val)) {
      mapping.leaderIndex = idx;
    } else if (/vice\s*president|\bvp\b|v\.p\.|cluster\s*head|regional\s*head/i.test(val)) {
      mapping.vpIndex = idx;
    } 

    // --- 5. Stage & Spatial ---
    else if (/project\s*stage|\bstage\b|\bphase\b/i.test(val)) {
      mapping.projectStageIndex = idx;
    } else if (/area\s*\(?sqft\)?|area\s*sq\.?\s*ft|built\s*up\s*area|\bbua\b|\bsqft\b|\bsft\b/i.test(val)) {
      mapping.areaSqftIndex = idx;
      if (mapping.areaIndex === -1) mapping.areaIndex = idx;
    } else if (/vertical|domain|region|\barea\b/i.test(val)) {
      mapping.areaIndex = idx;
    } else if (/pm\s*\/?\s*site\s*incharge|site\s*incharge|\bincharge\b/i.test(val)) {
      mapping.pmSiteInchargeIndex = idx;
    }

    // --- 6. Dates & Timeline Variance ---
    else if (/baseline\s*1\s*finish|baseline\s*1|bl\s*1\s*finish|r1\s*finish/i.test(val)) {
      mapping.baseline1FinishIndex = idx;
    } else if (/baseline\s*finish|baseline\s*target|bl\s*finish|\bbaseline\b|r0\s*finish/i.test(val)) {
      mapping.baselineFinishIndex = idx;
    } else if (/proposed\s*finish|proposed\s*date|forecast\s*finish|target\s*date|\bproposed\b/i.test(val)) {
      mapping.proposedFinishIndex = idx;
      if (mapping.targetDateIndex === -1) mapping.targetDateIndex = idx;
    } else if (/schedule\s*variance|variance\s*\(days\)|\bvariance\b|\bsv\b/i.test(val)) {
      mapping.scheduleVarianceIndex = idx;
    } else if (/delay\s*in\s*(current\s*)?month|current\s*month\s*delay|monthly\s*delay|\bdelay\b/i.test(val)) {
      mapping.delayInCurrentMonthIndex = idx;
    }

    // --- 7. Budget & Totals ---
    else if (/total\s*budget|project\s*budget|\bbudget\b/i.test(val)) {
      mapping.totalBudgetIndex = idx;
    } else if (/total\s*labou?rs|avg\s*labou?rs/i.test(val)) {
      mapping.totalLaboursIndex = idx;
    } else if (/total\s*milestones?|\bmilestones?\b/i.test(val)) {
      mapping.totalMilestoneIndex = idx;
    }

    // --- 8. SPI & QHSE Performance ---
    else if (/\bspi\b|spi\s*index|schedule\s*performance/i.test(val)) {
      mapping.spiIndex = idx;
      if (mapping.progressIndex === -1) mapping.progressIndex = idx;
    } else if (/quality\s*rating|quality\s*score|\bquality\b/i.test(val)) {
      mapping.qualityRatingIndex = idx;
    } else if (/safety\s*rating|safety\s*score|\bsafety\b/i.test(val)) {
      mapping.safetyRatingIndex = idx;
    } else if (/avg\s*\.?\s*qhse|average\s*qhse|qhse\s*rating|\bqhse\b/i.test(val)) {
      mapping.avgQhseRatingIndex = idx;
      mapping.qhseRatingIndex = idx;
    } else if (/project\s*status|health|\brag\b|\bstatus\b/i.test(val)) {
      mapping.statusIndex = idx;
    } else if (/update|remark|comment|note/i.test(val)) {
      mapping.updateIndex = idx;
    }
  });

  // Secondary fuzzy pass for any unmapped VOWD / Milestone / Labour metrics
  headerRow.forEach((cell, idx) => {
    if (!cell) return;
    const val = String(cell).trim().toLowerCase();

    // VOWD
    if (mapping.vowdPlanIndex === -1 && /vowd.*plan|plan.*vowd/i.test(val)) mapping.vowdPlanIndex = idx;
    if (mapping.vowdAchIndex === -1 && /vowd.*(ach|actual)|(ach|actual).*vowd/i.test(val)) mapping.vowdAchIndex = idx;
    if (mapping.vowdPctAchIndex === -1 && /vowd.*(%|pct)|(%|pct).*vowd/i.test(val)) mapping.vowdPctAchIndex = idx;
    if (mapping.vowdFrIndex === -1 && /vowd.*(fr|forecast)|(fr|forecast).*vowd/i.test(val)) mapping.vowdFrIndex = idx;

    // Milestone
    if (mapping.milestonePlanIndex === -1 && /milestone.*plan|plan.*milestone/i.test(val)) mapping.milestonePlanIndex = idx;
    if (mapping.milestoneAchIndex === -1 && /milestone.*(ach|actual)|(ach|actual).*milestone/i.test(val)) mapping.milestoneAchIndex = idx;
    if (mapping.milestonePctAchIndex === -1 && /milestone.*(%|pct)|(%|pct).*milestone/i.test(val)) mapping.milestonePctAchIndex = idx;
    if (mapping.milestoneFrIndex === -1 && /milestone.*(fr|forecast)|(fr|forecast).*milestone/i.test(val)) mapping.milestoneFrIndex = idx;

    // Labour
    if (mapping.labourPlanIndex === -1 && /(labour|labor).*plan|plan.*(labour|labor)/i.test(val)) mapping.labourPlanIndex = idx;
    if (mapping.labourAchIndex === -1 && /(labour|labor).*(ach|actual)|(ach|actual).*(labour|labor)/i.test(val)) mapping.labourAchIndex = idx;
    if (mapping.labourPctAchIndex === -1 && /(labour|labor).*(%|pct)|(%|pct).*(labour|labor)/i.test(val)) mapping.labourPctAchIndex = idx;
    if (mapping.labourFrIndex === -1 && /(labour|labor).*(fr|forecast)|(fr|forecast).*(labour|labor)/i.test(val)) mapping.labourFrIndex = idx;
  });

  // Fallbacks if not detected to make a guess based on standard order
  if (mapping.codeIndex === -1) {
    const idx = headerRow.findIndex(h => /project id|code|proj id/i.test(h));
    mapping.codeIndex = idx !== -1 ? idx : 1; // Col B (1) - Project ID
  }
  if (mapping.nameIndex === -1) {
    const idx = headerRow.findIndex(h => /project name|project|title/i.test(h));
    mapping.nameIndex = idx !== -1 ? idx : 2; // Col C (2) - Project Name
  }
  if (mapping.leaderIndex === -1) {
    const idx = headerRow.findIndex(h => /leader|owner|lead/i.test(h));
    mapping.leaderIndex = idx !== -1 ? idx : 3; // Col D (3) - Leader
  }
  if (mapping.vpIndex === -1) {
    const idx = headerRow.findIndex(h => /vp|vice/i.test(h));
    mapping.vpIndex = idx !== -1 ? idx : 4; // Col E (4) - VP
  }
  if (mapping.projectStageIndex === -1) {
    const idx = headerRow.findIndex(h => /stage|phase/i.test(h));
    mapping.projectStageIndex = idx !== -1 ? idx : 5; // Col F (5) - Project Stage
  }
  if (mapping.spiIndex === -1) {
    const idx = headerRow.findIndex(h => /\bspi\b/i.test(h));
    mapping.spiIndex = idx !== -1 ? idx : 6; // Col G (6) - SPI
  }
  if (mapping.areaSqftIndex === -1) {
    const idx = headerRow.findIndex(h => /area.*sqft|sqft/i.test(h));
    mapping.areaSqftIndex = idx !== -1 ? idx : 7; // Col H (7) - Area Sqft
  }
  if (mapping.qualityRatingIndex === -1) {
    const idx = headerRow.findIndex(h => /quality|qua\b/i.test(h));
    mapping.qualityRatingIndex = idx !== -1 ? idx : 8; // Col I (8) - Quality Rating
  }
  if (mapping.safetyRatingIndex === -1) {
    const idx = headerRow.findIndex(h => /safety|saf\b/i.test(h));
    mapping.safetyRatingIndex = idx !== -1 ? idx : 9; // Col J (9) - Safety Rating
  }
  if (mapping.avgQhseRatingIndex === -1) {
    const idx = headerRow.findIndex(h => /avg.*qhse|average.*qhse|qhse/i.test(h));
    mapping.avgQhseRatingIndex = idx !== -1 ? idx : 10; // Col K (10) - Avg QHSE Rating
  }
  if (mapping.statusIndex === -1) {
    mapping.statusIndex = headerRow.findIndex(h => /status|health/i.test(h));
  }

  // Standard positional fallbacks for VOWD, Milestone, and Labour if 32-col layout
  if (headerRow.length >= 30) {
    if (mapping.milestonePlanIndex === -1) mapping.milestonePlanIndex = 20; // Col U (20)
    if (mapping.milestoneAchIndex === -1) mapping.milestoneAchIndex = 21;   // Col V (21)
    if (mapping.milestonePctAchIndex === -1) mapping.milestonePctAchIndex = 22; // Col W (22)
    if (mapping.milestoneFrIndex === -1) mapping.milestoneFrIndex = 23;     // Col X (23)

    if (mapping.vowdPlanIndex === -1) mapping.vowdPlanIndex = 24;           // Col Y (24)
    if (mapping.vowdAchIndex === -1) mapping.vowdAchIndex = 25;             // Col Z (25)
    if (mapping.vowdPctAchIndex === -1) mapping.vowdPctAchIndex = 26;       // Col AA (26)
    if (mapping.vowdFrIndex === -1) mapping.vowdFrIndex = 27;               // Col AB (27)

    if (mapping.labourPlanIndex === -1) mapping.labourPlanIndex = 28;       // Col AC (28)
    if (mapping.labourAchIndex === -1) mapping.labourAchIndex = 29;         // Col AD (29)
    if (mapping.labourPctAchIndex === -1) mapping.labourPctAchIndex = 30;   // Col AE (30)
    if (mapping.labourFrIndex === -1) mapping.labourFrIndex = 31;           // Col AF (31)
  }

  return mapping;
}

/**
 * Normalize status strings into standard categories: Green, Amber, Red, Gray
 */
export function normalizeStatus(statusStr: string): string {
  if (!statusStr) return 'Gray';
  const val = statusStr.trim().toLowerCase();
  
  if (val.includes('green') || val.includes('track') || val === 'completed' || val === 'done' || val === 'on-track' || val === 'ok' || val === 'active') {
    return 'Green';
  }
  if (val.includes('amber') || val.includes('risk') || val === 'delayed' || val === 'medium' || val === 'warning' || val === 'hold' || val === 'on hold') {
    return 'Amber';
  }
  if (val.includes('red') || val.includes('critical') || val === 'behind' || val === 'high' || val === 'blocked' || val === 'stopped' || val === 'delayed-critical') {
    return 'Red';
  }
  
  // Return title case of the original if it doesn't map cleanly
  return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
}

/**
 * Parse Google Sheet rows into Project objects
 */
export function parseSheetData(
  rows: string[][],
  headerRowIndex: number,
  mapping: ColumnMapping
): Project[] {
  if (!rows || rows.length <= headerRowIndex) return [];

  const projects: Project[] = [];
  const seenCodes = new Set<string>();

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Get values with fallback to empty string
    const getVal = (index: number | undefined) => {
      if (index === undefined || index === -1 || index >= row.length) return '';
      return String(row[index] || '').trim();
    };

    const code = getVal(mapping.codeIndex);
    const name = getVal(mapping.nameIndex) || `Project ${code || i}`;
    const leader = getVal(mapping.leaderIndex) || 'Unassigned';
    const vp = getVal(mapping.vpIndex) || 'Unassigned';
    const area = getVal(mapping.areaIndex) || 'Unassigned';
    const rawStatus = getVal(mapping.statusIndex);
    const spiVal = getVal(mapping.spiIndex);
    const qhse = getVal(mapping.qhseRatingIndex);

    // Derive status: status column -> SPI threshold -> QHSE -> default Green
    let status = 'Gray';
    if (rawStatus) {
      status = normalizeStatus(rawStatus);
    } else if (spiVal) {
      const spiNum = parseFloat(spiVal);
      if (!isNaN(spiNum)) {
        status = spiNum >= 1.0 ? 'Green' : spiNum >= 0.85 ? 'Amber' : 'Red';
      } else {
        status = 'Green';
      }
    } else {
      status = 'Green';
    }

    const progress = spiVal ? `SPI: ${spiVal}` : (getVal(mapping.progressIndex) || '0%');
    const targetDate = getVal(mapping.proposedFinishIndex) || getVal(mapping.targetDateIndex) || getVal(mapping.baselineFinishIndex) || 'N/A';
    const update = getVal(mapping.updateIndex) || 'No updates logged';

    // Parse newly requested headers
    const areaSqft = getVal(mapping.areaSqftIndex);
    const projectStage = getVal(mapping.projectStageIndex);
    const pmSiteIncharge = getVal(mapping.pmSiteInchargeIndex);
    const baselineFinish = getVal(mapping.baselineFinishIndex);
    const baseline1Finish = getVal(mapping.baseline1FinishIndex);
    const proposedFinish = getVal(mapping.proposedFinishIndex);
    const scheduleVariance = getVal(mapping.scheduleVarianceIndex);
    const delayInCurrentMonth = getVal(mapping.delayInCurrentMonthIndex);
    const totalBudget = getVal(mapping.totalBudgetIndex);
    const totalLabours = getVal(mapping.totalLaboursIndex);
    const totalMilestone = getVal(mapping.totalMilestoneIndex);
    const spi = spiVal;
    const qhseRating = qhse;

    const cleanRatingStr = (val: string) => {
      if (!val) return '-';
      const trimmed = val.trim();
      if (!trimmed || trimmed === '-' || trimmed === 'N/A' || trimmed === 'null' || trimmed === 'undefined') return '-';
      const num = parseFloat(trimmed.replace(/%/g, ''));
      if (isNaN(num)) return '-';
      return trimmed;
    };

    let qualityRating = cleanRatingStr(getVal(mapping.qualityRatingIndex));
    let safetyRating = cleanRatingStr(getVal(mapping.safetyRatingIndex));
    let avgQhseRating = cleanRatingStr(getVal(mapping.avgQhseRatingIndex) || qhseRating);

    // Milestones sub-metrics
    const milestonePlan = getVal(mapping.milestonePlanIndex);
    const milestoneAch = getVal(mapping.milestoneAchIndex);
    const milestonePctAch = getVal(mapping.milestonePctAchIndex);
    const milestoneFr = getVal(mapping.milestoneFrIndex);

    // VOWD sub-metrics
    const vowdPlan = getVal(mapping.vowdPlanIndex);
    const vowdAch = getVal(mapping.vowdAchIndex);
    const vowdPctAch = getVal(mapping.vowdPctAchIndex);
    const vowdFr = getVal(mapping.vowdFrIndex);

    // Labour sub-metrics
    const labourPlan = getVal(mapping.labourPlanIndex);
    const labourAch = getVal(mapping.labourAchIndex);
    const labourPctAch = getVal(mapping.labourPctAchIndex);
    const labourFr = getVal(mapping.labourFrIndex);

    // Skip row if both code and name are blank, or if the whole row is empty
    const hasAnyContent = row.some(cell => String(cell || '').trim().length > 0);
    if (!hasAnyContent) {
      continue;
    }

    if (!code && !name) {
      // If leader or stage or area is present, keep the row with generated ID
      if (!leader && !projectStage && !area) {
        continue;
      }
    }

    const resolvedCode = code || `PROJ-${1000 + i}`;
    const resolvedName = name && name !== `Project ${code || i}` ? name : (code ? `Project ${code}` : `Project ${1000 + i}`);

    // Skip if project ID is already seen to prevent duplicated entries (only if explicit code provided)
    if (code && seenCodes.has(code)) {
      continue;
    }
    if (code) {
      seenCodes.add(code);
    }

    projects.push({
      code: resolvedCode,
      name: resolvedName,
      leader,
      vp,
      area,
      status,
      progress,
      targetDate,
      update,
      
      // Extended fields
      areaSqft,
      projectStage,
      pmSiteIncharge,
      baselineFinish,
      baseline1Finish,
      proposedFinish,
      scheduleVariance,
      delayInCurrentMonth,
      totalBudget,
      totalLabours,
      totalMilestone,
      spi,
      qhseRating,
      qualityRating,
      safetyRating,
      avgQhseRating,

      milestonePlan,
      milestoneAch,
      milestonePctAch,
      milestoneFr,

      vowdPlan,
      vowdAch,
      vowdPctAch,
      vowdFr,

      labourPlan,
      labourAch,
      labourPctAch,
      labourFr,

      rawRow: row
    });
  }

  return projects;
}

/**
 * Compute aggregate metrics and rollup reports
 */
export function computeDashboardMetrics(projects: Project[]): DashboardMetrics {
  const statusCounts: Record<string, number> = { Green: 0, Amber: 0, Red: 0, Gray: 0 };
  const vps = new Set<string>();
  const leaders = new Set<string>();
  const areas = new Set<string>();
  let totalAreaUnderConstruction = 0;
  let totalAreaSqft = 0;

  projects.forEach((proj) => {
    // Status count
    const status = proj.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    // Unique sets
    if (proj.vp && proj.vp !== 'Unassigned') vps.add(proj.vp);
    if (proj.leader && proj.leader !== 'Unassigned') leaders.add(proj.leader);
    if (proj.area && proj.area !== 'Unassigned') areas.add(proj.area);

    if (proj.areaSqft) {
      const val = parseFloat(proj.areaSqft.replace(/,/g, ''));
      if (!isNaN(val)) {
        totalAreaSqft += val;

        if (proj.projectStage) {
          const stage = proj.projectStage.trim().toLowerCase();
          const matchesConstruction = 
            stage === 'excavation' ||
            stage === 'construction start' ||
            stage === 'on going project' ||
            stage === 'on going' ||
            stage === 'ongoing' ||
            stage === 'finishing stage' ||
            stage === 'finishing' ||
            stage === 'nearing completion' ||
            stage.includes('excavation') ||
            stage.includes('construction start') ||
            stage.includes('on going') ||
            stage.includes('ongoing') ||
            stage.includes('finishing') ||
            stage.includes('nearing completion');

          if (matchesConstruction) {
            totalAreaUnderConstruction += val;
          }
        }
      }
    }
  });

  return {
    totalProjects: projects.length,
    totalVPs: vps.size,
    totalLeaders: leaders.size,
    totalAreas: areas.size,
    statusCounts,
    totalAreaUnderConstruction,
    totalAreaSqft
  };
}

/**
 * Group projects by VP
 */
export function groupProjectsByVP(projects: Project[]): VPData[] {
  const vpMap = new Map<string, VPData>();

  projects.forEach((proj) => {
    const vpName = proj.vp || 'Unassigned';
    if (!vpMap.has(vpName)) {
      vpMap.set(vpName, {
        name: vpName,
        projectsCount: 0,
        statusCounts: {},
        leaders: new Set<string>(),
        areas: new Set<string>(),
        projects: []
      });
    }

    const data = vpMap.get(vpName)!;
    data.projectsCount += 1;
    data.projects.push(proj);
    
    // Status count
    data.statusCounts[proj.status] = (data.statusCounts[proj.status] || 0) + 1;
    
    // Unique sub-elements
    if (proj.leader && proj.leader !== 'Unassigned') data.leaders.add(proj.leader);
    if (proj.area && proj.area !== 'Unassigned') data.areas.add(proj.area);
  });

  return Array.from(vpMap.values()).sort((a, b) => sortVpNames(a.name, b.name));
}

/**
 * Group projects by Leader
 */
export function groupProjectsByLeader(projects: Project[]): LeaderData[] {
  const leaderMap = new Map<string, LeaderData>();

  projects.forEach((proj) => {
    const leaderName = proj.leader || 'Unassigned';
    if (!leaderMap.has(leaderName)) {
      leaderMap.set(leaderName, {
        name: leaderName,
        vpName: proj.vp || 'Unassigned',
        projectsCount: 0,
        statusCounts: {},
        areas: new Set<string>(),
        projects: []
      });
    }

    const data = leaderMap.get(leaderName)!;
    data.projectsCount += 1;
    data.projects.push(proj);
    
    // Status count
    data.statusCounts[proj.status] = (data.statusCounts[proj.status] || 0) + 1;
    
    // Unique sub-elements
    if (proj.area && proj.area !== 'Unassigned') data.areas.add(proj.area);
    
    // If we learn of a non-unassigned VP, update it
    if (proj.vp && proj.vp !== 'Unassigned' && data.vpName === 'Unassigned') {
      data.vpName = proj.vp;
    }
  });

  return Array.from(leaderMap.values()).sort(sortLeaderItems);
}

/**
 * Group projects by Area
 */
export function groupProjectsByArea(projects: Project[]): AreaData[] {
  const areaMap = new Map<string, AreaData>();

  projects.forEach((proj) => {
    const areaName = proj.area || 'Unassigned';
    if (!areaMap.has(areaName)) {
      areaMap.set(areaName, {
        name: areaName,
        projectsCount: 0,
        statusCounts: {},
        vps: new Set<string>(),
        leaders: new Set<string>(),
        projects: []
      });
    }

    const data = areaMap.get(areaName)!;
    data.projectsCount += 1;
    data.projects.push(proj);
    
    // Status count
    data.statusCounts[proj.status] = (data.statusCounts[proj.status] || 0) + 1;
    
    // Unique sub-elements
    if (proj.vp && proj.vp !== 'Unassigned') data.vps.add(proj.vp);
    if (proj.leader && proj.leader !== 'Unassigned') data.leaders.add(proj.leader);
  });

  return Array.from(areaMap.values()).sort((a, b) => b.projectsCount - a.projectsCount);
}

/**
 * Parses Software2 monthly spreadsheet tab into Software2Project structures for FY 26-27 (Apr-26 to Mar-27)
 */
export function parseSoftware2Data(
  rows: string[][], 
  headerRowIndex: number = 3,
  customMapping?: Partial<Software2Mapping>
): Software2Project[] {
  if (!rows || rows.length <= headerRowIndex) return [];

  // Map of col index to parsed details
  // Map of col index to parsed details with canonical default Software2 coordinates
  const colMappings: { [idx: number]: { metric: 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc' | 'spi' | 'quality' | 'safety' | 'qhse'; month: string; type: 'planR0' | 'planR1' | 'achievement' } } = {
    // VOWD
    18: { metric: 'vowd', month: 'Apr-26', type: 'planR0' },
    19: { metric: 'vowd', month: 'Apr-26', type: 'achievement' },
    20: { metric: 'vowd', month: 'May-26', type: 'planR0' },
    21: { metric: 'vowd', month: 'May-26', type: 'achievement' },
    22: { metric: 'vowd', month: 'Jun-26', type: 'planR0' },
    23: { metric: 'vowd', month: 'Jun-26', type: 'achievement' },
    24: { metric: 'vowd', month: 'Jul-26', type: 'planR0' },
    25: { metric: 'vowd', month: 'Jul-26', type: 'achievement' },
    26: { metric: 'vowd', month: 'Aug-26', type: 'planR0' },
    27: { metric: 'vowd', month: 'Aug-26', type: 'achievement' },
    28: { metric: 'vowd', month: 'Sep-26', type: 'planR0' },
    29: { metric: 'vowd', month: 'Sep-26', type: 'achievement' },
    30: { metric: 'vowd', month: 'Oct-26', type: 'planR0' },
    31: { metric: 'vowd', month: 'Oct-26', type: 'planR1' },
    32: { metric: 'vowd', month: 'Oct-26', type: 'achievement' },
    33: { metric: 'vowd', month: 'Nov-26', type: 'planR0' },
    34: { metric: 'vowd', month: 'Nov-26', type: 'planR1' },
    35: { metric: 'vowd', month: 'Nov-26', type: 'achievement' },
    36: { metric: 'vowd', month: 'Dec-26', type: 'planR0' },
    37: { metric: 'vowd', month: 'Dec-26', type: 'planR1' },
    38: { metric: 'vowd', month: 'Dec-26', type: 'achievement' },
    39: { metric: 'vowd', month: 'Jan-27', type: 'planR0' },
    40: { metric: 'vowd', month: 'Jan-27', type: 'planR1' },
    41: { metric: 'vowd', month: 'Jan-27', type: 'achievement' },
    42: { metric: 'vowd', month: 'Feb-27', type: 'planR0' },
    43: { metric: 'vowd', month: 'Feb-27', type: 'planR1' },
    44: { metric: 'vowd', month: 'Feb-27', type: 'achievement' },
    45: { metric: 'vowd', month: 'Mar-27', type: 'planR0' },
    46: { metric: 'vowd', month: 'Mar-27', type: 'planR1' },
    47: { metric: 'vowd', month: 'Mar-27', type: 'achievement' },

    // Milestones
    57: { metric: 'milestone', month: 'Apr-26', type: 'planR0' },
    58: { metric: 'milestone', month: 'Apr-26', type: 'achievement' },
    59: { metric: 'milestone', month: 'May-26', type: 'planR0' },
    60: { metric: 'milestone', month: 'May-26', type: 'achievement' },
    61: { metric: 'milestone', month: 'Jun-26', type: 'planR0' },
    62: { metric: 'milestone', month: 'Jun-26', type: 'achievement' },
    63: { metric: 'milestone', month: 'Jul-26', type: 'planR0' },
    64: { metric: 'milestone', month: 'Jul-26', type: 'achievement' },
    65: { metric: 'milestone', month: 'Aug-26', type: 'planR0' },
    66: { metric: 'milestone', month: 'Aug-26', type: 'achievement' },
    67: { metric: 'milestone', month: 'Sep-26', type: 'planR0' },
    68: { metric: 'milestone', month: 'Sep-26', type: 'achievement' },
    69: { metric: 'milestone', month: 'Oct-26', type: 'planR0' },
    70: { metric: 'milestone', month: 'Oct-26', type: 'planR1' },
    71: { metric: 'milestone', month: 'Oct-26', type: 'achievement' },
    72: { metric: 'milestone', month: 'Nov-26', type: 'planR0' },
    73: { metric: 'milestone', month: 'Nov-26', type: 'planR1' },
    74: { metric: 'milestone', month: 'Nov-26', type: 'achievement' },
    75: { metric: 'milestone', month: 'Dec-26', type: 'planR0' },
    76: { metric: 'milestone', month: 'Dec-26', type: 'planR1' },
    77: { metric: 'milestone', month: 'Dec-26', type: 'achievement' },
    78: { metric: 'milestone', month: 'Jan-27', type: 'planR0' },
    79: { metric: 'milestone', month: 'Jan-27', type: 'planR1' },
    80: { metric: 'milestone', month: 'Jan-27', type: 'achievement' },
    81: { metric: 'milestone', month: 'Feb-27', type: 'planR0' },
    82: { metric: 'milestone', month: 'Feb-27', type: 'planR1' },
    83: { metric: 'milestone', month: 'Feb-27', type: 'achievement' },
    84: { metric: 'milestone', month: 'Mar-27', type: 'planR0' },
    85: { metric: 'milestone', month: 'Mar-27', type: 'planR1' },
    86: { metric: 'milestone', month: 'Mar-27', type: 'achievement' },

    // Residential Delivery (UR)
    95: { metric: 'ur', month: 'Apr-26', type: 'planR0' },
    96: { metric: 'ur', month: 'Apr-26', type: 'achievement' },
    97: { metric: 'ur', month: 'May-26', type: 'planR0' },
    98: { metric: 'ur', month: 'May-26', type: 'achievement' },
    99: { metric: 'ur', month: 'Jun-26', type: 'planR0' },
    100: { metric: 'ur', month: 'Jun-26', type: 'achievement' },
    101: { metric: 'ur', month: 'Jul-26', type: 'planR0' },
    102: { metric: 'ur', month: 'Jul-26', type: 'achievement' },
    103: { metric: 'ur', month: 'Aug-26', type: 'planR0' },
    104: { metric: 'ur', month: 'Aug-26', type: 'achievement' },
    105: { metric: 'ur', month: 'Sep-26', type: 'planR0' },
    106: { metric: 'ur', month: 'Sep-26', type: 'achievement' },
    107: { metric: 'ur', month: 'Oct-26', type: 'planR0' },
    108: { metric: 'ur', month: 'Oct-26', type: 'planR1' },
    109: { metric: 'ur', month: 'Oct-26', type: 'achievement' },
    110: { metric: 'ur', month: 'Nov-26', type: 'planR0' },
    111: { metric: 'ur', month: 'Nov-26', type: 'planR1' },
    112: { metric: 'ur', month: 'Nov-26', type: 'achievement' },
    113: { metric: 'ur', month: 'Dec-26', type: 'planR0' },
    114: { metric: 'ur', month: 'Dec-26', type: 'planR1' },
    115: { metric: 'ur', month: 'Dec-26', type: 'achievement' },
    116: { metric: 'ur', month: 'Jan-27', type: 'planR0' },
    117: { metric: 'ur', month: 'Jan-27', type: 'planR1' },
    118: { metric: 'ur', month: 'Jan-27', type: 'achievement' },
    119: { metric: 'ur', month: 'Feb-27', type: 'planR0' },
    120: { metric: 'ur', month: 'Feb-27', type: 'planR1' },
    121: { metric: 'ur', month: 'Feb-27', type: 'achievement' },
    122: { metric: 'ur', month: 'Mar-27', type: 'planR0' },
    123: { metric: 'ur', month: 'Mar-27', type: 'planR1' },
    124: { metric: 'ur', month: 'Mar-27', type: 'achievement' },

    // Commercial Delivery (UC)
    132: { metric: 'uc', month: 'Apr-26', type: 'planR0' },
    133: { metric: 'uc', month: 'Apr-26', type: 'achievement' },
    134: { metric: 'uc', month: 'May-26', type: 'planR0' },
    135: { metric: 'uc', month: 'May-26', type: 'achievement' },
    136: { metric: 'uc', month: 'Jun-26', type: 'planR0' },
    137: { metric: 'uc', month: 'Jun-26', type: 'achievement' },
    138: { metric: 'uc', month: 'Jul-26', type: 'planR0' },
    139: { metric: 'uc', month: 'Jul-26', type: 'achievement' },
    140: { metric: 'uc', month: 'Aug-26', type: 'planR0' },
    141: { metric: 'uc', month: 'Aug-26', type: 'achievement' },
    142: { metric: 'uc', month: 'Sep-26', type: 'planR0' },
    143: { metric: 'uc', month: 'Sep-26', type: 'achievement' },
    144: { metric: 'uc', month: 'Oct-26', type: 'planR0' },
    145: { metric: 'uc', month: 'Oct-26', type: 'planR1' },
    146: { metric: 'uc', month: 'Oct-26', type: 'achievement' },
    147: { metric: 'uc', month: 'Nov-26', type: 'planR0' },
    148: { metric: 'uc', month: 'Nov-26', type: 'planR1' },
    149: { metric: 'uc', month: 'Nov-26', type: 'achievement' },
    150: { metric: 'uc', month: 'Dec-26', type: 'planR0' },
    151: { metric: 'uc', month: 'Dec-26', type: 'planR1' },
    152: { metric: 'uc', month: 'Dec-26', type: 'achievement' },
    153: { metric: 'uc', month: 'Jan-27', type: 'planR0' },
    154: { metric: 'uc', month: 'Jan-27', type: 'planR1' },
    155: { metric: 'uc', month: 'Jan-27', type: 'achievement' },
    156: { metric: 'uc', month: 'Feb-27', type: 'planR0' },
    157: { metric: 'uc', month: 'Feb-27', type: 'planR1' },
    158: { metric: 'uc', month: 'Feb-27', type: 'achievement' },
    159: { metric: 'uc', month: 'Mar-27', type: 'planR0' },
    160: { metric: 'uc', month: 'Mar-27', type: 'planR1' },
    161: { metric: 'uc', month: 'Mar-27', type: 'achievement' },

    // Labour
    228: { metric: 'labour', month: 'Apr-26', type: 'planR0' },
    229: { metric: 'labour', month: 'Apr-26', type: 'achievement' },
    230: { metric: 'labour', month: 'May-26', type: 'planR0' },
    231: { metric: 'labour', month: 'May-26', type: 'achievement' },
    232: { metric: 'labour', month: 'Jun-26', type: 'planR0' },
    233: { metric: 'labour', month: 'Jun-26', type: 'achievement' },
    234: { metric: 'labour', month: 'Jul-26', type: 'planR0' },
    235: { metric: 'labour', month: 'Jul-26', type: 'achievement' },
    236: { metric: 'labour', month: 'Aug-26', type: 'planR0' },
    237: { metric: 'labour', month: 'Aug-26', type: 'achievement' },
    238: { metric: 'labour', month: 'Sep-26', type: 'planR0' },
    239: { metric: 'labour', month: 'Sep-26', type: 'achievement' },
    241: { metric: 'labour', month: 'Oct-26', type: 'planR0' },
    242: { metric: 'labour', month: 'Oct-26', type: 'planR1' },
    243: { metric: 'labour', month: 'Oct-26', type: 'achievement' },
    244: { metric: 'labour', month: 'Nov-26', type: 'planR0' },
    245: { metric: 'labour', month: 'Nov-26', type: 'planR1' },
    246: { metric: 'labour', month: 'Nov-26', type: 'achievement' },
    247: { metric: 'labour', month: 'Dec-26', type: 'planR0' },
    248: { metric: 'labour', month: 'Dec-26', type: 'planR1' },
    249: { metric: 'labour', month: 'Dec-26', type: 'achievement' },
    250: { metric: 'labour', month: 'Jan-27', type: 'planR0' },
    251: { metric: 'labour', month: 'Jan-27', type: 'planR1' },
    252: { metric: 'labour', month: 'Jan-27', type: 'achievement' },
    253: { metric: 'labour', month: 'Feb-27', type: 'planR0' },
    254: { metric: 'labour', month: 'Feb-27', type: 'planR1' },
    255: { metric: 'labour', month: 'Feb-27', type: 'achievement' },
    256: { metric: 'labour', month: 'Mar-27', type: 'planR0' },
    257: { metric: 'labour', month: 'Mar-27', type: 'planR1' },
    258: { metric: 'labour', month: 'Mar-27', type: 'achievement' },

    // SPI FY25
    284: { metric: 'spi', month: 'Apr-25', type: 'achievement' },
    285: { metric: 'spi', month: 'May-25', type: 'achievement' },
    286: { metric: 'spi', month: 'Jun-25', type: 'achievement' },
    287: { metric: 'spi', month: 'Jul-25', type: 'achievement' },
    288: { metric: 'spi', month: 'Aug-25', type: 'achievement' },
    289: { metric: 'spi', month: 'Sep-25', type: 'achievement' },
    290: { metric: 'spi', month: 'Oct-25', type: 'achievement' },
    292: { metric: 'spi', month: 'Nov-25', type: 'achievement' },
    293: { metric: 'spi', month: 'Dec-25', type: 'achievement' },
    294: { metric: 'spi', month: 'Jan-26', type: 'achievement' },
    295: { metric: 'spi', month: 'Feb-26', type: 'achievement' },
    296: { metric: 'spi', month: 'Mar-26', type: 'achievement' },

    // Quality (Qua) FY25
    298: { metric: 'quality', month: 'Apr-25', type: 'achievement' },
    299: { metric: 'quality', month: 'May-25', type: 'achievement' },
    300: { metric: 'quality', month: 'Jun-25', type: 'achievement' },
    301: { metric: 'quality', month: 'Jul-25', type: 'achievement' },
    302: { metric: 'quality', month: 'Aug-25', type: 'achievement' },
    303: { metric: 'quality', month: 'Sep-25', type: 'achievement' },
    304: { metric: 'quality', month: 'Oct-25', type: 'achievement' },
    306: { metric: 'quality', month: 'Nov-25', type: 'achievement' },
    307: { metric: 'quality', month: 'Dec-25', type: 'achievement' },
    308: { metric: 'quality', month: 'Jan-26', type: 'achievement' },
    309: { metric: 'quality', month: 'Feb-26', type: 'achievement' },

    // Safety (Saf) FY25
    311: { metric: 'safety', month: 'Apr-25', type: 'achievement' },
    312: { metric: 'safety', month: 'May-25', type: 'achievement' },
    313: { metric: 'safety', month: 'Jun-25', type: 'achievement' },
    314: { metric: 'safety', month: 'Jul-25', type: 'achievement' },
    315: { metric: 'safety', month: 'Aug-25', type: 'achievement' },
    316: { metric: 'safety', month: 'Sep-25', type: 'achievement' },
    317: { metric: 'safety', month: 'Oct-25', type: 'achievement' },
    319: { metric: 'safety', month: 'Nov-25', type: 'achievement' },
    320: { metric: 'safety', month: 'Dec-25', type: 'achievement' },
    321: { metric: 'safety', month: 'Jan-26', type: 'achievement' },
    322: { metric: 'safety', month: 'Feb-26', type: 'achievement' },

    // Avg QHSE (Avg) FY25
    324: { metric: 'qhse', month: 'Apr-25', type: 'achievement' },
    325: { metric: 'qhse', month: 'May-25', type: 'achievement' },
    326: { metric: 'qhse', month: 'Jun-25', type: 'achievement' },
    327: { metric: 'qhse', month: 'Jul-25', type: 'achievement' },
    328: { metric: 'qhse', month: 'Aug-25', type: 'achievement' },
    329: { metric: 'qhse', month: 'Sep-25', type: 'achievement' },
    330: { metric: 'qhse', month: 'Oct-25', type: 'achievement' },
    332: { metric: 'qhse', month: 'Nov-25', type: 'achievement' },
    333: { metric: 'qhse', month: 'Dec-25', type: 'achievement' },
    334: { metric: 'qhse', month: 'Jan-26', type: 'achievement' },
    335: { metric: 'qhse', month: 'Feb-26', type: 'achievement' }
  };
  
  // Basic metadata indexes
  let codeIndex = 1;
  let nameIndex = 2;
  let leaderIndex = 3; // Column D
  let vpIndex = 4;     // Column E
  let stageIndex = 5;  // Column F
  let areaIndex = 6;   // Column G
  let spiIndex = 6;    // Column G - SPI
  let qualityRatingIndex = 8; // Column I - Quality Rating
  let safetyRatingIndex = 9;  // Column J - Safety Rating
  let avgQhseRatingIndex = 10; // Column K - Avg QHSE Rating

  // Fiscal Year 25-26 months
  const fy25Months = [
    { key: 'Apr-25', regex: /\bapr(il)?\b.*25|apr25|apr\-25|apr\'25/i },
    { key: 'May-25', regex: /\bmay\b.*25|may25|may\-25|may\'25/i },
    { key: 'Jun-25', regex: /\bjun(e)?\b.*25|jun25|jun\-25|jun\'25/i },
    { key: 'Jul-25', regex: /\bjul(y)?\b.*25|jul25|jul\-25|jul\'25/i },
    { key: 'Aug-25', regex: /\baug(ust)?\b.*25|aug25|aug\-25|aug\'25/i },
    { key: 'Sep-25', regex: /\bsep(t)?(ember)?\b.*25|sep25|sep\-25|sep\'25/i },
    { key: 'Oct-25', regex: /\boct(ober)?\b.*25|oct25|oct\-25|oct\'25/i },
    { key: 'Nov-25', regex: /\bnov(ember)?\b.*25|nov25|nov\-25|nov\'25/i },
    { key: 'Dec-25', regex: /\bdec(ember)?\b.*25|dec25|dec\-25|dec\'25/i },
    { key: 'Jan-26', regex: /\bjan(uary)?\b.*26|jan26|jan\-26|jan\'26/i },
    { key: 'Feb-26', regex: /\bfeb(ruary)?\b.*26|feb26|feb\-26|feb\'26/i },
    { key: 'Mar-26', regex: /\bmar(ch)?\b.*26|mar26|mar\-26|mar\'26/i }
  ];

  // Fiscal Year 26-27 months with precise word-boundaries to avoid false-positives (e.g. Approved -> Apr)
  const fyMonths = [
    { key: 'Apr-26', regex: /\bapr(il)?\b|apr26|apr\-26|apr\'26/i },
    { key: 'May-26', regex: /\bmay\b|may26|may\-26|may\'26/i },
    { key: 'Jun-26', regex: /\bjun(e)?\b|jun26|jun\-26|jun\'26/i },
    { key: 'Jul-26', regex: /\bjul(y)?\b|jul26|jul\-26|jul\'26/i },
    { key: 'Aug-26', regex: /\baug(ust)?\b|aug26|aug\-26|aug\'26/i },
    { key: 'Sep-26', regex: /\bsep(t)?(ember)?\b|sep26|sep\-26|sep\'26/i },
    { key: 'Oct-26', regex: /\boct(ober)?\b|oct26|oct\-26|oct\'26/i },
    { key: 'Nov-26', regex: /\bnov(ember)?\b|nov26|nov\-26|nov\'26/i },
    { key: 'Dec-26', regex: /\bdec(ember)?\b|dec26|dec\-26|dec\'26/i },
    { key: 'Jan-27', regex: /\bjan(uary)?\b|jan27|jan\-27|jan\'27/i },
    { key: 'Feb-27', regex: /\bfeb(ruary)?\b|feb27|feb\-27|feb\'27/i },
    { key: 'Mar-27', regex: /\bmar(ch)?\b|mar27|mar\-27|mar\'27/i }
  ];

  const headerRow = rows[headerRowIndex] || [];
  const parentRow = headerRowIndex > 0 ? rows[headerRowIndex - 1] : undefined;
  const grandParentRow = headerRowIndex > 1 ? rows[headerRowIndex - 2] : undefined;

  headerRow.forEach((cell, idx) => {
    if (!cell && (!parentRow || !parentRow[idx]) && (!grandParentRow || !grandParentRow[idx])) return;
    const val = String(cell || '').trim().toLowerCase();

    // Resolve parent category by scanning backwards across merged cells
    let parentVal = "";
    if (parentRow && parentRow.length > idx) {
      for (let c = idx; c >= 0; c--) {
        const pVal = String(parentRow[c] || '').trim();
        if (pVal) {
          parentVal = pVal.toLowerCase();
          break;
        }
      }
    }

    let grandParentVal = "";
    if (grandParentRow && grandParentRow.length > idx) {
      for (let c = idx; c >= 0; c--) {
        const gpVal = String(grandParentRow[c] || '').trim();
        if (gpVal) {
          grandParentVal = gpVal.toLowerCase();
          break;
        }
      }
    }

    const fullText = `${grandParentVal} ${parentVal} ${val}`.trim();

    // Basic columns (run auto-detection first)
    if (/project.*code|code|prj.*code|proj.*id|project.*id/i.test(val) && !/vowd|mil|lab/i.test(fullText)) {
      codeIndex = idx;
    } else if (/project.*name|project|name/i.test(val) && !/vowd|mil|lab|ur|uc/i.test(fullText)) {
      nameIndex = idx;
    } else if (/leader|lead/i.test(val)) {
      leaderIndex = idx;
    } else if (/vp|vice/i.test(val)) {
      vpIndex = idx;
    } else if (/stage/i.test(val)) {
      stageIndex = idx;
    } else if (/area|region|vertical/i.test(val)) {
      areaIndex = idx;
    } else if (/\bspi\b/i.test(val)) {
      spiIndex = idx;
    } else if (/\bquality\b|\bqua\b/i.test(val)) {
      qualityRatingIndex = idx;
    } else if (/\bsafety\b|\bsaf\b/i.test(val)) {
      safetyRatingIndex = idx;
    } else if (/avg.*qhse|qhse/i.test(val)) {
      avgQhseRatingIndex = idx;
    }

    // Determine metrics
    let metric: 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc' | null = null;
    
    // 1. Check cell-level header text first (highly specific)
    if (/vowd/i.test(val)) {
      metric = 'vowd';
    } else if (/milestone|milestones|mil\b|ms\b|m\/s|m\-stone|mstone|mulesile|milesile/i.test(val)) {
      metric = 'milestone';
    } else if (/labour|labor|lab\b/i.test(val)) {
      metric = 'labour';
    } else if (/\bur\b|residential|unit.*res/i.test(val)) {
      metric = 'ur';
    } else if (/\buc\b|com+er+cial|com+er+ial|unit.*com/i.test(val)) {
      metric = 'uc';
    }

    // 2. Fallback to fullText (including parent row category)
    if (!metric) {
      if (/vowd/i.test(fullText)) {
        metric = 'vowd';
      } else if (/milestone|milestones|mil\b|ms\b|m\/s|m\-stone|mstone|mulesile|milesile/i.test(fullText)) {
        metric = 'milestone';
      } else if (/labour|labor|lab\b/i.test(fullText)) {
        metric = 'labour';
      } else if (/\bur\b|residential|unit.*res/i.test(fullText)) {
        metric = 'ur';
      } else if (/\buc\b|com+er+cial|com+er+ial|unit.*com/i.test(fullText)) {
        metric = 'uc';
      }
    }

    if (metric) {
      const monthObj = fyMonths.find(m => m.regex.test(fullText));
      if (monthObj) {
        let type: 'planR0' | 'planR1' | 'achievement' = 'planR0';
        if (/ach\b|act\b|achieve|actual/i.test(fullText)) {
          type = 'achievement';
        } else if (/r1/i.test(fullText)) {
          type = 'planR1';
        } else if (/r0|ro/i.test(fullText)) {
          type = 'planR0';
        } else if (/plan|tgt|target/i.test(fullText)) {
          type = 'planR0'; // default plan is R0 unless specified as R1
        } else {
          if (/ach|act/i.test(val)) type = 'achievement';
          else if (/r1/i.test(val)) type = 'planR1';
          else type = 'planR0';
        }

        colMappings[idx] = {
          metric,
          month: monthObj.key,
          type
        };
      }
    } else {
      // Check for FY25 months (SPI, Quality, Safety, QHSE)
      const month25Obj = fy25Months.find(m => m.regex.test(fullText));
      if (month25Obj) {
        let metric25: 'spi' | 'quality' | 'safety' | 'qhse' | null = null;
        if (/\bspi\b/i.test(fullText)) {
          metric25 = 'spi';
        } else if (/\bquality\b|\bqua\b/i.test(fullText)) {
          metric25 = 'quality';
        } else if (/\bsafety\b|\bsaf\b/i.test(fullText)) {
          metric25 = 'safety';
        } else if (/avg.*qhse|qhse|avg.*rating|rating/i.test(fullText)) {
          metric25 = 'qhse';
        }

        if (metric25) {
          colMappings[idx] = {
            metric: metric25,
            month: month25Obj.key,
            type: 'achievement'
          };
        }
      }
    }
  });

  // Apply custom index overrides if specified by the user
  if (customMapping) {
    if (customMapping.codeIndex !== undefined && customMapping.codeIndex !== -1) codeIndex = customMapping.codeIndex;
    if (customMapping.nameIndex !== undefined && customMapping.nameIndex !== -1) nameIndex = customMapping.nameIndex;
    if (customMapping.leaderIndex !== undefined && customMapping.leaderIndex !== -1) leaderIndex = customMapping.leaderIndex;
    if (customMapping.vpIndex !== undefined && customMapping.vpIndex !== -1) vpIndex = customMapping.vpIndex;
    if (customMapping.stageIndex !== undefined && customMapping.stageIndex !== -1) stageIndex = customMapping.stageIndex;
    if (customMapping.areaIndex !== undefined && customMapping.areaIndex !== -1) areaIndex = customMapping.areaIndex;
    if (customMapping.spiIndex !== undefined && customMapping.spiIndex !== -1) spiIndex = customMapping.spiIndex;
    if (customMapping.qualityRatingIndex !== undefined && customMapping.qualityRatingIndex !== -1) qualityRatingIndex = customMapping.qualityRatingIndex;
    if (customMapping.safetyRatingIndex !== undefined && customMapping.safetyRatingIndex !== -1) safetyRatingIndex = customMapping.safetyRatingIndex;
    if (customMapping.avgQhseRatingIndex !== undefined && customMapping.avgQhseRatingIndex !== -1) avgQhseRatingIndex = customMapping.avgQhseRatingIndex;

    if (customMapping.metricOverrides) {
      Object.entries(customMapping.metricOverrides).forEach(([paramKey, colIdx]) => {
        const parts = paramKey.split('_');
        if (parts.length === 3) {
          const metric = parts[0] as 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc';
          const month = parts[1];
          const type = parts[2] as 'planR0' | 'planR1' | 'achievement';

          // Clear any existing colMapping mapped to this exact metric/month/type combo
          Object.keys(colMappings).forEach((idxStr) => {
            const idxVal = parseInt(idxStr, 10);
            const existing = colMappings[idxVal];
            if (existing && existing.metric === metric && existing.month === month && existing.type === type) {
              delete colMappings[idxVal];
            }
          });

          // Set the new manual index override if valid
          if (colIdx !== undefined && colIdx !== -1) {
            colMappings[colIdx] = { metric, month, type };
          }
        }
      });
    }
  }

  const projects: Software2Project[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const getVal = (index: number) => {
      if (index === -1 || index >= row.length) return '';
      return String(row[index] || '').trim();
    };

    const code = getVal(codeIndex);
    const rawName = getVal(nameIndex);
    if (!code && !rawName) continue;

    const resolvedCode = code || `PRJ-S2-${1000 + i}`;
    const name = rawName || `Project ${resolvedCode}`;
    const leader = getVal(leaderIndex) || 'Unassigned';
    const vp = getVal(vpIndex) || 'Unassigned';
    const stage = getVal(stageIndex) || 'Execution';
    const area = getVal(areaIndex) || 'Unassigned';

    const cleanRatingStr2 = (val: string) => {
      if (!val) return '-';
      const trimmed = val.trim();
      if (!trimmed || trimmed === '-' || trimmed === 'N/A' || trimmed === 'null' || trimmed === 'undefined') return '-';
      const num = parseFloat(trimmed.replace(/%/g, ''));
      if (isNaN(num)) return '-';
      return trimmed;
    };

    const spi = getVal(spiIndex);
    const qualityRating = cleanRatingStr2(getVal(qualityRatingIndex));
    const safetyRating = cleanRatingStr2(getVal(safetyRatingIndex));
    const avgQhseRating = cleanRatingStr2(getVal(avgQhseRatingIndex));

    const vowdMap: { [month: string]: MonthlyMetric } = {};
    const milestoneMap: { [month: string]: MonthlyMetric } = {};
    const labourMap: { [month: string]: MonthlyMetric } = {};
    const urMap: { [month: string]: MonthlyMetric } = {};
    const ucMap: { [month: string]: MonthlyMetric } = {};

    const spiMap: { [month: string]: MonthlyMetric } = {};
    const qualityMap: { [month: string]: MonthlyMetric } = {};
    const safetyMap: { [month: string]: MonthlyMetric } = {};
    const qhseMap: { [month: string]: MonthlyMetric } = {};

    fyMonths.forEach(m => {
      vowdMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      milestoneMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      labourMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      urMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      ucMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
    });

    fy25Months.forEach(m => {
      spiMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
      qualityMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
      safetyMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
      qhseMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
    });

    row.forEach((cell, idx) => {
      const mapping = colMappings[idx];
      if (!mapping) return;

      const cellClean = String(cell || '').replace(/[$,%\s]/g, '');
      const val = parseFloat(cellClean) || 0;

      let mapToUse: { [month: string]: MonthlyMetric } | null = null;
      if (mapping.metric === 'vowd') mapToUse = vowdMap;
      else if (mapping.metric === 'milestone') mapToUse = milestoneMap;
      else if (mapping.metric === 'labour') mapToUse = labourMap;
      else if (mapping.metric === 'ur') mapToUse = urMap;
      else if (mapping.metric === 'uc') mapToUse = ucMap;
      else if (mapping.metric === 'spi') mapToUse = spiMap;
      else if (mapping.metric === 'quality') mapToUse = qualityMap;
      else if (mapping.metric === 'safety') mapToUse = safetyMap;
      else if (mapping.metric === 'qhse') mapToUse = qhseMap;

      if (!mapToUse) return;

      if (mapping.type === 'planR0') {
        mapToUse[mapping.month].planR0 = val;
        if (mapToUse[mapping.month].planR1 === undefined) {
          mapToUse[mapping.month].plan = val;
        }
      } else if (mapping.type === 'planR1') {
        mapToUse[mapping.month].planR1 = val;
        mapToUse[mapping.month].plan = val; // Latest plan (R1) is default for plan prop
      } else {
        mapToUse[mapping.month].achievement = val;
      }
    });

    projects.push({
      code,
      name,
      leader,
      vp,
      stage,
      area,
      spi,
      qualityRating,
      safetyRating,
      avgQhseRating,
      vowd: Object.values(vowdMap),
      milestone: Object.values(milestoneMap),
      labour: Object.values(labourMap),
      ur: Object.values(urMap),
      uc: Object.values(ucMap),
      spiHistory: Object.values(spiMap),
      qualityHistory: Object.values(qualityMap),
      safetyHistory: Object.values(safetyMap),
      avgQhseHistory: Object.values(qhseMap)
    });
  }

  return projects;
}

