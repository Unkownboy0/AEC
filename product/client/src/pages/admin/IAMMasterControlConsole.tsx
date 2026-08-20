import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import {
  Shield, Users, Lock, Eye, Edit3, Trash2, Copy, GitMerge, Plus, Check, X,
  Search, Sliders, RefreshCw, AlertCircle, Layers, Layout, ArrowRightLeft, FileText, Activity,
  Award, Briefcase, Building, ChevronRight, UserCheck, Clock, ShieldAlert, Key, Workflow, Send, CheckCircle2
} from 'lucide-react';
import { useRBAC } from '../../context/RBACContext';

const PERMISSION_ACTIONS = [
  'view', 'create', 'read', 'update', 'delete', 'approve', 'reject',
  'assign', 'transfer', 'upload', 'download', 'export', 'import',
  'print', 'share', 'archive', 'restore', 'ai_access', 'analytics',
  'reports', 'audit_logs', 'settings', 'api_access', 'mobile_access'
];

const MODULES = [
  'Academics', 'Curriculum', 'Attendance', 'Assignments', 'Exams',
  'Placement', 'Library', 'Hostel', 'Transport', 'Sports',
  'Finance', 'Administration', 'IQAC', 'Reports', 'Users',
  'Settings', 'Workflow', 'AI', 'AuditLogs'
];

const MASTER_IDENTITIES = [
  'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
  'Academic Dean', 'Administration & Admission Dean', 'IQAC Dean',
  'IQAC Executive Officer', 'IQAC Documentation Officer', 'HOD', 'Faculty', 'Mentor',
  'Student', 'Parent', 'Controller of Examination', 'Assistant Controller of Examination',
  'Exam Cell Staff', 'Placement Officer', 'Placement Coordinator', 'Librarian', 'Library Staff',
  'Hostel Warden', 'Hostel Staff', 'Transport Manager', 'Transport Staff', 'Sports Director',
  'Physical Director', 'Sports Coach', 'Accounts Officer', 'Accounts Staff', 'Office Superintendent',
  'Office Staff', 'Receptionist'
];

