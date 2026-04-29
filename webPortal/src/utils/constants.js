// src/utils/constants.js
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/github',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
    CSRF: '/api/csrf-token'
  },
  PROFILES: {
    LIST: '/api/profiles',
    DETAIL: (id) => `/api/profiles/${id}`,
    CREATE: '/api/profiles',
    UPDATE: (id) => `/api/profiles/${id}`,
    DELETE: (id) => `/api/profiles/${id}`,
    EXPORT: '/api/profiles/export'
  },
  SEARCH: {
    QUERY: '/api/search',
    SUGGESTIONS: '/api/search/suggestions'
  },
  ACCOUNT: {
    PROFILE: '/api/account/profile',
    CHANGE_PASSWORD: '/api/account/change-password',
    API_KEYS: '/api/account/api-keys',
    SESSIONS: '/api/account/sessions'
  },
  METRICS: {
    DASHBOARD: '/api/metrics/dashboard',
    ACTIVITIES: '/api/activities/recent'
  }
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
  VIEWER: 'viewer'
};

export const PROFILE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  LIMIT_OPTIONS: [10, 20, 50, 100]
};

export const STORAGE_KEYS = {
  THEME: 'portal-theme',
  RECENT_SEARCHES: 'recentSearches',
  USER_PREFERENCES: 'userPreferences'
};

export const WEBSOCKET_CHANNELS = {
  DASHBOARD: 'dashboard',
  PROFILES: 'profiles',
  NOTIFICATIONS: 'notifications'
};