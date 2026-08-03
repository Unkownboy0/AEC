import React, { useState } from 'react';
import {
  Calendar, CheckSquare, ClipboardList, Clock, AlertCircle,
  FileText, CheckCircle2, UserCheck, MessageSquare, Plus, Bell, RefreshCw
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';

import { useAuth } from '../../context/AuthContext';

interface IQACExecutivePortalProps {
  user?: any;
}

export const IQACExecutivePortal: React.FC<IQACExecutivePortalProps> = ({ user: propUser }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [activeTab, setActiveTab] = useState<'audits' | 'checklist' | 'atr' | 'meetings'>('audits');

  const [audits, setAudits] = useState([
    { id: 'AUD-01', dept: 'Computer Science & Engineering', date: 'Today, 10:30 AM', auditor: (user?.firstName || 'Auditor') + ' ' + (user?.lastName || ''), status: 'IN_PROGRESS', checklistProgress: '8 / 12 Checked' },
    { id: 'AUD-02', dept: 'Electrical & Electronics Engineering', date: 'Tomorrow, 02:00 PM', auditor: (user?.firstName || 'Auditor') + ' ' + (user?.lastName || ''), status: 'SCHEDULED', checklistProgress: '0 / 12 Checked' },
    { id: 'AUD-03', dept: 'Civil Engineering', date: '2026-07-25', auditor: (user?.firstName || 'Auditor') + ' ' + (user?.lastName || ''), status: 'COMPLETED', checklistProgress: '12 / 12 Checked' },
  ]);

  const [checklist, setChecklist] = useState([
    { id: '1', item: 'Course File & Lesson Plan Alignment (CO-PO Mapping)', checked: true },
    { id: '2', item: 'Laboratory Register & Equipment Maintenance Logs', checked: true },
    { id: '3', item: 'Continuous Internal Assessment (CIA) Answer Script Evaluation', checked: true },
    { id: '4', item: 'Faculty Research Publications & Citation Evidence', checked: false },
    { id: '5', item: 'Student Feedback & Action Taken Report (ATR)', checked: false },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
    toast.success('Checklist item updated');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border bg-card p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-900/10 via-emerald-900/5 to-background border-teal-500/20">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-teal-600" />
            <h1 className="text-xl font-black tracking-tight">IQAC Executive Officer Workspace</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Internal Audits · Checklist Auditing · Department Inspections · Action Taken Reports (ATR)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border text-xs font-bold">
          {(['audits', 'checklist', 'atr', 'meetings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                activeTab === tab ? 'bg-background shadow text-teal-600 font-black' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Today's Audits</span>
          <span className="text-xl font-black block text-teal-600">1 Department Visit</span>
          <span className="text-[9px] text-muted-foreground">CSE Dept Inspection</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pending Audits</span>
          <span className="text-xl font-black block text-amber-600">3 Departments</span>
          <span className="text-[9px] text-muted-foreground">Scheduled this week</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Action Taken Reports (ATR)</span>
          <span className="text-xl font-black block text-indigo-600">92% Resolved</span>
          <span className="text-[9px] text-muted-foreground">Compliance Verification</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">IQAC Meetings</span>
          <span className="text-xl font-black block text-purple-600">Quarterly Review #3</span>
          <span className="text-[9px] text-muted-foreground">Friday at 11:00 AM</span>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'audits' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-extrabold uppercase">Department Audit Assignments</h3>
            <button onClick={() => toast.success('New Audit Visit Scheduled')} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Schedule New Audit
            </button>
          </div>
          <div className="space-y-3">
            {audits.map(a => (
              <div key={a.id} className="p-4 border rounded-xl bg-background flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-primary">{a.id}</span>
                    <h4 className="font-extrabold text-foreground text-xs">{a.dept}</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Scheduled: {a.date} · Auditor: {a.auditor}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-muted px-2.5 py-1 rounded-md">{a.checklistProgress}</span>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md border ${
                    a.status === 'IN_PROGRESS' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    a.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {a.status}
                  </span>
                  <button onClick={() => toast.success(`Opened Observation Sheet for ${a.id}`)} className="px-3 py-1.5 border hover:bg-muted rounded-lg text-[10px] font-bold">
                    Audit Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-extrabold uppercase border-b pb-2">Academic Audit Standard Verification Checklist</h3>
          <div className="space-y-2">
            {checklist.map(c => (
              <div key={c.id} onClick={() => toggleChecklist(c.id)} className="p-3 border rounded-xl bg-background flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={c.checked} onChange={() => {}} className="h-4 w-4 text-teal-600 rounded" />
                  <span className={c.checked ? 'line-through text-muted-foreground' : 'text-foreground'}>{c.item}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${c.checked ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {c.checked ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
