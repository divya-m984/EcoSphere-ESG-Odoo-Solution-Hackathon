export const APP_NAME = 'EcoSphere';
export const SIDEBAR_WIDTH = 240;
export const APP_BAR_HEIGHT = 64;

export const ROUTES = {
  LOGIN:          '/login',
  DASHBOARD:      '/dashboard',
  ENVIRONMENTAL:  '/environmental',
  SOCIAL:         '/social',
  GOVERNANCE:     '/governance',
  GAMIFICATION:   '/gamification',
  LEADERBOARD:    '/leaderboard',
  REWARDS:        '/gamification/rewards',
  ADMIN_REWARDS:  '/gamification/rewards/manage',
  REPORTS:        '/reports',
  ADMINISTRATION: '/administration',
  PROFILE:        '/profile',
  SETTINGS:       '/settings',
} as const;

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard':      'Dashboard',
  '/environmental':  'Environmental',
  '/social':         'Social',
  '/governance':     'Governance',
  '/gamification':   'Gamification',
  '/leaderboard':    'Leaderboard',
  '/reports':        'Reports',
  '/administration': 'Administration',
  '/profile':        'Profile',
  '/settings':       'Settings',
};

export const STORAGE_KEYS = {
  USER: 'ecosphere_user',
} as const;
