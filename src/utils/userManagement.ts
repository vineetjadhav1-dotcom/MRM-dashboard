import { ActiveTab, AppUser, UserManagementSettings, UserPermissions, Project, Software2Project } from '../types';
import { db, ensureFirebaseAuth } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export const ALL_NAV_TABS: ActiveTab[] = [
  'projectDashboard',
  'leader',
  'leaderboard',
  'milestones',
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
    id: 'milestones',
    label: 'Milestone Analysis',
    category: 'Core Execution',
    description: 'Detailed milestone categories, weekly planning, bottlenecks & enabler readings'
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
      'leader'
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

export async function saveUserManagementSettings(settings: UserManagementSettings): Promise<boolean> {
  try {
    localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('planedge-user-settings-changed', { detail: settings }));
  } catch (e) {
    console.error('Error saving user management settings locally:', e);
  }

  // Persist to Cloud Firestore across all devices and platforms
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'system_settings', 'user_management'), settings, { merge: true });
    console.log('User management settings successfully synchronized to Cloud Firestore.');
    return true;
  } catch (e) {
    console.warn('Firestore cloud sync notice:', e);
    return false;
  }
}

/**
 * Subscribe to cloud user management changes so permissions stay synchronized across all devices
 */
export function subscribeUserManagementSettings(
  callback: (settings: UserManagementSettings) => void
): () => void {
  let isSubscribed = true;

  // 1. Immediate and re-trying fetch from Cloud Firestore so newly opened devices/mobiles get latest settings instantly
  const syncFromCloud = async () => {
    try {
      await ensureFirebaseAuth();
      const snapshot = await getDoc(doc(db, 'system_settings', 'user_management'));
      if (snapshot.exists() && isSubscribed) {
        const cloudData = snapshot.data() as UserManagementSettings;
        if (cloudData && Array.isArray(cloudData.users) && cloudData.userPermissions) {
          const mergedUsers = [...cloudData.users];
          DEFAULT_USERS.forEach(defU => {
            if (!mergedUsers.some(u => u.username.toLowerCase() === defU.username.toLowerCase())) {
              mergedUsers.push(defU);
            }
          });
          const mergedSettings: UserManagementSettings = {
            users: mergedUsers,
            userPermissions: { ...DEFAULT_USER_PERMISSIONS, ...cloudData.userPermissions }
          };
          localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(mergedSettings));
          callback(mergedSettings);
        }
      }
    } catch (err) {
      console.warn('Initial Firestore user management fetch notice:', err);
    }
  };

  syncFromCloud();

  // Retry sync after a short delay to account for network / Firebase auth handshake on fresh mobile/desktop loads
  const retryTimer = setTimeout(() => {
    if (isSubscribed) syncFromCloud();
  }, 2000);

  // 2. Real-time snapshot listener for instant cross-device updates
  let unsubFirestore: () => void = () => {};
  try {
    unsubFirestore = onSnapshot(
      doc(db, 'system_settings', 'user_management'),
      (snapshot) => {
        if (snapshot.exists() && isSubscribed) {
          const cloudData = snapshot.data() as UserManagementSettings;
          if (cloudData && Array.isArray(cloudData.users) && cloudData.userPermissions) {
            const mergedUsers = [...cloudData.users];
            DEFAULT_USERS.forEach(defU => {
              if (!mergedUsers.some(u => u.username.toLowerCase() === defU.username.toLowerCase())) {
                mergedUsers.push(defU);
              }
            });
            const mergedSettings: UserManagementSettings = {
              users: mergedUsers,
              userPermissions: { ...DEFAULT_USER_PERMISSIONS, ...cloudData.userPermissions }
            };
            localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(mergedSettings));
            callback(mergedSettings);
          }
        }
      },
      (error) => {
        console.warn('Firestore user management subscription notice:', error);
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to cloud user management:', e);
  }

  return () => {
    isSubscribed = false;
    clearTimeout(retryTimer);
    unsubFirestore();
  };
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
      allowedNavTabs: ['projectDashboard', 'leader'],
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
          : ['projectDashboard', 'leader'],
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

  // Default restricted permissions for standard users if not explicitly configured in settings
  const defaultFallback = DEFAULT_USER_PERMISSIONS[user.username.toLowerCase()] || {
    allowedNavTabs: ['projectDashboard', 'leader'],
    showSourceSheet: true,
    canSyncSheet: true,
    canExportReport: true,
    canEditConfig: false,
    canChangeFiscalYear: true,
    allowedVPs: ['all'],
    allowedLeaders: ['all'],
    allowedProjectCodes: ['all']
  };

  return defaultFallback;
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
