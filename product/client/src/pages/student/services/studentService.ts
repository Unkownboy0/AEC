import api from '../../../lib/axios';

export const StudentService = {
  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data?.data || res.data;
  },

  updateProfile: async (data: any) => {
    const res = await api.put('/users/profile', data);
    return res.data?.data || res.data;
  },

  getAttendance: async () => {
    const res = await api.get('/student/attendance');
    return res.data?.data || res.data;
  },

  getTimetable: async () => {
    const res = await api.get('/student/timetable');
    return res.data?.data || res.data;
  },

  getSyllabus: async () => {
    const res = await api.get('/student/syllabus');
    return res.data?.data || res.data;
  },

  getResults: async () => {
    const res = await api.get('/student/results');
    return res.data?.data || res.data;
  },

  getCirculars: async () => {
    const res = await api.get('/notifications/circulars');
    return res.data?.data || res.data;
  },

  getLeaveRequests: async () => {
    const res = await api.get('/workflows/requests');
    return res.data?.data || res.data;
  },

  createLeaveRequest: async (data: any) => {
    const res = await api.post('/workflows/requests', data);
    return res.data?.data || res.data;
  },

  getLibraryRecords: async () => {
    const res = await api.get('/student/library');
    return res.data?.data || res.data;
  },

  getPlacements: async () => {
    const res = await api.get('/student/placements');
    return res.data?.data || res.data;
  }
};
