export const ENDPOINTS = {
  auth: {
    me: '/auth/me',
    login: '/auth/login',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    refresh: '/auth/refresh',
    changePassword: '/auth/change-password',
    switchWorkspace: '/auth/switch-workspace',
  },
  rbac: {
    me: '/rbac/me',
    stream: (userId: string) => `/rbac/stream?userId=${encodeURIComponent(userId)}`,
    users: (id: string) => `/rbac/users/${id}`,
  },
  dashboard: {
    stats: '/dashboard/stats',
    charts: '/dashboard/charts',
  },
  workflows: {
    requests: '/workflows/requests',
    action: (id: string) => `/workflows/requests/${id}/action`,
    cancel: (id: string) => `/workflows/requests/${id}/cancel`,
  },
  circulars: {
    list: '/circulars',
    detail: (id: string) => `/circulars/${id}`,
    markRead: (id: string) => `/circulars/${id}/read`,
  },
  timetables: {
    slots: '/timetables/slots',
    aiGenerate: '/timetables/ai-generate',
  },
  assignments: {
    list: '/assignments',
    submit: (id: string) => `/assignments/${id}/submit`,
  },
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },
  files: {
    upload: '/files/upload',
  },
  reports: {
    export: (type: string, format: string) => `/reports/export?type=${encodeURIComponent(type)}&format=${encodeURIComponent(format)}`,
  },
  ai: {
    chat: '/ai/chat',
    history: '/ai/history',
  },
} as const;
