import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudentService } from '../services/studentService';

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ['student', 'profile'],
    queryFn: StudentService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes stale
  });
};

export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: StudentService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
    }
  });
};

export const useStudentAttendance = () => {
  return useQuery({
    queryKey: ['student', 'attendance'],
    queryFn: StudentService.getAttendance,
    staleTime: 10 * 60 * 1000, // 10 minutes stale
  });
};

export const useStudentTimetable = () => {
  return useQuery({
    queryKey: ['student', 'timetable'],
    queryFn: StudentService.getTimetable,
    staleTime: 60 * 60 * 1000, // 1 hour stale
  });
};

export const useStudentSyllabus = () => {
  return useQuery({
    queryKey: ['student', 'syllabus'],
    queryFn: StudentService.getSyllabus,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours stale
  });
};

export const useStudentResults = () => {
  return useQuery({
    queryKey: ['student', 'results'],
    queryFn: StudentService.getResults,
    staleTime: 30 * 60 * 1000, // 30 minutes stale
  });
};

export const useStudentCirculars = () => {
  return useQuery({
    queryKey: ['student', 'circulars'],
    queryFn: StudentService.getCirculars,
    staleTime: 5 * 60 * 1000, // 5 minutes stale
  });
};

export const useStudentLeaveRequests = () => {
  return useQuery({
    queryKey: ['student', 'leaves'],
    queryFn: StudentService.getLeaveRequests,
    staleTime: 2 * 60 * 1000, // 2 minutes stale
  });
};

export const useStudentLibrary = () => {
  return useQuery({
    queryKey: ['student', 'library'],
    queryFn: StudentService.getLibraryRecords,
    staleTime: 15 * 60 * 1000, // 15 minutes stale
  });
};

export const useStudentPlacements = () => {
  return useQuery({
    queryKey: ['student', 'placements'],
    queryFn: StudentService.getPlacements,
    staleTime: 10 * 60 * 1000, // 10 minutes stale
  });
};
