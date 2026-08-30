/**
 * Custom order definitions as requested for VP & Leader dropdown/selector ordering:
 * - VP filter sequence: KM, K-PK, K-KD, K-AS
 * - Leader filter sequence: SP, VB, MP, KM, GK, SD, K-PK, K-SS, K-AS, K-VK, K-ZK
 */

export const CUSTOM_VP_ORDER = ['KM', 'K-PK', 'K-KD', 'K-AS'];

export const CUSTOM_LEADER_ORDER = [
  'SP', 'VB', 'MP', 'KM', 'GK', 'SD', 'K-PK', 'K-SS', 'K-AS', 'K-VK', 'K-ZK'
];

/**
 * Returns a rank number for a given VP name. Lower rank comes first.
 */
export function getVpRank(vpName: string): number {
  if (!vpName) return 999;
  const clean = vpName.trim().toUpperCase();

  // 1. Exact match
  for (let i = 0; i < CUSTOM_VP_ORDER.length; i++) {
    const target = CUSTOM_VP_ORDER[i].toUpperCase();
    if (clean === target) {
      return i;
    }
  }

  // 2. Delimited prefix/suffix match
  for (let i = 0; i < CUSTOM_VP_ORDER.length; i++) {
    const target = CUSTOM_VP_ORDER[i].toUpperCase();
    if (
      clean.startsWith(target + ' ') ||
      clean.startsWith(target + '-') ||
      clean.startsWith(target + ':') ||
      clean.startsWith(target + '/') ||
      clean.startsWith(target + '(') ||
      clean.endsWith(' ' + target) ||
      clean.endsWith('-' + target) ||
      clean.endsWith('/' + target) ||
      clean.endsWith('(' + target + ')')
    ) {
      return i;
    }
  }

  // 3. Delimited word match
  for (let i = 0; i < CUSTOM_VP_ORDER.length; i++) {
    const target = CUSTOM_VP_ORDER[i].toUpperCase();
    if (
      clean.includes(' ' + target + ' ') ||
      clean.includes('(' + target + ')') ||
      clean.includes('[' + target + ']') ||
      clean.includes(target)
    ) {
      return i;
    }
  }

  return 99;
}

/**
 * Sort function for array of VP strings
 */
export function sortVpNames(vpA: string, vpB: string): number {
  const rankA = getVpRank(vpA);
  const rankB = getVpRank(vpB);
  if (rankA !== rankB) return rankA - rankB;
  return vpA.localeCompare(vpB);
}

/**
 * Returns a rank number for a given Leader name and optional VP name. Lower rank comes first.
 */
export function getLeaderRank(leaderName: string, vpName?: string): number {
  if (!leaderName) return 999;
  const cleanLeader = leaderName.trim().toUpperCase();

  // 1. Exact match
  for (let i = 0; i < CUSTOM_LEADER_ORDER.length; i++) {
    const code = CUSTOM_LEADER_ORDER[i].toUpperCase();
    if (cleanLeader === code) {
      return i;
    }
  }

  // 2. Delimited prefix/suffix match
  for (let i = 0; i < CUSTOM_LEADER_ORDER.length; i++) {
    const code = CUSTOM_LEADER_ORDER[i].toUpperCase();
    if (
      cleanLeader.startsWith(code + ' ') ||
      cleanLeader.startsWith(code + '-') ||
      cleanLeader.startsWith(code + ':') ||
      cleanLeader.startsWith(code + '/') ||
      cleanLeader.startsWith(code + '(') ||
      cleanLeader.endsWith(' ' + code) ||
      cleanLeader.endsWith('-' + code) ||
      cleanLeader.endsWith('/' + code) ||
      cleanLeader.endsWith('(' + code + ')')
    ) {
      return i;
    }
  }

  // 3. Delimited word match
  for (let i = 0; i < CUSTOM_LEADER_ORDER.length; i++) {
    const code = CUSTOM_LEADER_ORDER[i].toUpperCase();
    if (
      cleanLeader.includes(' ' + code + ' ') ||
      cleanLeader.includes('(' + code + ')') ||
      cleanLeader.includes('[' + code + ']') ||
      cleanLeader.includes(code)
    ) {
      return i;
    }
  }

  // Fallback rank based on VP rank if provided
  const vpRank = getVpRank(vpName || '');
  return 100 + vpRank * 20;
}

