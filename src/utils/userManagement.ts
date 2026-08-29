import { ActiveTab, AppUser, UserManagementSettings, UserPermissions, Project, Software2Project } from '../types';

export const ALL_NAV_TABS: ActiveTab[] = [
  'projectDashboard',
  'leader',
  'leaderboard',
  'insights',
  'vp',
  'all',
  'overview',
  'userAccess'
];

export interface NavTabMeta {
  id: ActiveTab;
  label: string;
  category: string;
  description: string;
}

export const NAV_TABS_META: NavTabMeta[] = [
  {
    id: 'projectDashboard',
    label: 'Project Dashboard',
    category: 'Core Execution',
    description: 'Milestones, SPI, QHSE ratings & Monthly Plan vs Actuals'
  },
  {
    id: 'leader',
    label: 'MRM Dashboard',
    category: 'Executive Review',
    description: 'Leader portfolio breakdown & interactive review slide deck'
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    category: 'Executive Review',
    description: 'Executive benchmarking, project scores & tier rankings'
  },
  {
    id: 'insights',
    label: 'Key Insights & Forecast',
    category: 'Analytics & Strategy',
    description: 'Multi-parameter forecasting, delay analytics & 3-layer drilldown'
  },
  {
    id: 'vp',
    label: 'VP Portfolios',
    category: 'Portfolio & Records',
    description: 'VP-level project rollups, regional performance & distribution'
  },
  {
    id: 'all',
    label: 'Projects Registry',
    category: 'Portfolio & Records',
    description: 'Master searchable registry of all project data & statuses'
  },
  {
    id: 'overview',
    label: 'Data Configuration',
    category: 'System & Administration',
    description: 'Column mapping, header rows & spreadsheet source parameters'
  },
  {
    id: 'userAccess',
    label: 'User Access',
    category: 'System & Administration',
    description: 'Manage user accounts, roles, navigation tabs & portfolio access'
  }
];

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'admin',
    username: 'admin',
    password: '12345',
    displayName: 'Admin User',
    role: 'admin',
    avatarBg: '#6366f1', // Indigo
    createdAt: '2026-08-28'
  },
  {
    id: 'planedge',
    username: 'planedge',
    password: '123',
    displayName: 'Planedge Team',
    role: 'user',
    avatarBg: '#0284c7', // Sky Blue
    createdAt: '2026-08-28'
  }
];

export const DEFAULT_USER_PERMISSIONS: Record<string, UserPermissions> = {
  planedge: {
    allowedNavTabs: [
      'projectDashboard',
      'leader',
      'leaderboard',
      'insights',
      'vp',
      'all',
      'overview'
    ],
    showSourceSheet: true,
    canSyncSheet: true,
    canExportReport: true,
    canEditConfig: false,
    canChangeFiscalYear: true,
    allowedVPs: ['all'],
    allowedLeaders: ['all'],
    allowedProjectCodes: ['all']
  }
};

const USER_SESSION_KEY = 'planedge_current_auth_user_v2';
const USER_PERMISSIONS_KEY = 'planedge_user_management_settings_v2';

export function getStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AppUser | null): void {
  if (!user) {
    localStorage.removeItem(USER_SESSION_KEY);
  } else {
    // Avoid persisting raw password in active session
    const sessionUser: AppUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatarBg: user.avatarBg,
      createdAt: user.createdAt
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionUser));
  }
}

export function getUserManagementSettings(): UserManagementSettings {
  try {
    const raw = localStorage.getItem(USER_PERMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && parsed.userPermissions) {
        // Ensure default users exist
        const mergedUsers = [...parsed.users];
        DEFAULT_USERS.forEach(defU => {
          if (!mergedUsers.some(u => u.username.toLowerCase() === defU.username.toLowerCase())) {
            mergedUsers.push(defU);
          }
        });
        return {
          users: mergedUsers,
          userPermissions: { ...DEFAULT_USER_PERMISSIONS, ...parsed.userPermissions }
        };
      }
    }
  } catch (e) {
    console.error('Error reading user management settings:', e);
  }

  return {
    users: [...DEFAULT_USERS],
    userPermissions: { ...DEFAULT_USER_PERMISSIONS }
  };
}

export function saveUserManagementSettings(settings: UserManagementSettings): void {
  try {
    localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving user management settings:', e);
  }
}

export function authenticateUser(usernameInput: string, passwordInput: string): AppUser | null {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  const settings = getUserManagementSettings();
  const matched = settings.users.find(
    u => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
  );

  if (!matched) return null;

  return {
    id: matched.id,
    username: matched.username,
    displayName: matched.displayName,
    role: matched.role,
    avatarBg: matched.avatarBg || '#6366f1',
    createdAt: matched.createdAt
  };
}

