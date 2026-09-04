import { Project, ColumnMapping, DashboardMetrics, VPData, LeaderData, AreaData, Software2Project, MonthlyMetric, Software2Mapping, FiscalYearKey, Software3Milestone } from '@/src/types';
import { sortVpNames, sortLeaderItems, isCompleteOrLostStage, isTempProject } from '@/src/utils/customOrder';
import { getFiscalYearConfig, DEFAULT_FISCAL_YEAR } from '@/src/utils/fiscalYear';

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

    // Derive status: SPI threshold -> status column -> Gray if NA
    const cleanSpi = String(spiVal || '').trim().toUpperCase();
    const isSpiNA = cleanSpi === 'NA' || cleanSpi === 'N/A' || cleanSpi === '-' || cleanSpi === 'NONE' || cleanSpi === '' || isNaN(parseFloat(spiVal));

    let status = 'Gray';
    if (spiVal && !isSpiNA) {
      const spiNum = parseFloat(spiVal);
      if (!isNaN(spiNum)) {
        status = spiNum >= 1.0 ? 'Green' : spiNum >= 0.85 ? 'Amber' : 'Red';
      }
    } else if (rawStatus && !isSpiNA) {
      status = normalizeStatus(rawStatus);
    } else {
      status = 'Gray';
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
 * Helper to identify if a project stage falls under "Under Construction".
 * Under Construction is the summation of projects having stages:
 * - Construction Start Stage
 * - On Going project Stage
 * - Finishing stage
 * - Nearing completion Stage
 */
export function isUnderConstructionStage(stageStr?: string): boolean {
  if (!stageStr) return false;
  const s = String(stageStr).trim().toLowerCase();

  // Exclude non-construction stages explicitly
  if (
    s.includes('upcoming') ||
    s.includes('pipeline') ||
    s.includes('design') ||
    s.includes('drawing') ||
    s.includes('engineering') ||
    s.includes('excavation') ||
    s.includes('handover') ||
    s.includes('possession') ||
    s.includes('hold') ||
    s.includes('stop') ||
    s.includes('complete') ||
    s.includes('lost')
  ) {
    return false;
  }

  return (
    s.includes('construction start') ||
    s === 'construction start' ||
    s === 'construction start stage' ||
    s === 'start' ||
    s.includes('ongoing') ||
    s.includes('on going') ||
    s.includes('execution') ||
    s.includes('finishing') ||
    s.includes('nearing completion') ||
    s.includes('nearing comp')
  );
}

/**
 * Safely parse a budget string into Crores (₹ Cr.)
 */
export function parseBudgetValue(val?: string | number): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    if (val >= 10000000) return val / 10000000;
    if (val >= 100000) return val / 10000000;
    return val;
  }
  const cleanStr = String(val).trim();
  if (!cleanStr || cleanStr === '-' || cleanStr === 'N/A' || cleanStr === 'null') return 0;

  const lower = cleanStr.toLowerCase();
  const numMatches = cleanStr.replace(/,/g, '').match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!numMatches) return 0;
  const num = parseFloat(numMatches[0]);
  if (isNaN(num)) return 0;

  if (lower.includes('lakh') || lower.includes('lac') || lower.includes(' l')) {
    return num / 100;
  }
  if (lower.includes('k') && !lower.includes('cr')) {
    return num / 10000;
  }
  if (lower.includes('cr') || lower.includes('crore')) {
    return num;
  }
  if (num >= 10000000) {
    return num / 10000000;
  }
  if (num >= 100000 && (cleanStr.includes('$') || cleanStr.includes('₹') || cleanStr.includes('Rs'))) {
    return num / 10000000;
  }
  return num;
}

/**
 * Format numeric Crores value into a readable string (e.g. "1,250.50 Cr." or "45.00 Cr.")
 */
export function formatBudgetDisplay(crVal: number): string {
  if (!crVal || isNaN(crVal) || crVal <= 0) return '₹ 0 Cr.';
  if (crVal >= 100) {
    return `₹ ${crVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Cr.`;
  }
  return `₹ ${crVal.toFixed(2)} Cr.`;
}

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Standardize any date into uniform dd-mmm-yy format (e.g. "30-Sep-26", "15-Aug-26", "05-Jan-25")
 */
