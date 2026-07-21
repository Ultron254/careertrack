// Every path the frontend calls, in one place. Nothing else builds a URL.
// docs/api-contract.md documents each of these; keep the two in step.

const qs = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export const endpoints = {
  me: () => '/api/me',

  users: {
    list: () => '/api/users',
    get: (userId: string) => `/api/users/${userId}`,
  },

  departments: {
    list: () => '/api/departments',
  },

  directory: () => '/api/directory',

  cycles: {
    list: () => '/api/cycles',
  },

  goals: {
    list: (cycleId: string, ownerId?: string) => `/api/cycles/${cycleId}/goals${qs({ ownerId })}`,
    create: (cycleId: string) => `/api/cycles/${cycleId}/goals`,
    update: (goalId: string) => `/api/goals/${goalId}`,
    remove: (goalId: string) => `/api/goals/${goalId}`,
    submitAll: (cycleId: string) => `/api/cycles/${cycleId}/goals/submit`,
    comments: (goalId: string) => `/api/goals/${goalId}/comments`,
  },

  reviews: {
    queue: () => '/api/reviews/queue',
    decide: (goalId: string) => `/api/goals/${goalId}/decision`,
    bulk: () => '/api/reviews/bulk',
  },

  feedback: {
    requests: (box: 'inbox' | 'sent') => `/api/feedback/requests${qs({ box })}`,
    createRequests: () => '/api/feedback/requests',
    respond: (requestId: string) => `/api/feedback/requests/${requestId}/response`,
    received: () => '/api/feedback/received',
  },

  appraisals: {
    get: (cycleId: string, subjectId?: string) => `/api/cycles/${cycleId}/appraisal${qs({ subjectId })}`,
    save: (cycleId: string, subjectId?: string) => `/api/cycles/${cycleId}/appraisal${qs({ subjectId })}`,
    submit: (cycleId: string, subjectId?: string) =>
      `/api/cycles/${cycleId}/appraisal/submit${qs({ subjectId })}`,
  },

  evaluations: {
    year: (year: number) => `/api/evaluations/${year}`,
  },

  dashboard: () => '/api/dashboard',

  reports: {
    get: (scope: string, subjectId?: string) => `/api/reports${qs({ scope, subjectId })}`,
    export: () => '/api/reports/export',
    schedule: () => '/api/reports/schedule',
  },

  calendar: {
    events: (from: string, to: string) => `/api/calendar/events${qs({ from, to })}`,
    create: () => '/api/calendar/events',
  },

  notifications: {
    list: () => '/api/notifications',
    read: (notificationId: string) => `/api/notifications/${notificationId}/read`,
    readAll: () => '/api/notifications/read-all',
  },

  hrConfig: () => '/api/hr-config',
};