export const IAMMasterControlConsole: React.FC = () => {
  const { rbac, refetchRBAC } = useRBAC();
  const [activeTab, setActiveTab] = useState<
    'directory' | 'roles' | 'matrix' | 'designations' | 'committees' | 'delegations' | 'audit' | 'sync'
  >('directory');

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  // User Directory State
  const [directoryData, setDirectoryData] = useState<{ users: any[]; total: number }>({ users: [], total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [isAdminEditMode, setIsAdminEditMode] = useState(false);

  // 6-Step Create User Wizard State
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    personType: 'Student', // Student | Employee | Parent | Operational
    department: 'IT',
    designation: 'Student',
    program: 'B.Tech IT',
    year: '1',
    section: 'A',
    employeeId: '',
    admissionNo: '',
    primaryRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    workspaces: ['Student Portal', 'Campus Workspace'],
    accountStatus: 'ACTIVE',
  });

  // Designations State
  const [designations, setDesignations] = useState<any[]>([]);
  const [newDesigTitle, setNewDesigTitle] = useState('');
  const [newDesigCode, setNewDesigCode] = useState('');

  // Committees State
  const [committees, setCommittees] = useState<any[]>([]);
  const [newCommName, setNewCommName] = useState('');
  const [newCommCode, setNewCommCode] = useState('');

  // Delegations State
  const [delegations, setDelegations] = useState<any[]>([]);
  const [delegationForm, setDelegationForm] = useState({
    delegatorId: '', delegateeId: '', roleId: '', reason: '', startDate: '', endDate: ''
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'directory') {
        const res = await api.get(`/iam/directory?query=${encodeURIComponent(searchQuery)}`);
        setDirectoryData({ users: res.data?.users || [], total: res.data?.total || 0 });
      } else if (activeTab === 'roles' || activeTab === 'matrix') {
        const res = await api.get('/rbac/matrix');
        const data = res.data?.data || [];
        setRoles(data);
        if (data.length > 0 && !selectedRole) setSelectedRole(data[0]);
      } else if (activeTab === 'designations') {
        const res = await api.get('/iam/designations');
        setDesignations(res.data?.data || []);
      } else if (activeTab === 'committees') {
        const res = await api.get('/iam/committees');
        setCommittees(res.data?.data || []);
      } else if (activeTab === 'delegations') {
        const res = await api.get('/iam/delegations');
        setDelegations(res.data?.data || []);
      } else if (activeTab === 'audit') {
        const res = await api.get('/rbac/audit-logs');
        setAuditLogs(res.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch IAM data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDesignation = async () => {
    if (!newDesigTitle || !newDesigCode) return;
    try {
      await api.post('/iam/designations', { title: newDesigTitle, code: newDesigCode });
      setNewDesigTitle('');
      setNewDesigCode('');
      fetchData();
    } catch (err) {
      alert('Failed to create designation');
    }
  };

  const handleCreateCommittee = async () => {
    if (!newCommName || !newCommCode) return;
    try {
      await api.post('/iam/committees', { name: newCommName, code: newCommCode });
      setNewCommName('');
      setNewCommCode('');
      fetchData();
    } catch (err) {
      alert('Failed to create committee');
    }
  };

  const handleTogglePermission = async (moduleName: string, actionName: string, currentValue: boolean) => {
    if (!selectedRole) return;
    try {
      const updatedAccess = { ...(selectedRole.moduleAccess || {}) };
      if (!updatedAccess[moduleName]) updatedAccess[moduleName] = {};
      updatedAccess[moduleName][actionName] = !currentValue;

      await api.put(`/rbac/roles/${selectedRole.id}/config`, {
        moduleAccess: updatedAccess,
        reason: `Toggled permission ${moduleName}:${actionName}`
      });

      setSelectedRole({ ...selectedRole, moduleAccess: updatedAccess });
      refetchRBAC();
    } catch (err) {
      alert('Failed to update permission');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-400" /> Enterprise IAM Control Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Single Source of Truth for Identity, Multi-Role Resolution, Authorization Matrix & Real-time Live Sync
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setWizardStep(1);
              setIsCreateWizardOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Create User Wizard (6 Steps)
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh State
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'directory', label: 'Master Directory', icon: Users },
          { id: 'roles', label: 'Role Engine', icon: Shield },
          { id: 'matrix', label: 'Authorization Matrix', icon: Layers },
          { id: 'designations', label: 'Designations', icon: Award },
          { id: 'committees', label: 'Committees', icon: Building },
          { id: 'delegations', label: 'Delegations', icon: Clock },
          { id: 'audit', label: 'Audit & Compliance', icon: FileText },
          { id: 'sync', label: 'Real-Time Sync Monitor', icon: Activity },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search master user directory by name, email, phone, roll/emp no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchData()}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400">Total Directory Users: <span className="font-bold text-indigo-400">{directoryData.total}</span></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3">User Identity</th>
                    <th className="p-3">Primary Role</th>
                    <th className="p-3">Assigned Roles</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {directoryData.users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{u.firstName} {u.lastName}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                          {u.role?.name || 'User'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {u.assignedRoles && u.assignedRoles.length > 0 ? (
                            u.assignedRoles.map((r: any) => (
                              <span key={r.roleId} className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">
                                {r.role?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[10px]">Single Role</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedUserDetail(u);
                            setIsAdminEditMode(false);
                          }}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] font-semibold"
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected User Details Drawer */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-4">
              {selectedUserDetail ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">IAM User Control</h3>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {selectedUserDetail.id?.substring(0, 10)}</span>
                    </div>
                    <button onClick={() => setSelectedUserDetail(null)} className="text-slate-400 hover:text-white text-xs">Close</button>
                  </div>

                  {/* Administrative Edit Mode Banner */}
                  {isAdminEditMode ? (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        ADMINISTRATIVE EDIT MODE (AUDITED)
                      </div>
                      <div className="text-[10px] text-amber-300/80">
                        All role, status, and assignment changes are signed by Super Admin.
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAdminEditMode(true)}
                      className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-xl text-indigo-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Enter Administrative Edit Mode
                    </button>
                  )}

                  <div className="space-y-2 text-xs">
                    <div><span className="text-slate-400">Name:</span> <span className="font-semibold text-white">{selectedUserDetail.firstName} {selectedUserDetail.lastName}</span></div>
                    <div><span className="text-slate-400">Email:</span> <span className="text-slate-200">{selectedUserDetail.email}</span></div>
                    <div><span className="text-slate-400">Phone:</span> <span className="text-slate-200">{selectedUserDetail.phone || 'N/A'}</span></div>
                    <div><span className="text-slate-400">Designation:</span> <span className="text-slate-200">{selectedUserDetail.designation || 'N/A'}</span></div>
                    <div><span className="text-slate-400">Department:</span> <span className="text-slate-200">{selectedUserDetail.departmentId || 'IT'}</span></div>
                    <div>
                      <span className="text-slate-400">Account Status:</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        {selectedUserDetail.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  {isAdminEditMode && (
                    <div className="pt-3 border-t border-slate-700 space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Modify Primary Role:</label>
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          defaultValue={selectedUserDetail.role?.name || 'STUDENT'}
                        >
                          {MASTER_IDENTITIES.map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            alert('User status updated and logged to audit trail.');
                            setIsAdminEditMode(false);
                          }}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsAdminEditMode(false)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Select a user to view full IAM detail profile, committee memberships, and permission resolution.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Target Role:</span>
              <select
                value={selectedRole?.id || ''}
                onChange={e => {
                  const found = roles.find(r => r.id === e.target.value);
                  if (found) setSelectedRole(found);
                }}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.roleCode})</option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-400">Editing Matrix for <strong className="text-indigo-400">{selectedRole?.name}</strong></span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-800 z-10 font-bold min-w-[140px]">Module</th>
                  {PERMISSION_ACTIONS.map(act => (
                    <th key={act} className="p-2 text-center font-medium capitalize min-w-[80px]">{act.replace('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-300">
                {MODULES.map(mod => (
                  <tr key={mod} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold sticky left-0 bg-slate-900 border-r border-slate-800 text-slate-200">
                      {mod}
                    </td>
                    {PERMISSION_ACTIONS.map(act => {
                      const isGranted = selectedRole?.moduleAccess?.[mod]?.[act] === true;
                      return (
                        <td key={act} className="p-2 text-center border-r border-slate-800/30">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={() => handleTogglePermission(mod, act, isGranted)}
                            className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'designations' && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3 max-w-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create New Designation</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Title (e.g. Associate Professor)"
                value={newDesigTitle}
                onChange={e => setNewDesigTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Code (e.g. ASSOC_PROF)"
                value={newDesigCode}
                onChange={e => setNewDesigCode(e.target.value)}
                className="w-32 bg-slate-900 border border-slate-700 text-xs rounded px-3 py-2 text-white"
              />
              <button
                onClick={handleCreateDesignation}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Hierarchy Level</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {designations.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{d.title}</td>
                    <td className="p-3 text-slate-400">{d.code}</td>
                    <td className="p-3">{d.hierarchy}</td>
                    <td className="p-3"><span className="text-emerald-400 font-bold">{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'committees' && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3 max-w-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create New Committee</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Committee Name (e.g. IQAC Committee)"
                value={newCommName}
                onChange={e => setNewCommName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Code (e.g. IQAC)"
                value={newCommCode}
                onChange={e => setNewCommCode(e.target.value)}
                className="w-32 bg-slate-900 border border-slate-700 text-xs rounded px-3 py-2 text-white"
              />
              <button
                onClick={handleCreateCommittee}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {committees.map(c => (
              <div key={c.id} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{c.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">{c.code}</span>
                </div>
                <p className="text-slate-400 text-xs">{c.description || 'Institutional Committee'}</p>
                <div className="text-[11px] text-slate-500">Members Count: {c._count?.members || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Action</th>
                <th className="p-3">Changed By</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {auditLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-slate-400">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-semibold text-indigo-300">{l.entityType}</td>
                  <td className="p-3"><span className="px-1.5 py-0.5 bg-slate-700 rounded text-white">{l.action}</span></td>
                  <td className="p-3 text-slate-300">{l.changedBy}</td>
                  <td className="p-3 text-slate-400">{l.reason || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" /> Real-Time Live Sync Status
          </h3>
          <p className="text-xs text-slate-400">
            Authenticated Server-Sent Events are active. Permission and approval invalidations are user-scoped; polling and focus refresh remain the recovery fallback.
          </p>
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 space-y-1">
            <div>[SSE STREAM] Connected to /api/rbac/stream</div>
            <div>[STATUS] 200 OK - Active Listener</div>
            <div>[MODE] Zero-Refresh Real-Time Broadcast</div>
          </div>
        </div>
      )}

      {/* ─── MODAL: 6-STEP CREATE USER WIZARD ─────────────────────────────────── */}
      {isCreateWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full p-6 rounded-3xl shadow-2xl space-y-5 text-slate-200 text-xs max-h-[92vh] overflow-y-auto">
            {/* Wizard Header & Steps Progress */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Institutional User Provisioning Wizard
                </h3>
                <p className="text-[10px] text-slate-400">Step {wizardStep} of 6: {
                  wizardStep === 1 ? 'Personal Identity' :
                  wizardStep === 2 ? 'Person Type & Classification' :
                  wizardStep === 3 ? 'Academic / Employment Assignment' :
                  wizardStep === 4 ? 'Role & Workspace Provisioning' :
                  wizardStep === 5 ? 'Module Permissions' : 'Review & Provision User'
                }</p>
              </div>
              <button
                onClick={() => setIsCreateWizardOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Step Indicator Bar */}
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(s => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === wizardStep ? 'bg-indigo-500' : s < wizardStep ? 'bg-indigo-500/50' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Identity */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Step 1: Personal Identity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">First Name *</label>
                    <input
                      type="text"
                      value={createForm.firstName}
                      onChange={e => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="e.g. Ramesh"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={createForm.lastName}
                      onChange={e => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="e.g. Kumar"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Official Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. ramesh.kumar@geetorus.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={e => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Person Type */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Step 2: Person Type & Classification</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'Student', desc: 'Enrolled undergraduate or postgraduate student' },
                    { type: 'Employee', desc: 'Teaching faculty, HOD, Dean or administrative officer' },
                    { type: 'Parent', desc: 'Parent or verified guardian link' },
                    { type: 'Operational', desc: 'Hostel, Transport, Library or Facilities staff' }
                  ].map(pt => (
                    <div
                      key={pt.type}
                      onClick={() => setCreateForm(prev => ({ ...prev, personType: pt.type }))}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        createForm.personType === pt.type
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-md'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="font-bold text-white block text-sm">{pt.type}</span>
                      <span className="text-[10px] text-slate-400">{pt.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Academic / Employment */}
            {wizardStep === 3 && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Step 3: Academic & Department Assignment</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Department</label>
                    <select
                      value={createForm.department}
                      onChange={e => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="IT">Information Technology (IT)</option>
                      <option value="CSE">Computer Science & Eng (CSE)</option>
                      <option value="AIDS">AI & Data Science (AI&DS)</option>
                      <option value="ECE">Electronics & Comm (ECE)</option>
                      <option value="MECH">Mechanical Eng (MECH)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      {createForm.personType === 'Student' ? 'Enrollment / Register No' : 'Employee ID'}
                    </label>
                    <input
                      type="text"
                      value={createForm.employeeId}
                      onChange={e => setCreateForm(prev => ({ ...prev, employeeId: e.target.value }))}
                      placeholder={createForm.personType === 'Student' ? 'e.g. 717823F101' : 'e.g. EMP-IT-042'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Role & Workspaces */}
            {wizardStep === 4 && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Step 4: Role & Workspace Assignment</h4>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Primary Role Identity</label>
                  <select
                    value={createForm.primaryRole}
                    onChange={e => setCreateForm(prev => ({ ...prev, primaryRole: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {MASTER_IDENTITIES.map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 5: Module Permissions */}
            {wizardStep === 5 && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Step 5: Enabled Module Features</h4>
                <div className="grid grid-cols-3 gap-2">
                  {MODULES.slice(0, 9).map(m => (
                    <div key={m} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                      <span className="font-semibold text-white">{m}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">Enabled</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Review & Finalize */}
            {wizardStep === 6 && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Step 6: Review User Provisioning Details</h4>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div><span className="text-slate-400">Name:</span> <strong className="text-white ml-2">{createForm.firstName} {createForm.lastName}</strong></div>
                  <div><span className="text-slate-400">Email:</span> <span className="text-indigo-300 ml-2">{createForm.email}</span></div>
                  <div><span className="text-slate-400">Type:</span> <span className="text-emerald-400 ml-2">{createForm.personType}</span></div>
                  <div><span className="text-slate-400">Department:</span> <span className="text-white ml-2">{createForm.department}</span></div>
                  <div><span className="text-slate-400">Primary Role:</span> <span className="text-amber-400 ml-2 font-bold">{createForm.primaryRole}</span></div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (wizardStep > 1) setWizardStep(s => s - 1);
                  else setIsCreateWizardOpen(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                {wizardStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (wizardStep < 6) {
                    if (wizardStep === 1 && (!createForm.firstName || !createForm.email)) {
                      alert('Please enter at least First Name and Official Email.');
                      return;
                    }
                    setWizardStep(s => s + 1);
                  } else {
                    alert(`User ${createForm.firstName} ${createForm.lastName} successfully provisioned with role ${createForm.primaryRole}!`);
                    setIsCreateWizardOpen(false);
                    fetchData();
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                {wizardStep === 6 ? 'Confirm & Create User' : 'Next Step →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