export function formatDateToDdMmmYy(dateVal: string | number | undefined | null): string {
  if (dateVal === undefined || dateVal === null) return '-';
  if (typeof dateVal === 'number') {
    if (isNaN(dateVal) || dateVal <= 0) return '-';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const mon = SHORT_MONTH_NAMES[d.getMonth()];
    const yr = String(d.getFullYear()).slice(-2);
    return `${day}-${mon}-${yr}`;
  }

  const clean = String(dateVal).trim();
  if (!clean || clean === '-' || clean === 'N/A' || clean === 'null' || clean === 'undefined') return '-';

  // Check dd-mmm-yy or dd-mmm-yyyy (e.g. "30-Sep-26", "5-Sep-2026", "15-September-2026")
  const wordMonthMatch = clean.match(/^(\d{1,2})[-/\s]([A-Za-z]+)[-/\s](\d{2,4})$/);
  if (wordMonthMatch) {
    const day = wordMonthMatch[1].padStart(2, '0');
    const mStr = wordMonthMatch[2].toLowerCase();
    const mIdx = FULL_MONTH_MAP[mStr] !== undefined ? FULL_MONTH_MAP[mStr] : SHORT_MONTH_NAMES.findIndex(m => m.toLowerCase() === mStr.slice(0, 3));
    const mon = (mIdx >= 0 && mIdx < 12) ? SHORT_MONTH_NAMES[mIdx] : (mStr.charAt(0).toUpperCase() + mStr.slice(1, 3));
    let yr = wordMonthMatch[3];
    if (yr.length === 4) yr = yr.slice(-2);
    return `${day}-${mon}-${yr}`;
  }

  // Check standard ISO yyyy-mm-dd
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const yr = isoMatch[1].slice(-2);
    const mIdx = parseInt(isoMatch[2], 10) - 1;
    const mon = (mIdx >= 0 && mIdx < 12) ? SHORT_MONTH_NAMES[mIdx] : 'Jan';
    const day = isoMatch[3].padStart(2, '0');
    return `${day}-${mon}-${yr}`;
  }

  // Check dd-mm-yyyy or dd/mm/yyyy
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const mIdx = parseInt(dmyMatch[2], 10) - 1;
    const mon = (mIdx >= 0 && mIdx < 12) ? SHORT_MONTH_NAMES[mIdx] : 'Jan';
    let yr = dmyMatch[3];
    if (yr.length === 4) yr = yr.slice(-2);
    return `${day}-${mon}-${yr}`;
  }

  // Check mmm-yy or mmm-yyyy (e.g. "Sep-26", "September 2026")
  const monYrMatch = clean.match(/^([A-Za-z]+)[-/\s](\d{2,4})$/);
  if (monYrMatch) {
    const mStr = monYrMatch[1].toLowerCase();
    const mIdx = FULL_MONTH_MAP[mStr] !== undefined ? FULL_MONTH_MAP[mStr] : SHORT_MONTH_NAMES.findIndex(m => m.toLowerCase() === mStr.slice(0, 3));
    const mon = (mIdx >= 0 && mIdx < 12) ? SHORT_MONTH_NAMES[mIdx] : 'Jan';
    let yr = monYrMatch[2];
    if (yr.length === 4) yr = yr.slice(-2);
    return `01-${mon}-${yr}`;
  }

  // Parse general date string
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const day = String(d.getDate()).padStart(2, '0');
    const mon = SHORT_MONTH_NAMES[d.getMonth()];
    const yr = String(d.getFullYear()).slice(-2);
    return `${day}-${mon}-${yr}`;
  }

  return clean;
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
  let totalBudgetUnderManagement = 0;
  let totalBudgetUnderConstruction = 0;
  let projectsUnderConstructionCount = 0;
  let activeProjectsCount = 0;

  projects.forEach((proj) => {
    const isTemp = isTempProject(proj.code);
    const isCompletedOrLost = isCompleteOrLostStage(proj.projectStage);

    // Unique sets
    if (proj.vp && proj.vp !== 'Unassigned') vps.add(proj.vp);
    if (proj.leader && proj.leader !== 'Unassigned') leaders.add(proj.leader);
    if (proj.area && proj.area !== 'Unassigned') areas.add(proj.area);

    // Do not count temp, complete, complete-old, lost for project count, area, budget, or status counts
    if (!isTemp && !isCompletedOrLost) {
      activeProjectsCount += 1;
      const status = proj.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const budgetVal = parseBudgetValue(proj.totalBudget);
      let areaVal = 0;
      if (proj.areaSqft) {
        const val = parseFloat(String(proj.areaSqft).replace(/,/g, ''));
        if (!isNaN(val)) {
          areaVal = val;
        }
      }

      totalBudgetUnderManagement += budgetVal;
      totalAreaSqft += areaVal;

      if (isUnderConstructionStage(proj.projectStage)) {
        projectsUnderConstructionCount += 1;
        totalAreaUnderConstruction += areaVal;
        totalBudgetUnderConstruction += budgetVal;
      }
    }
  });

  return {
    totalProjects: activeProjectsCount,
    totalVPs: vps.size,
    totalLeaders: leaders.size,
    totalAreas: areas.size,
    statusCounts,
    totalAreaUnderConstruction,
    totalAreaSqft,
    totalBudgetUnderManagement,
    totalBudgetUnderConstruction,
    projectsUnderConstructionCount
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
    data.projects.push(proj);

    const isTemp = isTempProject(proj.code);
    const isCompletedOrLost = isCompleteOrLostStage(proj.projectStage);

    // Only count active projects for projectsCount and statusCounts
    if (!isTemp && !isCompletedOrLost) {
      data.projectsCount += 1;
      data.statusCounts[proj.status] = (data.statusCounts[proj.status] || 0) + 1;
    }
    
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
    data.projects.push(proj);

    const isTemp = isTempProject(proj.code);
    const isCompletedOrLost = isCompleteOrLostStage(proj.projectStage);

    // Only count active projects for projectsCount and statusCounts
    if (!isTemp && !isCompletedOrLost) {
      data.projectsCount += 1;
      data.statusCounts[proj.status] = (data.statusCounts[proj.status] || 0) + 1;
    }
    
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
    data.projects.push(proj);

    const isTemp = isTempProject(proj.code);
    const isCompletedOrLost = isCompleteOrLostStage(proj.projectStage);

    // Only count active projects for projectsCount and statusCounts
    if (!isTemp && !isCompletedOrLost) {
      data.projectsCount += 1;
      data.statusCounts[proj.status] = (data.statusCounts[proj.status] || 0) + 1;
    }
    
    // Unique sub-elements
    if (proj.vp && proj.vp !== 'Unassigned') data.vps.add(proj.vp);
    if (proj.leader && proj.leader !== 'Unassigned') data.leaders.add(proj.leader);
  });

  return Array.from(areaMap.values()).sort((a, b) => b.projectsCount - a.projectsCount);
}

/**
 * Parses Software2 monthly spreadsheet tab into Software2Project structures for active FY
 */