export function getUserEffectivePermissions(
  user: AppUser | null,
  settings: UserManagementSettings
): UserPermissions {
  if (!user) {
    return {
      allowedNavTabs: ALL_NAV_TABS.filter(t => t !== 'userAccess'),
      showSourceSheet: true,
      canSyncSheet: true,
      canExportReport: true,
      canEditConfig: false,
      canChangeFiscalYear: true,
      allowedVPs: ['all'],
      allowedLeaders: ['all'],
      allowedProjectCodes: ['all']
    };
  }

  // Admin always has full access to everything including User Access
  if (user.role === 'admin') {
    return {
      allowedNavTabs: [...ALL_NAV_TABS],
      showSourceSheet: true,
      canSyncSheet: true,
      canExportReport: true,
      canEditConfig: true,
      canChangeFiscalYear: true,
      allowedVPs: ['all'],
      allowedLeaders: ['all'],
      allowedProjectCodes: ['all']
    };
  }

  // Find user-specific permissions for standard users
  const userPerms = settings.userPermissions[user.username.toLowerCase()];
  if (userPerms) {
    return {
      allowedNavTabs:
        userPerms.allowedNavTabs && userPerms.allowedNavTabs.length > 0
          ? userPerms.allowedNavTabs
          : ['projectDashboard'],
      showSourceSheet: userPerms.showSourceSheet !== undefined ? userPerms.showSourceSheet : true,
      canSyncSheet: userPerms.canSyncSheet !== undefined ? userPerms.canSyncSheet : true,
      canExportReport: userPerms.canExportReport !== undefined ? userPerms.canExportReport : true,
      canEditConfig: userPerms.canEditConfig !== undefined ? userPerms.canEditConfig : false,
      canChangeFiscalYear: userPerms.canChangeFiscalYear !== undefined ? userPerms.canChangeFiscalYear : true,
      allowedVPs: userPerms.allowedVPs || ['all'],
      allowedLeaders: userPerms.allowedLeaders || ['all'],
      allowedProjectCodes: userPerms.allowedProjectCodes || ['all']
    };
  }

  // Default permissions
  return {
    allowedNavTabs: ALL_NAV_TABS.filter(t => t !== 'userAccess'),
    showSourceSheet: true,
    canSyncSheet: true,
    canExportReport: true,
    canEditConfig: false,
    canChangeFiscalYear: true,
    allowedVPs: ['all'],
    allowedLeaders: ['all'],
    allowedProjectCodes: ['all']
  };
}

/**
 * Filter projects based on user permissions (VP, Leader, Project Code scoping)
 */
export function filterProjectsByPermissions(
  projects: Project[],
  permissions: UserPermissions
): Project[] {
  const allowedVPs = permissions.allowedVPs || ['all'];
  const allowedLeaders = permissions.allowedLeaders || ['all'];
  const allowedProjectCodes = permissions.allowedProjectCodes || ['all'];

  const hasVPRestriction = allowedVPs.length > 0 && !allowedVPs.includes('all');
  const hasLeaderRestriction = allowedLeaders.length > 0 && !allowedLeaders.includes('all');
  const hasProjectRestriction = allowedProjectCodes.length > 0 && !allowedProjectCodes.includes('all');

  // If no scoping restrictions, return all projects
  if (!hasVPRestriction && !hasLeaderRestriction && !hasProjectRestriction) {
    return projects;
  }

  return projects.filter(project => {
    // 1. VP filter
    if (hasVPRestriction) {
      const projVP = project.vp ? project.vp.trim() : '';
      if (!allowedVPs.includes(projVP)) {
        return false;
      }
    }

    // 2. Leader filter
    if (hasLeaderRestriction) {
      const projLeader = project.leader ? project.leader.trim() : '';
      if (!allowedLeaders.includes(projLeader)) {
        return false;
      }
    }

    // 3. Project code filter
    if (hasProjectRestriction) {
      const projCode = project.code ? project.code.trim() : '';
      if (!allowedProjectCodes.includes(projCode)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filter software 2 projects based on user permissions
 */
export function filterSoftware2ProjectsByPermissions(
  projects: Software2Project[],
  permissions: UserPermissions
): Software2Project[] {
  const allowedVPs = permissions.allowedVPs || ['all'];
  const allowedLeaders = permissions.allowedLeaders || ['all'];
  const allowedProjectCodes = permissions.allowedProjectCodes || ['all'];

  const hasVPRestriction = allowedVPs.length > 0 && !allowedVPs.includes('all');
  const hasLeaderRestriction = allowedLeaders.length > 0 && !allowedLeaders.includes('all');
  const hasProjectRestriction = allowedProjectCodes.length > 0 && !allowedProjectCodes.includes('all');

  if (!hasVPRestriction && !hasLeaderRestriction && !hasProjectRestriction) {
    return projects;
  }

  return projects.filter(project => {
    // 1. VP filter
    if (hasVPRestriction) {
      const projVP = project.vp ? project.vp.trim() : '';
      if (!allowedVPs.includes(projVP)) {
        return false;
      }
    }

    // 2. Leader filter
    if (hasLeaderRestriction) {
      const projLeader = project.leader ? project.leader.trim() : '';
      if (!allowedLeaders.includes(projLeader)) {
        return false;
      }
    }

    // 3. Project code filter
    if (hasProjectRestriction) {
      const projCode = project.code ? project.code.trim() : '';
      if (!allowedProjectCodes.includes(projCode)) {
        return false;
      }
    }

    return true;
  });
}
