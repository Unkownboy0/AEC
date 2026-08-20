/*
  CAMPUSOS QUERY INVALIDATION MAP — Maps backend realtime events to React Query keys
  
  Prevents duplicate entries by enforcing query refetching by backend entity ID.
*/

export const eventToQueryKeyMap: Record<string, string[][]> = {
  'DEPARTMENT_AVAILABILITY_UPDATED': [['hod', 'availability'], ['hod-dashboard-summary']],
  // Attendance events
  'attendance:marked': [['attendance'], ['student', 'attendance'], ['hod', 'availability']],
  'attendance:updated': [['attendance'], ['student', 'attendance'], ['hod', 'availability']],

  // Leave & OD events
  'leave:created': [['leave'], ['approvals'], ['hod', 'availability'], ['student', 'leave']],
  'leave:approved': [['leave'], ['approvals'], ['hod', 'availability'], ['student', 'leave']],
  'leave:rejected': [['leave'], ['approvals'], ['hod', 'availability'], ['student', 'leave']],
  'od:created': [['od'], ['approvals'], ['hod', 'availability'], ['student', 'od']],
  'od:approved': [['od'], ['approvals'], ['hod', 'availability'], ['student', 'od']],
  'od:rejected': [['od'], ['approvals'], ['hod', 'availability'], ['student', 'od']],

  // Task events
  'task:created': [['tasks'], ['faculty', 'tasks'], ['hod', 'tasks']],
  'task:updated': [['tasks'], ['faculty', 'tasks'], ['hod', 'tasks']],
  'task:completed': [['tasks'], ['faculty', 'tasks'], ['hod', 'tasks']],

  // Circular events
  'circular:published': [['circulars'], ['student', 'circulars'], ['faculty', 'circulars']],

  // Messages & Notifications
  'message:sent': [['messages'], ['unread-counts']],
  'notification:sent': [['notifications'], ['unread-counts']],
  'notification:read': [['notifications'], ['unread-counts']],

  // Delegation
  'delegation:updated': [['delegation'], ['vp', 'dashboard'], ['principal', 'dashboard']],
};