export function parseSoftware2Data(
  rows: string[][], 
  headerRowIndex: number = 3,
  customMapping?: Partial<Software2Mapping>,
  fyKey?: string
): Software2Project[] {
  if (!rows || rows.length <= headerRowIndex) return [];

  const fyConfig = getFiscalYearConfig(fyKey);
  const activeMonths = fyConfig.months;

  // Map of col index to parsed details with canonical default Software2 coordinates
  const colMappings: { [idx: number]: { metric: 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc' | 'spi' | 'quality' | 'safety' | 'qhse' | 'finish'; month: string; type: 'planR0' | 'planR1' | 'achievement' } } = {
    // VOWD
    18: { metric: 'vowd', month: activeMonths[0].key, type: 'planR0' },
    19: { metric: 'vowd', month: activeMonths[0].key, type: 'achievement' },
    20: { metric: 'vowd', month: activeMonths[1].key, type: 'planR0' },
    21: { metric: 'vowd', month: activeMonths[1].key, type: 'achievement' },
    22: { metric: 'vowd', month: activeMonths[2].key, type: 'planR0' },
    23: { metric: 'vowd', month: activeMonths[2].key, type: 'achievement' },
    24: { metric: 'vowd', month: activeMonths[3].key, type: 'planR0' },
    25: { metric: 'vowd', month: activeMonths[3].key, type: 'achievement' },
    26: { metric: 'vowd', month: activeMonths[4].key, type: 'planR0' },
    27: { metric: 'vowd', month: activeMonths[4].key, type: 'achievement' },
    28: { metric: 'vowd', month: activeMonths[5].key, type: 'planR0' },
    29: { metric: 'vowd', month: activeMonths[5].key, type: 'achievement' },
    30: { metric: 'vowd', month: activeMonths[6].key, type: 'planR0' },
    31: { metric: 'vowd', month: activeMonths[6].key, type: 'planR1' },
    32: { metric: 'vowd', month: activeMonths[6].key, type: 'achievement' },
    33: { metric: 'vowd', month: activeMonths[7].key, type: 'planR0' },
    34: { metric: 'vowd', month: activeMonths[7].key, type: 'planR1' },
    35: { metric: 'vowd', month: activeMonths[7].key, type: 'achievement' },
    36: { metric: 'vowd', month: activeMonths[8].key, type: 'planR0' },
    37: { metric: 'vowd', month: activeMonths[8].key, type: 'planR1' },
    38: { metric: 'vowd', month: activeMonths[8].key, type: 'achievement' },
    39: { metric: 'vowd', month: activeMonths[9].key, type: 'planR0' },
    40: { metric: 'vowd', month: activeMonths[9].key, type: 'planR1' },
    41: { metric: 'vowd', month: activeMonths[9].key, type: 'achievement' },
    42: { metric: 'vowd', month: activeMonths[10].key, type: 'planR0' },
    43: { metric: 'vowd', month: activeMonths[10].key, type: 'planR1' },
    44: { metric: 'vowd', month: activeMonths[10].key, type: 'achievement' },
    45: { metric: 'vowd', month: activeMonths[11].key, type: 'planR0' },
    46: { metric: 'vowd', month: activeMonths[11].key, type: 'planR1' },
    47: { metric: 'vowd', month: activeMonths[11].key, type: 'achievement' },

    // Milestones
    57: { metric: 'milestone', month: activeMonths[0].key, type: 'planR0' },
    58: { metric: 'milestone', month: activeMonths[0].key, type: 'achievement' },
    59: { metric: 'milestone', month: activeMonths[1].key, type: 'planR0' },
    60: { metric: 'milestone', month: activeMonths[1].key, type: 'achievement' },
    61: { metric: 'milestone', month: activeMonths[2].key, type: 'planR0' },
    62: { metric: 'milestone', month: activeMonths[2].key, type: 'achievement' },
    63: { metric: 'milestone', month: activeMonths[3].key, type: 'planR0' },
    64: { metric: 'milestone', month: activeMonths[3].key, type: 'achievement' },
    65: { metric: 'milestone', month: activeMonths[4].key, type: 'planR0' },
    66: { metric: 'milestone', month: activeMonths[4].key, type: 'achievement' },
    67: { metric: 'milestone', month: activeMonths[5].key, type: 'planR0' },
    68: { metric: 'milestone', month: activeMonths[5].key, type: 'achievement' },
    69: { metric: 'milestone', month: activeMonths[6].key, type: 'planR0' },
    70: { metric: 'milestone', month: activeMonths[6].key, type: 'planR1' },
    71: { metric: 'milestone', month: activeMonths[6].key, type: 'achievement' },
    72: { metric: 'milestone', month: activeMonths[7].key, type: 'planR0' },
    73: { metric: 'milestone', month: activeMonths[7].key, type: 'planR1' },
    74: { metric: 'milestone', month: activeMonths[7].key, type: 'achievement' },
    75: { metric: 'milestone', month: activeMonths[8].key, type: 'planR0' },
    76: { metric: 'milestone', month: activeMonths[8].key, type: 'planR1' },
    77: { metric: 'milestone', month: activeMonths[8].key, type: 'achievement' },
    78: { metric: 'milestone', month: activeMonths[9].key, type: 'planR0' },
    79: { metric: 'milestone', month: activeMonths[9].key, type: 'planR1' },
    80: { metric: 'milestone', month: activeMonths[9].key, type: 'achievement' },
    81: { metric: 'milestone', month: activeMonths[10].key, type: 'planR0' },
    82: { metric: 'milestone', month: activeMonths[10].key, type: 'planR1' },
    83: { metric: 'milestone', month: activeMonths[10].key, type: 'achievement' },
    84: { metric: 'milestone', month: activeMonths[11].key, type: 'planR0' },
    85: { metric: 'milestone', month: activeMonths[11].key, type: 'planR1' },
    86: { metric: 'milestone', month: activeMonths[11].key, type: 'achievement' },

    // Residential Delivery (UR)
    95: { metric: 'ur', month: activeMonths[0].key, type: 'planR0' },
    96: { metric: 'ur', month: activeMonths[0].key, type: 'achievement' },
    97: { metric: 'ur', month: activeMonths[1].key, type: 'planR0' },
    98: { metric: 'ur', month: activeMonths[1].key, type: 'achievement' },
    99: { metric: 'ur', month: activeMonths[2].key, type: 'planR0' },
    100: { metric: 'ur', month: activeMonths[2].key, type: 'achievement' },
    101: { metric: 'ur', month: activeMonths[3].key, type: 'planR0' },
    102: { metric: 'ur', month: activeMonths[3].key, type: 'achievement' },
    103: { metric: 'ur', month: activeMonths[4].key, type: 'planR0' },
    104: { metric: 'ur', month: activeMonths[4].key, type: 'achievement' },
    105: { metric: 'ur', month: activeMonths[5].key, type: 'planR0' },
    106: { metric: 'ur', month: activeMonths[5].key, type: 'achievement' },
    107: { metric: 'ur', month: activeMonths[6].key, type: 'planR0' },
    108: { metric: 'ur', month: activeMonths[6].key, type: 'planR1' },
    109: { metric: 'ur', month: activeMonths[6].key, type: 'achievement' },
    110: { metric: 'ur', month: activeMonths[7].key, type: 'planR0' },
    111: { metric: 'ur', month: activeMonths[7].key, type: 'planR1' },
    112: { metric: 'ur', month: activeMonths[7].key, type: 'achievement' },
    113: { metric: 'ur', month: activeMonths[8].key, type: 'planR0' },
    114: { metric: 'ur', month: activeMonths[8].key, type: 'planR1' },
    115: { metric: 'ur', month: activeMonths[8].key, type: 'achievement' },
    116: { metric: 'ur', month: activeMonths[9].key, type: 'planR0' },
    117: { metric: 'ur', month: activeMonths[9].key, type: 'planR1' },
    118: { metric: 'ur', month: activeMonths[9].key, type: 'achievement' },
    119: { metric: 'ur', month: activeMonths[10].key, type: 'planR0' },
    120: { metric: 'ur', month: activeMonths[10].key, type: 'planR1' },
    121: { metric: 'ur', month: activeMonths[10].key, type: 'achievement' },
    122: { metric: 'ur', month: activeMonths[11].key, type: 'planR0' },
    123: { metric: 'ur', month: activeMonths[11].key, type: 'planR1' },
    124: { metric: 'ur', month: activeMonths[11].key, type: 'achievement' },

    // Commercial Delivery (UC)
    132: { metric: 'uc', month: activeMonths[0].key, type: 'planR0' },
    133: { metric: 'uc', month: activeMonths[0].key, type: 'achievement' },
    134: { metric: 'uc', month: activeMonths[1].key, type: 'planR0' },
    135: { metric: 'uc', month: activeMonths[1].key, type: 'achievement' },
    136: { metric: 'uc', month: activeMonths[2].key, type: 'planR0' },
    137: { metric: 'uc', month: activeMonths[2].key, type: 'achievement' },
    138: { metric: 'uc', month: activeMonths[3].key, type: 'planR0' },
    139: { metric: 'uc', month: activeMonths[3].key, type: 'achievement' },
    140: { metric: 'uc', month: activeMonths[4].key, type: 'planR0' },
    141: { metric: 'uc', month: activeMonths[4].key, type: 'achievement' },
    142: { metric: 'uc', month: activeMonths[5].key, type: 'planR0' },
    143: { metric: 'uc', month: activeMonths[5].key, type: 'achievement' },
    144: { metric: 'uc', month: activeMonths[6].key, type: 'planR0' },
    145: { metric: 'uc', month: activeMonths[6].key, type: 'planR1' },
    146: { metric: 'uc', month: activeMonths[6].key, type: 'achievement' },
    147: { metric: 'uc', month: activeMonths[7].key, type: 'planR0' },
    148: { metric: 'uc', month: activeMonths[7].key, type: 'planR1' },
    149: { metric: 'uc', month: activeMonths[7].key, type: 'achievement' },
    150: { metric: 'uc', month: activeMonths[8].key, type: 'planR0' },
    151: { metric: 'uc', month: activeMonths[8].key, type: 'planR1' },
    152: { metric: 'uc', month: activeMonths[8].key, type: 'achievement' },
    153: { metric: 'uc', month: activeMonths[9].key, type: 'planR0' },
    154: { metric: 'uc', month: activeMonths[9].key, type: 'planR1' },
    155: { metric: 'uc', month: activeMonths[9].key, type: 'achievement' },
    156: { metric: 'uc', month: activeMonths[10].key, type: 'planR0' },
    157: { metric: 'uc', month: activeMonths[10].key, type: 'planR1' },
    158: { metric: 'uc', month: activeMonths[10].key, type: 'achievement' },
    159: { metric: 'uc', month: activeMonths[11].key, type: 'planR0' },
    160: { metric: 'uc', month: activeMonths[11].key, type: 'planR1' },
    161: { metric: 'uc', month: activeMonths[11].key, type: 'achievement' },

    // Labour (H1: Apr-Sep with R0 Plan, Ach; H2: Oct-Mar with R0 Plan, R1 Plan, Ach) - Col HV (229) to Col IY (258)
    229: { metric: 'labour', month: activeMonths[0].key, type: 'planR0' },
    230: { metric: 'labour', month: activeMonths[0].key, type: 'achievement' },
    231: { metric: 'labour', month: activeMonths[1].key, type: 'planR0' },
    232: { metric: 'labour', month: activeMonths[1].key, type: 'achievement' },
    233: { metric: 'labour', month: activeMonths[2].key, type: 'planR0' },
    234: { metric: 'labour', month: activeMonths[2].key, type: 'achievement' },
    235: { metric: 'labour', month: activeMonths[3].key, type: 'planR0' },
    236: { metric: 'labour', month: activeMonths[3].key, type: 'achievement' },
    237: { metric: 'labour', month: activeMonths[4].key, type: 'planR0' },
    238: { metric: 'labour', month: activeMonths[4].key, type: 'achievement' },
    239: { metric: 'labour', month: activeMonths[5].key, type: 'planR0' },
    240: { metric: 'labour', month: activeMonths[5].key, type: 'achievement' },
    241: { metric: 'labour', month: activeMonths[6].key, type: 'planR0' },
    242: { metric: 'labour', month: activeMonths[6].key, type: 'planR1' },
    243: { metric: 'labour', month: activeMonths[6].key, type: 'achievement' },
    244: { metric: 'labour', month: activeMonths[7].key, type: 'planR0' },
    245: { metric: 'labour', month: activeMonths[7].key, type: 'planR1' },
    246: { metric: 'labour', month: activeMonths[7].key, type: 'achievement' },
    247: { metric: 'labour', month: activeMonths[8].key, type: 'planR0' },
    248: { metric: 'labour', month: activeMonths[8].key, type: 'planR1' },
    249: { metric: 'labour', month: activeMonths[8].key, type: 'achievement' },
    250: { metric: 'labour', month: activeMonths[9].key, type: 'planR0' },
    251: { metric: 'labour', month: activeMonths[9].key, type: 'planR1' },
    252: { metric: 'labour', month: activeMonths[9].key, type: 'achievement' },
    253: { metric: 'labour', month: activeMonths[10].key, type: 'planR0' },
    254: { metric: 'labour', month: activeMonths[10].key, type: 'planR1' },
    255: { metric: 'labour', month: activeMonths[10].key, type: 'achievement' },
    256: { metric: 'labour', month: activeMonths[11].key, type: 'planR0' },
    257: { metric: 'labour', month: activeMonths[11].key, type: 'planR1' },
    258: { metric: 'labour', month: activeMonths[11].key, type: 'achievement' },

    // SPI (12 Months Achievement only) - Columns 284 to 295
    284: { metric: 'spi', month: activeMonths[0].key, type: 'achievement' },
    285: { metric: 'spi', month: activeMonths[1].key, type: 'achievement' },
    286: { metric: 'spi', month: activeMonths[2].key, type: 'achievement' },
    287: { metric: 'spi', month: activeMonths[3].key, type: 'achievement' },
    288: { metric: 'spi', month: activeMonths[4].key, type: 'achievement' },
    289: { metric: 'spi', month: activeMonths[5].key, type: 'achievement' },
    290: { metric: 'spi', month: activeMonths[6].key, type: 'achievement' },
    291: { metric: 'spi', month: activeMonths[7].key, type: 'achievement' },
    292: { metric: 'spi', month: activeMonths[8].key, type: 'achievement' },
    293: { metric: 'spi', month: activeMonths[9].key, type: 'achievement' },
    294: { metric: 'spi', month: activeMonths[10].key, type: 'achievement' },
    295: { metric: 'spi', month: activeMonths[11].key, type: 'achievement' },

    // Quality Rating (12 Months Achievement only) - Columns 298 to 309
    298: { metric: 'quality', month: activeMonths[0].key, type: 'achievement' },
    299: { metric: 'quality', month: activeMonths[1].key, type: 'achievement' },
    300: { metric: 'quality', month: activeMonths[2].key, type: 'achievement' },
    301: { metric: 'quality', month: activeMonths[3].key, type: 'achievement' },
    302: { metric: 'quality', month: activeMonths[4].key, type: 'achievement' },
    303: { metric: 'quality', month: activeMonths[5].key, type: 'achievement' },
    304: { metric: 'quality', month: activeMonths[6].key, type: 'achievement' },
    305: { metric: 'quality', month: activeMonths[7].key, type: 'achievement' },
    306: { metric: 'quality', month: activeMonths[8].key, type: 'achievement' },
    307: { metric: 'quality', month: activeMonths[9].key, type: 'achievement' },
    308: { metric: 'quality', month: activeMonths[10].key, type: 'achievement' },
    309: { metric: 'quality', month: activeMonths[11].key, type: 'achievement' },

    // Safety Rating (12 Months Achievement only) - Columns 311 to 322
    311: { metric: 'safety', month: activeMonths[0].key, type: 'achievement' },
    312: { metric: 'safety', month: activeMonths[1].key, type: 'achievement' },
    313: { metric: 'safety', month: activeMonths[2].key, type: 'achievement' },
    314: { metric: 'safety', month: activeMonths[3].key, type: 'achievement' },
    315: { metric: 'safety', month: activeMonths[4].key, type: 'achievement' },
    316: { metric: 'safety', month: activeMonths[5].key, type: 'achievement' },
    317: { metric: 'safety', month: activeMonths[6].key, type: 'achievement' },
    318: { metric: 'safety', month: activeMonths[7].key, type: 'achievement' },
    319: { metric: 'safety', month: activeMonths[8].key, type: 'achievement' },
    320: { metric: 'safety', month: activeMonths[9].key, type: 'achievement' },
    321: { metric: 'safety', month: activeMonths[10].key, type: 'achievement' },
    322: { metric: 'safety', month: activeMonths[11].key, type: 'achievement' },

    // Avg QHSE Rating (12 Months Achievement only) - Columns 324 to 335
    324: { metric: 'qhse', month: activeMonths[0].key, type: 'achievement' },
    325: { metric: 'qhse', month: activeMonths[1].key, type: 'achievement' },
    326: { metric: 'qhse', month: activeMonths[2].key, type: 'achievement' },
    327: { metric: 'qhse', month: activeMonths[3].key, type: 'achievement' },
    328: { metric: 'qhse', month: activeMonths[4].key, type: 'achievement' },
    329: { metric: 'qhse', month: activeMonths[5].key, type: 'achievement' },
    330: { metric: 'qhse', month: activeMonths[6].key, type: 'achievement' },
    331: { metric: 'qhse', month: activeMonths[7].key, type: 'achievement' },
    332: { metric: 'qhse', month: activeMonths[8].key, type: 'achievement' },
    333: { metric: 'qhse', month: activeMonths[9].key, type: 'achievement' },
    334: { metric: 'qhse', month: activeMonths[10].key, type: 'achievement' },
    335: { metric: 'qhse', month: activeMonths[11].key, type: 'achievement' },

    // Proposed Finish Date (12 Months) - Columns 337 to 348 (LZ to MK)
    337: { metric: 'finish', month: activeMonths[0].key, type: 'achievement' },
    338: { metric: 'finish', month: activeMonths[1].key, type: 'achievement' },
    339: { metric: 'finish', month: activeMonths[2].key, type: 'achievement' },
    340: { metric: 'finish', month: activeMonths[3].key, type: 'achievement' },
    341: { metric: 'finish', month: activeMonths[4].key, type: 'achievement' },
    342: { metric: 'finish', month: activeMonths[5].key, type: 'achievement' },
    343: { metric: 'finish', month: activeMonths[6].key, type: 'achievement' },
    344: { metric: 'finish', month: activeMonths[7].key, type: 'achievement' },
    345: { metric: 'finish', month: activeMonths[8].key, type: 'achievement' },
    346: { metric: 'finish', month: activeMonths[9].key, type: 'achievement' },
    347: { metric: 'finish', month: activeMonths[10].key, type: 'achievement' },
    348: { metric: 'finish', month: activeMonths[11].key, type: 'achievement' }
  };
  
  // Basic metadata indexes
  let codeIndex = 1;
  let nameIndex = 2;
  let leaderIndex = 3; // Column D
  let vpIndex = 4;     // Column E
  let stageIndex = 5;  // Column F
  let areaIndex = 6;   // Column G
  let proposedFinishIndex = -1;
  let spiIndex = 6;    // Column G - SPI
  let qualityRatingIndex = 8; // Column I - Quality Rating
  let safetyRatingIndex = 9;  // Column J - Safety Rating
  let avgQhseRatingIndex = 10; // Column K - Avg QHSE Rating

  // Month regex matchers for auto-detecting months in header text
  const MONTH_MATCHERS: Array<{ shortName: string; regex: RegExp }> = [
    { shortName: 'Apr', regex: /\bapr|\bapril/i },
    { shortName: 'May', regex: /\bmay/i },
    { shortName: 'Jun', regex: /\bjun|\bjune/i },
    { shortName: 'Jul', regex: /\bjul|\bjuly/i },
    { shortName: 'Aug', regex: /\baug|\baugust/i },
    { shortName: 'Sep', regex: /\bsep|\bsept|\bseptember/i },
    { shortName: 'Oct', regex: /\boct|\boctober/i },
    { shortName: 'Nov', regex: /\bnov|\bnovember/i },
    { shortName: 'Dec', regex: /\bdec|\bdecember/i },
    { shortName: 'Jan', regex: /\bjan|\bjanuary/i },
    { shortName: 'Feb', regex: /\bfeb|\bfebruary/i },
    { shortName: 'Mar', regex: /\bmar|\bmarch/i },
  ];

  const fyMonths = activeMonths.map(m => {
    const matcher = MONTH_MATCHERS.find(mm => mm.shortName === m.shortName);
    return {
      ...m,
      regex: matcher ? matcher.regex : new RegExp(m.shortName, 'i')
    };
  });

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
    } else if (/proposed\s*finish|proposed\s*date|forecast\s*finish|target\s*date|\bproposed\b/i.test(val)) {
      proposedFinishIndex = idx;
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
      // Check for SPI, Quality, Safety, QHSE (12 achievement months in active FY)
      const monthObj = fyMonths.find(m => m.regex.test(fullText));
      if (monthObj) {
        let metric25: 'spi' | 'quality' | 'safety' | 'qhse' | 'finish' | null = null;
        if (/\bspi\b|schedule\s*performance\s*index|schedule\s*performance/i.test(fullText)) {
          metric25 = 'spi';
        } else if (/\bquality\b|\bqua\b/i.test(fullText)) {
          metric25 = 'quality';
        } else if (/\bsafety\b|\bsaf\b/i.test(fullText)) {
          metric25 = 'safety';
        } else if (/avg.*qhse|qhse|avg.*rating|rating/i.test(fullText)) {
          metric25 = 'qhse';
        } else if (/finish\s*date|proposed\s*finish/i.test(fullText)) {
          metric25 = 'finish';
        }

        if (metric25) {
          colMappings[idx] = {
            metric: metric25,
            month: monthObj.key,
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
    if (customMapping.proposedFinishIndex !== undefined && customMapping.proposedFinishIndex !== -1) proposedFinishIndex = customMapping.proposedFinishIndex;
    if (customMapping.qualityRatingIndex !== undefined && customMapping.qualityRatingIndex !== -1) qualityRatingIndex = customMapping.qualityRatingIndex;
    if (customMapping.safetyRatingIndex !== undefined && customMapping.safetyRatingIndex !== -1) safetyRatingIndex = customMapping.safetyRatingIndex;
    if (customMapping.avgQhseRatingIndex !== undefined && customMapping.avgQhseRatingIndex !== -1) avgQhseRatingIndex = customMapping.avgQhseRatingIndex;

    if (customMapping.metricOverrides) {
      Object.entries(customMapping.metricOverrides).forEach(([paramKey, colIdx]) => {
        const parts = paramKey.split('_');
        if (parts.length === 3) {
          const metric = parts[0] as 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc' | 'spi' | 'quality' | 'safety' | 'qhse' | 'finish';
          const shortMonth = parts[1];
          const type = parts[2] as 'planR0' | 'planR1' | 'achievement';

          // Match shortMonth (e.g. 'Nov' or 'Nov-26') to the actual fyMonths key
          const matchedMonthObj = fyMonths.find(m => 
            m.key === shortMonth || 
            m.key.toLowerCase().startsWith(shortMonth.toLowerCase()) || 
            m.regex.test(shortMonth)
          );
          const monthKey = matchedMonthObj ? matchedMonthObj.key : shortMonth;

          // Clear any existing colMapping mapped to this exact metric/month/type combo
          Object.keys(colMappings).forEach((idxStr) => {
            const idxVal = parseInt(idxStr, 10);
            const existing = colMappings[idxVal];
            if (existing && existing.metric === metric && existing.month === monthKey && existing.type === type) {
              delete colMappings[idxVal];
            }
          });

          // Set the new manual index override if valid
          if (colIdx !== undefined && colIdx !== -1) {
            colMappings[colIdx] = { metric, month: monthKey, type };
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
    const proposedFinish = getVal(proposedFinishIndex);

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
    const finishMap: { [month: string]: string } = {};

    fyMonths.forEach(m => {
      vowdMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      milestoneMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      labourMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      urMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      ucMap[m.key] = { month: m.key, plan: 0, planR0: 0, planR1: undefined, achievement: 0 };
      spiMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
      qualityMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
      safetyMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
      qhseMap[m.key] = { month: m.key, plan: 0, planR0: 0, achievement: 0 };
      finishMap[m.key] = '';
    });

    row.forEach((cell, idx) => {
      const mapping = colMappings[idx];
      if (!mapping) return;

      const rawCellStr = String(cell || '').trim();
      if (mapping.metric === 'finish') {
        if (rawCellStr && rawCellStr !== '-' && rawCellStr !== 'null' && rawCellStr !== 'undefined') {
          finishMap[mapping.month] = rawCellStr;
        }
        return;
      }

      const cellClean = rawCellStr.replace(/[$,%\s]/g, '');
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

    // Derive resolved proposed finish date (from meta column or latest non-empty month in finishMap)
    let finalProposedFinish = proposedFinish;
    if (!finalProposedFinish || finalProposedFinish === '-' || finalProposedFinish === 'N/A') {
      const activeNonEmpty = fyMonths.map(m => finishMap[m.key]).filter(Boolean);
      if (activeNonEmpty.length > 0) {
        finalProposedFinish = activeNonEmpty[activeNonEmpty.length - 1];
      }
    }

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
      proposedFinish: finalProposedFinish,
      proposedFinishHistory: fyMonths.map(m => ({ month: m.key, finishDate: finishMap[m.key] || '' })),
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

/**
 * Parses Software3 Google Sheet data for detailed Milestone Analysis & Bottleneck Diagnostics
 */
export function parseSoftware3Data(rows: string[][], projects: Project[] = []): Software3Milestone[] {
  if (!rows || rows.length < 3) return [];

  // Create lookup for VP and leader by project code / name
  const vpLookup = new Map<string, string>();
  const leaderLookup = new Map<string, string>();
  projects.forEach((p) => {
    if (p.code) {
      if (p.vp) vpLookup.set(p.code.trim().toLowerCase(), p.vp.trim());
      if (p.leader) leaderLookup.set(p.code.trim().toLowerCase(), p.leader.trim());
    }
    if (p.name) {
      if (p.vp) vpLookup.set(p.name.trim().toLowerCase(), p.vp.trim());
      if (p.leader) leaderLookup.set(p.name.trim().toLowerCase(), p.leader.trim());
    }
  });

  const list: Software3Milestone[] = [];
  let currentLeader = '';

  // Row 2 is headers (0-indexed row 1). Data starts at row 3 (0-indexed row 2) or row 4
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i] || [];
    const col0 = String(r[0] || '').trim();
    const col1 = String(r[1] || '').trim();
    const col2 = String(r[2] || '').trim();
    const col3 = String(r[3] || '').trim();
    const col4 = String(r[4] || '').trim();

    // Check if this is a section header (e.g. "SP Projects")
    if (col0 && (col0.toLowerCase().includes('projects') || col0.toLowerCase().includes('leader')) && !col4) {
      const matchLeader = col0.replace(/projects|leader/gi, '').trim();
      if (matchLeader) currentLeader = matchLeader;
      continue;
    }

    // Must have at least a milestone name
    if (!col4 && !col0) continue;
    if (col0.toLowerCase().includes('project id') || col4.toLowerCase().includes('milestone')) continue;

    const projectCode = col0;
    const projectName = col1 || projectCode;
    const building = col2;
    const leader = col3 || currentLeader || leaderLookup.get(projectCode.toLowerCase()) || leaderLookup.get(projectName.toLowerCase()) || '';
    const milestoneName = col4;

    // Milestone category
    let category = String(r[5] || '').trim();
    if (!category) {
      const nameLower = milestoneName.toLowerCase();
      if (nameLower.includes('(start)') || nameLower.includes(' start')) category = 'Start';
      else if (nameLower.includes('(50%)') || nameLower.includes(' 50%')) category = '50%';
      else if (nameLower.includes('(100%)') || nameLower.includes('(finish)') || nameLower.includes(' finish') || nameLower.includes(' 100%')) category = 'Finish';
      else category = 'General';
    }

    // Milestone status
    let status = String(r[6] || '').trim();
    if (!status) status = 'Not Done';
    else if (status.toLowerCase().includes('done') && !status.toLowerCase().includes('not')) status = 'Done';
    else status = 'Not Done';

    // Planned Week
    let plannedWeek = String(r[7] || '').trim().toUpperCase();
    if (plannedWeek && !plannedWeek.startsWith('W') && !isNaN(parseInt(plannedWeek))) {
      plannedWeek = `W${plannedWeek}`;
    }

    // Critical Flag (if this milestone will not be completed in current month)
    const criticalRaw = String(r[8] || '').trim();
    const isCritical = Boolean(
      criticalRaw && 
      (criticalRaw.toUpperCase() === 'C' || 
       criticalRaw.toUpperCase() === 'YES' || 
       criticalRaw.toUpperCase() === 'Y' || 
       criticalRaw.toUpperCase() === 'CRITICAL' ||
       criticalRaw.toUpperCase() === '1')
    );

    const reshuffle = String(r[9] || '').trim();
    const month = String(r[10] || '').trim(); // From which month this milestone is pending

    // 7 Core Milestone Pre-requisites / Reading Parameters
    const normalizeCheck = (val: any) => {
      const clean = String(val || '').trim();
      if (!clean) return 'Done'; // Defaults to neutral/done if unflagged in sheet
      if (clean.toLowerCase().includes('not') || clean.toLowerCase() === 'no' || clean.toLowerCase() === 'n' || clean.toLowerCase() === 'pending' || clean.toLowerCase() === 'p') {
        return 'Not Done';
      }
      if (clean.toLowerCase().includes('done') || clean.toLowerCase() === 'yes' || clean.toLowerCase() === 'y' || clean.toLowerCase() === 'ok') {
        return 'Done';
      }
      return clean;
    };

    const contractorApp = normalizeCheck(r[11]);
    const drawing = normalizeCheck(r[12]);
    const workFront = normalizeCheck(r[13]);
    const contractorMob = normalizeCheck(r[14]);
    const materialDelivery = normalizeCheck(r[15]);
    const labourAvailability = normalizeCheck(r[16]);
    const clientDecision = normalizeCheck(r[17]);

    const govtApproval = normalizeCheck(r[18]);
    const crm = normalizeCheck(r[19]);
    const other = normalizeCheck(r[20]);
    const remark = String(r[21] || '').trim();

    // VP lookup
    const vp = vpLookup.get(projectCode.toLowerCase()) || vpLookup.get(projectName.toLowerCase()) || '';

    // Collect failing constraints across all 10 site & technical enabling parameters
    const failingConstraints: string[] = [];
    if (contractorApp === 'Not Done') failingConstraints.push('Contractor App.');
    if (drawing === 'Not Done') failingConstraints.push('Drawing / GFC');
    if (workFront === 'Not Done') failingConstraints.push('Work Front Availability');
    if (contractorMob === 'Not Done') failingConstraints.push('Contractor Mob.');
    if (materialDelivery === 'Not Done') failingConstraints.push('Material Delivery');
    if (labourAvailability === 'Not Done') failingConstraints.push('Labour Availability');
    if (clientDecision === 'Not Done') failingConstraints.push('Client Decision');
    if (govtApproval === 'Not Done') failingConstraints.push('Govt Approval');
    if (crm === 'Not Done') failingConstraints.push('CRM');
    if (other === 'Not Done') failingConstraints.push('Other');

    // Primary Bottleneck
    let primaryBottleneck = failingConstraints.length > 0 ? failingConstraints[0] : (status === 'Done' ? 'None (Achieved)' : 'On-Site Execution');

    // Prescriptive line of action
    let actionRecommendation = 'Milestone on track for timely delivery.';
    if (status === 'Not Done') {
      if (workFront === 'Not Done') {
        actionRecommendation = 'Expedite preceding trade completion & clear civil work front.';
      } else if (drawing === 'Not Done') {
        actionRecommendation = 'Urgent release of GFC drawings from architectural/structural team.';
      } else if (materialDelivery === 'Not Done') {
        actionRecommendation = 'Expedite vendor procurement delivery & track material in-transit.';
      } else if (labourAvailability === 'Not Done') {
        actionRecommendation = 'Augment contractor manpower deployment & ensure attendance monitoring.';
      } else if (clientDecision === 'Not Done') {
        actionRecommendation = 'Escalate pending client/management decision for rate revision or approval.';
      } else if (contractorApp === 'Not Done') {
        actionRecommendation = 'Finalize contractor work order / appointment documentation.';
      } else if (contractorMob === 'Not Done') {
        actionRecommendation = 'Ensure contractor site mobilization, machinery, and setup on-site.';
      } else if (govtApproval === 'Not Done') {
        actionRecommendation = 'Follow up on statutory authority / municipal NOC and approvals.';
      } else if (crm === 'Not Done') {
        actionRecommendation = 'Coordinate customer relationship management (CRM) handover inspections.';
      } else if (other === 'Not Done') {
        actionRecommendation = 'Address specific operational bottleneck on site.';
      } else if (remark) {
        actionRecommendation = `Address site bottleneck: ${remark}`;
      } else {
        actionRecommendation = 'Accelerate on-site execution and track daily productivity.';
      }
    }

    list.push({
      id: `${projectCode}-${i}-${milestoneName.substring(0, 10).replace(/\s+/g, '')}`,
      projectCode,
      projectName,
      building,
      leader,
      vp,
      milestone: milestoneName,
      category,
      status,
      plannedWeek,
      isCritical,
      criticalRaw,
      reshuffle,
      month,
      contractorApp,
      drawing,
      workFront,
      contractorMob,
      materialDelivery,
      labourAvailability,
      clientDecision,
      govtApproval,
      crm,
      other,
      remark,
      failingConstraints,
      primaryBottleneck,
      actionRecommendation
    });
  }

  return list;
}


