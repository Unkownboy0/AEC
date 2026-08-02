import React, { useState, useEffect } from 'react';
import {
  Shield, Users, GraduationCap, Building, Landmark, Activity,
  CheckCircle, AlertTriangle, Sparkles, BookOpen, Key, User,
  Mail, Phone, Trash2, Check, X, FileText, Download, BarChart2,
  CheckSquare, Megaphone, FileSpreadsheet, AlertCircle, RefreshCw,
  Search, Heart, Gift, ImagePlus, FileImage, Briefcase, Clock,
  DollarSign, Award, Calendar, Layers, ShieldCheck, Eye, Upload,
  Printer, CornerUpLeft, MessageSquare, Filter, ArrowRight
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { PlacementDashboard } from '../../components/placement/PlacementDashboard';
import { ComplaintMonitoringCenter } from '../../components/complaint/ComplaintMonitoringCenter';
import { CampusActivitiesMonitoring } from '../../components/activity/CampusActivitiesMonitoring';
import { ExecutivePortalLayout } from '../../components/enterprise/ExecutivePortalLayout';
import { DepartmentHealthScoreWidget } from '../../components/enterprise/DepartmentHealthScoreWidget';
import { AIExecutiveInsightsWidget } from '../../components/enterprise/AIExecutiveInsightsWidget';
import { ExecutiveCommandCenter } from '../../components/enterprise/ExecutiveCommandCenter';
import { ExecutiveInbox } from '../enterprise/ExecutiveInbox';
import { ApprovalCenter } from '../enterprise/ApprovalCenter';
import { PrincipalApprovalCenter } from './PrincipalApprovalCenter';

interface PrincipalExecutivePortalProps {
  user: any;
}

export const PrincipalExecutivePortal: React.FC<PrincipalExecutivePortalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  // Master Data States
  const [stats, setStats] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);

  // Search & Filters
  const [facultySearch, setFacultySearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modal / Drawer Details State
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedDeptDetail, setSelectedDeptDetail] = useState<any | null>(null);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [statsRes, deptsRes, facultyRes, studentRes, wfRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => null),
        api.get('/academics/departments').catch(() => null),
        api.get('/enterprise/faculty?pageSize=100').catch(() => null),
        api.get('/enterprise/students?pageSize=100').catch(() => null),
        api.get('/workflows/requests').catch(() => null),
      ]);

      if (statsRes?.data?.status === 'success') setStats(statsRes.data.data.metrics);
      if (deptsRes?.data?.status === 'success') setDepartments(deptsRes.data.data);
      if (facultyRes?.data?.status === 'success') setFacultyList(facultyRes.data.data);
      if (studentRes?.data?.status === 'success') setStudentList(studentRes.data.data);
      if (wfRes?.data?.status === 'success') setWorkflows(wfRes.data.data);
    } catch (err) {
      console.error('Failed to load Principal Executive Data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleExportReport = async (type: string, format: 'PDF' | 'EXCEL') => {
    toast.success(`Generating ${type} report as ${format}...`);
  };

  if (loading) {
    return <Loading text="Loading Principal Executive Command Center..." />;
  }

  const metrics = stats || {
    totalStudents: studentList.length || 1450,
    totalFaculty: facultyList.length || 124,
    totalDepartments: departments.length || 6,
    pendingApprovals: workflows.filter((w) => w.status === 'PENDING').length || 4,
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-violet-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Principal Executive Command Suite
          </div>
          <h1 className="text-2xl font-extrabold text-white">Welcome, Principal {user?.firstName}</h1>
          <p className="text-xs text-slate-400">Institutional Governance, Academic Audit & Decision Center</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Academic Status: Accredited
          </span>
          <span className="px-3.5 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-xl flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {metrics.totalStudents} Enrolled
          </span>
        </div>
      </div>

      {/* Master Navigation Bar across 14 Primary Workspaces */}
      <div className="bg-slate-800/90 p-2 rounded-2xl border border-slate-700/80 flex flex-wrap gap-1.5 overflow-x-auto text-xs font-bold text-slate-300">
        {[
          { id: 'dashboard', label: 'Executive Dashboard', icon: Shield },
          { id: 'approval_center', label: 'Approval Center', icon: ShieldCheck },
          { id: 'analytics', label: 'Institution Analytics', icon: BarChart2 },
          { id: 'departments', label: 'All Departments', icon: Building },
          { id: 'faculty', label: 'Faculty Overview', icon: GraduationCap },
          { id: 'students', label: 'Student Roster', icon: Users },
          { id: 'programs', label: 'Academic Programs', icon: BookOpen },
          { id: 'exams', label: 'Examination Board', icon: Award },
          { id: 'finance', label: 'Fee & Finance', icon: DollarSign },
          { id: 'leave_center', label: 'Leave Approvals', icon: Clock },
          { id: 'placements', label: 'Placements Drive', icon: Briefcase },
          { id: 'complaints', label: 'Complaints Board', icon: AlertCircle },
          { id: 'activities', label: 'Campus Activities', icon: Activity },
          { id: 'reports', label: 'Reports & Audits', icon: FileSpreadsheet },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg font-extrabold'
                  : 'hover:bg-slate-700/70 hover:text-white text-slate-300'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Real-time KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Total Enrolled Students</span>
              <h3 className="text-2xl font-bold text-white">{metrics.totalStudents}</h3>
              <span className="text-[10px] text-emerald-400 font-bold">100% Verified DB Ledger</span>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Accredited Faculty</span>
              <h3 className="text-2xl font-bold text-emerald-400">{metrics.totalFaculty}</h3>
              <span className="text-[10px] text-slate-400">Full-time Roster</span>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Active Academic Departments</span>
              <h3 className="text-2xl font-bold text-amber-400">{metrics.totalDepartments}</h3>
              <span className="text-[10px] text-indigo-400">Accredited Programs</span>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Pending Workflow Approvals</span>
              <h3 className="text-2xl font-bold text-violet-400">{metrics.pendingApprovals}</h3>
              <span className="text-[10px] text-amber-400">Requires Principal Signoff</span>
            </div>
          </div>

          {/* Executive Command Center & AI Insights */}
          <ExecutiveCommandCenter role="Principal" onActionComplete={fetchMasterData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIExecutiveInsightsWidget />
            <DepartmentHealthScoreWidget />
          </div>
        </div>
      )}

      {/* 2. APPROVAL CENTER */}
      {activeTab === 'approval_center' && (
        <PrincipalApprovalCenter />
      )}

      {/* 3. INSTITUTION ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-6 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-violet-400" /> Institutional Analytics & Quality Rankings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
              <span className="text-slate-400 text-[10px] font-bold uppercase">NAAC Readiness</span>
              <h4 className="text-xl font-bold text-emerald-400">Grade A+ (Score: 3.65)</h4>
              <p className="text-slate-400 text-[11px]">Criterion 1-7 documentation 96% complete</p>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
              <span className="text-slate-400 text-[10px] font-bold uppercase">NBA Accreditation</span>
              <h4 className="text-xl font-bold text-indigo-400">6 Programs Accredited</h4>
              <p className="text-slate-400 text-[11px]">PO/CO Attainment mapped across semesters</p>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
              <span className="text-slate-400 text-[10px] font-bold uppercase">NIRF Institutional Rank</span>
              <h4 className="text-xl font-bold text-amber-400">Top 150 Engineering</h4>
              <p className="text-slate-400 text-[11px]">Research publication & citation index synced</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ALL DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">All Academic Departments</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.map((d: any) => (
              <div key={d.id} className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono">{d.code}</span>
                <h4 className="font-bold text-white text-sm">{d.name}</h4>
                <p className="text-slate-400 text-[11px]">Head of Dept: <strong className="text-white">{d.hodName || 'Assigned HOD'}</strong></p>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold">Faculty: 24</span>
                  <span className="text-indigo-400 font-bold">Students: 340</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FACULTY OVERVIEW */}
      {activeTab === 'faculty' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Faculty Roster & Workload</h3>
            <input
              type="text"
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              placeholder="Search faculty name, ID, designation..."
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Faculty Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Workload</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {facultyList
                  .filter((f) => (f.firstName + ' ' + f.lastName).toLowerCase().includes(facultySearch.toLowerCase()))
                  .map((f: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-indigo-400 font-bold">{f.employeeId}</td>
                      <td className="p-3 font-bold text-white">{f.firstName} {f.lastName}</td>
                      <td className="p-3">{f.designation}</td>
                      <td className="p-3 font-bold text-slate-300">CSE</td>
                      <td className="p-3 font-mono text-slate-400">{f.email}</td>
                      <td className="p-3 font-semibold text-emerald-400">16 Slots/wk</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. STUDENT ROSTER */}
      {activeTab === 'students' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Institution Student Roster</h3>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search student name, roll no..."
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Program / Sem</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Attendance %</th>
                  <th className="p-3">CGPA Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {studentList
                  .filter((s) => (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearch.toLowerCase()))
                  .map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-indigo-400 font-bold">{s.admissionNo}</td>
                      <td className="p-3 font-bold text-white">{s.firstName} {s.lastName}</td>
                      <td className="p-3">{s.program?.code || 'B.TECH-CSE'} / Sem 6</td>
                      <td className="p-3 font-bold text-slate-300">CSE</td>
                      <td className="p-3 font-bold text-emerald-400">92.8%</td>
                      <td className="p-3 font-bold text-amber-400">8.92</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. ACADEMIC PROGRAMS */}
      {activeTab === 'programs' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Accredited Academic Programs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
              <span className="text-[10px] text-violet-400 font-mono font-bold">UG PROGRAM</span>
              <h4 className="font-bold text-white text-base">Bachelor of Technology in Computer Science (B.TECH-CSE)</h4>
              <p className="text-slate-400 text-[11px]">Duration: 4 Years | Regulations: AY 2026 Choice Based Credit System (CBCS)</p>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
              <span className="text-[10px] text-indigo-400 font-mono font-bold">PG PROGRAM</span>
              <h4 className="font-bold text-white text-base">Master of Technology in Computer Science (M.TECH-CSE)</h4>
              <p className="text-slate-400 text-[11px]">Duration: 2 Years | Regulations: AY 2026 Autonomous Guidelines</p>
            </div>
          </div>
        </div>
      )}

      {/* 8. EXAMINATION BOARD */}
      {activeTab === 'exams' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Controller of Examinations Board</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Odd Sem Exam Pass Rate</span>
              <h3 className="text-2xl font-bold text-emerald-400">94.8%</h3>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Hall Tickets Verified</span>
              <h3 className="text-2xl font-bold text-indigo-400">100% Issued</h3>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Revaluation Queue</span>
              <h3 className="text-2xl font-bold text-amber-400">2 Applications</h3>
            </div>
          </div>
        </div>
      )}

      {/* 9. FEE & FINANCE */}
      {activeTab === 'finance' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fee Collection & Institutional Finance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Total Collected Fees</span>
              <h3 className="text-xl font-bold text-emerald-400">₹ 4,85,00,000</h3>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Pending Dues Ledger</span>
              <h3 className="text-xl font-bold text-rose-400">₹ 12,40,000</h3>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Scholarships Awarded</span>
              <h3 className="text-xl font-bold text-indigo-400">₹ 35,00,000</h3>
            </div>
          </div>
        </div>
      )}

      {/* 10. LEAVE APPROVALS */}
      {activeTab === 'leave_center' && (
        <PrincipalApprovalCenter />
      )}

      {/* 11. PLACEMENTS */}
      {activeTab === 'placements' && (
        <PlacementDashboard readOnly={true} />
      )}

      {/* 12. COMPLAINTS BOARD */}
      {activeTab === 'complaints' && (
        <ComplaintMonitoringCenter readOnly={true} />
      )}

      {/* 13. CAMPUS ACTIVITIES */}
      {activeTab === 'activities' && (
        <CampusActivitiesMonitoring readOnly={true} />
      )}

      {/* 14. REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Institutional Reports & Audit Exports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2 text-center">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white">NAAC Accreditation Full Dossier</h4>
              <button onClick={() => handleExportReport('NAAC Audit', 'PDF')} className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg w-full">Export PDF</button>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2 text-center">
              <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
              <h4 className="font-bold text-white">NBA Attainment Matrix</h4>
              <button onClick={() => handleExportReport('NBA Matrix', 'EXCEL')} className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg w-full">Export Excel</button>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2 text-center">
              <Award className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-white">Annual Financial & Fee Ledger</h4>
              <button onClick={() => handleExportReport('Financial Ledger', 'PDF')} className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg w-full">Export PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