/**
 * Sort function for leader objects with name & vpName properties
 */
export function sortLeaderItems<T extends { name: string; vpName?: string }>(a: T, b: T): number {
  const rankA = getLeaderRank(a.name, a.vpName);
  const rankB = getLeaderRank(b.name, b.vpName);
  if (rankA !== rankB) return rankA - rankB;
  return a.name.localeCompare(b.name);
}

/**
 * Sort function for simple leader string names
 */
export function sortLeaderNames(a: string, b: string): number {
  const rankA = getLeaderRank(a);
  const rankB = getLeaderRank(b);
  if (rankA !== rankB) return rankA - rankB;
  return a.localeCompare(b);
}

/**
 * Helper function to identify if a project stage is complete, Complete-old, or lost.
 * Returns true for stages like "Complete", "Completed", "Complete-old", "Complete - Old", "Complete_old", "Lost", "Lost project", etc.
 * Returns false for active stages like "Nearing Completion", "Execution", "Ongoing", "Handover", "On Hold", etc.
 */
export function isCompleteOrLostStage(stageStr?: string): boolean {
  if (!stageStr) return false;
  const s = stageStr.trim().toLowerCase();

  // Early check: Nearing completion is an active stage, not a completed/lost project
  if (s.includes('nearing completion') || s.includes('nearing_completion') || s.includes('nearing-completion')) {
    return false;
  }

  return (
    s === 'complete' ||
    s === 'completed' ||
    s === 'lost' ||
    s.startsWith('complete') ||
    s.includes('complete-old') ||
    s.includes('complete - old') ||
    s.includes('complete_old') ||
    s.includes('complete – old') ||
    s.includes('lost')
  );
}

/**
 * Helper to parse SPI as a valid number or return null for blank/NA/invalid.
 */
export function parseSpiNumeric(spiStr?: string): number | null {
  if (!spiStr) return null;
  const s = String(spiStr).trim();
  if (s === '' || s === '-' || s.toUpperCase() === 'N/A' || s.toUpperCase() === 'NA') {
    return null;
  }
  const parsed = parseFloat(s);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Returns stage rank order for projects with blank or NA SPI:
 * 1. Handover stage
 * 2. Construction Start stage
 * 3. Excavation Stage
 * 4. Design Stage
 * 5. Upcoming stage
 * 6. Hold stage
 */
export function getStageRankForBlankSpi(stageStr?: string): number {
  if (!stageStr) return 99;
  const s = stageStr.trim().toLowerCase();

  // 1. Handover stage
  if (s.includes('handover') || s.includes('hand_over')) {
    return 1;
  }
  // 2. Construction Start stage
  if (
    s.includes('construction start') ||
    s.includes('construction_start') ||
    s.includes('construction-start') ||
    s === 'construction start' ||
    s === 'start'
  ) {
    return 2;
  }
  if (
    s.includes('ongoing') ||
    s.includes('on going') ||
    s.includes('finishing') ||
    s.includes('nearing completion') ||
    s.includes('execution')
  ) {
    return 2.5;
  }
  // 3. Excavation Stage
  if (s.includes('excavation')) {
    return 3;
  }
  // 4. Design Stage
  if (s.includes('design') || s.includes('engineering')) {
    return 4;
  }
  // 5. Upcoming stage
  if (s.includes('upcoming') || s.includes('requirement')) {
    return 5;
  }
  // 6. Hold stage
  if (s.includes('hold') || s.includes('on hold')) {
    return 6;
  }

  return 99;
}

/**
 * Helper to identify if a project ID/code starts with 'temp' (case-insensitive, e.g. 'temp', 'TEMP', 'Temp-123', 'TEMP_ABC').
 * If true, this project must not be counted in any stage, project count, area, or budget.
 */
export function isTempProject(code?: string): boolean {
  if (!code) return false;
  return code.trim().toLowerCase().startsWith('temp');
}
