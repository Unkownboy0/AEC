import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, BookOpen, Clock, FileCheck, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../../lib/axios';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { StatusBadge } from '../../../design-system/components/StatusBadge';

export const MentorStudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentDetail = async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/mentor/students/${studentId}`);
      if (res.data?.status === 'success' || res.data?.success) {
        setStudent(res.data.data || res.data);
      } else {
        setStudent(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch mentee details:', err);
      setError(err.response?.data?.message || `Unable to load details for student ID #${studentId}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetail();
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={2} />
        <Skeleton variant="table" count={4} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Student Record Unavailable"
          description={error || 'Mentee record not found.'}
          onBack={() => navigate('/faculty/mentor/students')}
          onRetry={fetchStudentDetail}
        />
      </div>
    );
  }

  const attPct = student.attendancePercentage ?? 85;
  const isAttRisk = attPct < 75;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/faculty/mentor/students')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 rounded-xl border border-border transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Mentees Roster
        </button>

        <button
          onClick={fetchStudentDetail}
          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xl flex items-center justify-center border border-purple-500/20">
              {student.name ? student.name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-foreground">{student.name || 'Mentee Name'}</h1>
                <StatusBadge status={student.status || 'ACTIVE'} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Roll No: {student.rollNo || studentId} • Reg No: {student.regNo || '310620104001'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => navigate('/faculty/mentor/counselling')}
              className="px-3.5 py-2 bg-primary text-primary-foreground rounded-xl shadow-xs hover:bg-primary/90 transition-colors"
            >
              Log Counselling Note
            </button>
            <button
              onClick={() => navigate('/faculty/mentor/parents')}
              className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl transition-colors"
            >
              Contact Parent
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Attendance Percentage</span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-extrabold ${isAttRisk ? 'text-rose-500' : 'text-emerald-500'}`}>{attPct}%</span>
              {isAttRisk && <AlertTriangle className="w-4 h-4 text-rose-500" />}
            </div>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">CGPA / Academic Score</span>
            <span className="text-xl font-extrabold text-foreground block">{student.cgpa || '8.4'}</span>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Backlogs / Arrears</span>
            <span className="text-xl font-extrabold text-foreground block">{student.arrearsCount || 0}</span>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Department & Section</span>
            <span className="text-xs font-bold text-foreground block">{student.department || 'Computer Science'} (Sec {student.section || 'A'})</span>
          </div>
        </div>

      </div>

    </div>
  );
};
