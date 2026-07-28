import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Users, Lock, Unlock, Eye, Edit3, Trash2, Copy, GitMerge, Plus, Check, X, 
  Search, Sliders, RefreshCw, AlertCircle, Layers, Layout, ArrowRightLeft, FileText, Activity
} from 'lucide-react';
import { useRBAC } from '../../context/RBACContext';

const PERMISSION_ACTIONS = [
  'view', 'create', 'edit', 'delete', 'approve', 'reject',
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

export const MasterRBACConsole: React.FC = () => {
  const { rbac, refetchRBAC } = useRBAC();
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix' | 'sidebar' | 'dashboard' | 'approvals' | 'users' | 'audit'>('roles');
  
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  
  const [newRoleForm, setNewRoleForm] = useState({ name: '', roleCode: '', description: '', priority: 50, color: '#6366f1' });
  const [cloneForm, setCloneForm] = useState({ newRoleName: '', newRoleCode: '' });
  const [mergeForm, setMergeForm] = useState({ targetRoleId: '', deleteSource: true });

  // Users Master Control State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userEditModal, setUserEditModal] = useState(false);
  const [userForm, setUserForm] = useState({ roleId: '', designation: '', departmentId: '', status: 'ACTIVE', newPassword: '' });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Approval Matrix State
  const [approvalRules, setApprovalRules] = useState<any[]>([]);
  const [newApprovalForm, setNewApprovalForm] = useState({ workflowType: 'STUDENT_LEAVE', stepOrder: 1, approverRole: 'Faculty' });

  // Fetch Master Matrix
  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/rbac/matrix');
      const data = res.data?.data || [];
      setRoles(data);
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
      } else if (selectedRole) {
        const updated = data.find((r: any) => r.id === selectedRole.id);
        if (updated) setSelectedRole(updated);
      }
    } catch (err) {
      console.error('Failed to load matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsersList(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get('/api/rbac/audit-logs');
      setAuditLogs(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  // Fetch Approvals
  const fetchApprovals = async () => {
    try {
      const res = await axios.get('/api/rbac/approval-rules');
      setApprovalRules(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch approval rules:', err);
    }
  };

  useEffect(() => {
    fetchMatrix();
    fetchUsers();
    fetchAuditLogs();
    fetchApprovals();
  }, []);

  // Permission Toggle in Matrix
  const togglePermission = async (moduleName: string, actionName: string) => {
    if (!selectedRole) return;
    const currentAccess = { ...(selectedRole.moduleAccess || {}) };
    if (!currentAccess[moduleName]) currentAccess[moduleName] = {};
    currentAccess[moduleName][actionName] = !currentAccess[moduleName][actionName];

    // Optimistic UI update
    setSelectedRole({ ...selectedRole, moduleAccess: currentAccess });
    try {
      await axios.put(`/api/rbac/roles/${selectedRole.id}/config`, {
        moduleAccess: currentAccess,
        reason: `Toggled ${actionName} on ${moduleName}`
      });
      fetchMatrix();
      refetchRBAC();
    } catch (err) {
      console.error('Failed to update permission:', err);
    }
  };

  // Create Custom Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/rbac/roles', newRoleForm);
      setShowCreateModal(false);
      setNewRoleForm({ name: '', roleCode: '', description: '', priority: 50, color: '#6366f1' });
      fetchMatrix();
      refetchRBAC();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create role');
    }
  };

  // Clone Role
  const handleCloneRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      await axios.post('/api/rbac/roles/clone', {
        sourceRoleId: selectedRole.id,
        newRoleName: cloneForm.newRoleName,
        newRoleCode: cloneForm.newRoleCode
      });
      setShowCloneModal(false);
      setCloneForm({ newRoleName: '', newRoleCode: '' });
      fetchMatrix();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clone role');
    }
  };

  // Merge Roles
  const handleMergeRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      await axios.post('/api/rbac/roles/merge', {
        sourceRoleId: selectedRole.id,
        targetRoleId: mergeForm.targetRoleId,
        deleteSource: mergeForm.deleteSource
      });
      setShowMergeModal(false);
      fetchMatrix();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to merge roles');
    }
  };

  // Update Sidebar Config for selected role
  const toggleSidebarItem = async (key: string) => {
    if (!selectedRole) return;
    const currentSidebar = { ...(selectedRole.sidebarConfig || {}) };
    currentSidebar[key] = !currentSidebar[key];
    setSelectedRole({ ...selectedRole, sidebarConfig: currentSidebar });
    try {
      await axios.put(`/api/rbac/roles/${selectedRole.id}/config`, {
        sidebarConfig: currentSidebar,
        reason: `Toggled sidebar visibility for ${key}`
      });
      fetchMatrix();
      refetchRBAC();
    } catch (err) {
      console.error('Failed to update sidebar config:', err);
    }
  };

  // Update Search Scope for selected role
  const handleSearchScopeChange = async (scope: string) => {
    if (!selectedRole) return;
    setSelectedRole({ ...selectedRole, searchScope: scope });
    try {
      await axios.put(`/api/rbac/roles/${selectedRole.id}/config`, {
        searchScope: scope,
        reason: `Changed search scope to ${scope}`
      });
      fetchMatrix();
    } catch (err) {
      console.error('Failed to update search scope:', err);
    }
  };

  // Super Admin User Update
  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await axios.patch(`/api/rbac/users/${selectedUser.id}`, userForm);
      setUserEditModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Save Approval Matrix Rule
  const handleSaveApprovalRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/rbac/approval-rules', newApprovalForm);
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save approval rule');
    }
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.roleCode && r.roleCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Enterprise Role & Permission Management (RBAC)
            </h1>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Master Authority & Realtime Permission Engine for GEETORUS CAMPUSOS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchMatrix(); fetchUsers(); fetchAuditLogs(); refetchRBAC(); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Sync Engine
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
        {[
          { id: 'roles', label: 'Master 31 Roles & Custom Roles', icon: Shield },
          { id: 'matrix', label: '24-Action Permission Matrix', icon: Layers },
          { id: 'sidebar', label: 'Sidebar Control', icon: Layout },
          { id: 'dashboard', label: 'Dashboard Widgets', icon: Sliders },
          { id: 'approvals', label: 'Approval Matrix Workflows', icon: ArrowRightLeft },
          { id: 'users', label: 'Super Admin User Master Control', icon: Users },
          { id: 'audit', label: 'Realtime Audit Logs', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                active
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MASTER ROLES */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Role List */}
          <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search 31 master roles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {filteredRoles.map(role => {
                const selected = selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      selected
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color || '#6366f1' }}
                      />
                      <div>
                        <div className="font-semibold text-sm">{role.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{role.roleCode || 'CUSTOM'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {role._count?.users || 0} Users
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Role Configuration & Actions */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            {selectedRole ? (
              <div>
                <div className="flex justify-between items-start border-b border-slate-800 pb-5 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-100">{selectedRole.name}</h2>
                      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800">
                        {selectedRole.roleCode}
                      </span>
                      {selectedRole.isSystem && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-950 text-amber-400 border border-amber-800">
                          System Protected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{selectedRole.description || 'Enterprise role definition.'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCloneModal(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Clone Role
                    </button>
                    <button
                      onClick={() => setShowMergeModal(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <GitMerge className="w-3.5 h-3.5" /> Merge Role
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-500">Priority</div>
                    <div className="text-lg font-bold text-slate-200">{selectedRole.priority || 0}</div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-500">Hierarchy Level</div>
                    <div className="text-lg font-bold text-slate-200">{selectedRole.hierarchy || 99}</div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-500">Active Users</div>
                    <div className="text-lg font-bold text-indigo-400">{selectedRole._count?.users || 0}</div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-500">Search Scope</div>
                    <select
                      value={selectedRole.searchScope || 'EVERYONE'}
                      onChange={e => handleSearchScopeChange(e.target.value)}
                      className="bg-slate-900 text-xs font-semibold text-indigo-300 mt-1 border border-slate-700 rounded px-2 py-1 w-full"
                    >
                      <option value="EVERYONE">Everyone</option>
                      <option value="OWN_DEPARTMENT">Own Department</option>
                      <option value="ASSIGNED_STUDENTS">Assigned Students</option>
                      <option value="OWN_PROFILE">Own Profile</option>
                      <option value="OWN_CHILD">Own Child</option>
                    </select>
                  </div>
                </div>

                {/* Workspace Access List */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-2">Workspaces Assigned</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRole.workspaceAccess || ['Default Workspace']).map((ws: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs rounded-full font-medium">
                        {ws}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">Select a role to configure</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 24-ACTION PERMISSION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Granular 24-Action Module Permission Matrix</h2>
              <p className="text-sm text-slate-400">Configure exact CRUD, AI, Analytics, Export, and Administrative permissions for each module.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 font-medium">Select Role:</label>
              <select
                value={selectedRole?.id}
                onChange={e => {
                  const r = roles.find(item => item.id === e.target.value);
                  if (r) setSelectedRole(r);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-indigo-300 font-semibold focus:outline-none"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.roleCode})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-bold text-slate-400 sticky left-0 bg-slate-950 z-20 w-44 border-r border-slate-800">
                    Module Name
                  </th>
                  {PERMISSION_ACTIONS.map(action => (
                    <th key={action} className="p-2 text-center uppercase tracking-wider font-semibold text-slate-400 min-w-[70px]">
                      {action.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {MODULES.map(mod => (
                  <tr key={mod} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-slate-200 sticky left-0 bg-slate-950 border-r border-slate-800 z-10">
                      {mod}
                    </td>
                    {PERMISSION_ACTIONS.map(act => {
                      const enabled = selectedRole?.moduleAccess?.[mod]?.[act] === true;
                      return (
                        <td key={act} className="p-2 text-center">
                          <button
                            onClick={() => togglePermission(mod, act)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition border ${
                              enabled
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/50'
                                : 'bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-700'
                            }`}
                          >
                            {enabled && <Check className="w-3.5 h-3.5" />}
                          </button>
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

      {/* TAB 3: SIDEBAR CONTROL */}
      {activeTab === 'sidebar' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Permission-Based Sidebar Item Control</h2>
              <p className="text-sm text-slate-400">Enable or disable specific sidebar items for <strong>{selectedRole?.name}</strong>.</p>
            </div>
            <select
              value={selectedRole?.id}
              onChange={e => {
                const r = roles.find(item => item.id === e.target.value);
                if (r) setSelectedRole(r);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-indigo-300 font-semibold"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'academics', label: 'Academics Portal' },
              { key: 'attendance', label: 'Attendance Management' },
              { key: 'assignments', label: 'Assignments & Submissions' },
              { key: 'results', label: 'Exam Results & Marks' },
              { key: 'leave', label: 'Leave Requests' },
              { key: 'placement', label: 'Placement Cell' },
              { key: 'library', label: 'Digital Library' },
              { key: 'sports', label: 'Sports & Facilities' },
              { key: 'hostel', label: 'Hostel Management' },
              { key: 'transport', label: 'Transport System' },
              { key: 'finance', label: 'Accounts & Fees' },
            ].map(item => {
              const visible = selectedRole?.sidebarConfig?.[item.key] !== false;
              return (
                <div
                  key={item.key}
                  onClick={() => toggleSidebarItem(item.key)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    visible
                      ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="font-semibold text-sm">{item.label}</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${visible ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    {visible ? 'VISIBLE' : 'HIDDEN'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: APPROVAL MATRIX */}
      {activeTab === 'approvals' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Dynamic Multi-Tier Approval Matrix</h2>
          <p className="text-sm text-slate-400 mb-6">Configure custom approval chains for leaves, budgets, and academic marks.</p>

          <form onSubmit={handleSaveApprovalRule} className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Workflow Type</label>
              <select
                value={newApprovalForm.workflowType}
                onChange={e => setNewApprovalForm({ ...newApprovalForm, workflowType: e.target.value })}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2"
              >
                <option value="STUDENT_LEAVE">Student Leave</option>
                <option value="FACULTY_LEAVE">Faculty Leave</option>
                <option value="DEAN_LEAVE">Dean Leave</option>
                <option value="BUDGET_APPROVAL">Budget Approval</option>
                <option value="MARKS_APPROVAL">Marks Approval</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Step Order</label>
              <input
                type="number"
                value={newApprovalForm.stepOrder}
                onChange={e => setNewApprovalForm({ ...newApprovalForm, stepOrder: parseInt(e.target.value) || 1 })}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 w-20"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Approver Role</label>
              <select
                value={newApprovalForm.approverRole}
                onChange={e => setNewApprovalForm({ ...newApprovalForm, approverRole: e.target.value })}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="self-end">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-500">
                Add Approval Step
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {approvalRules.map(rule => (
              <div key={rule.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-indigo-400 mr-3">[{rule.workflowType}]</span>
                  <span className="text-slate-300">Step {rule.stepOrder}: Approved by <strong>{rule.approverRole}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SUPER ADMIN USER MASTER CONTROL */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Super Admin User Master Control</h2>
              <p className="text-sm text-slate-400">View, edit, transfer roles, reset passwords, lock, or suspend any user in the ERP.</p>
            </div>
            <input
              type="text"
              placeholder="Search user email or name..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200"
            />
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">User</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Designation</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList
                  .filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase()))
                  .map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="font-bold text-slate-100">{u.firstName} {u.lastName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-3 font-semibold text-indigo-400">{u.role?.name || 'Unassigned'}</td>
                      <td className="p-3 text-slate-400">{u.designation || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setUserForm({
                              roleId: u.roleId || '',
                              designation: u.designation || '',
                              departmentId: u.departmentId || '',
                              status: u.status || 'ACTIVE',
                              newPassword: ''
                            });
                            setUserEditModal(true);
                          }}
                          className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded text-xs transition"
                        >
                          Manage User
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-2">Realtime Audit Logs</h2>
          <p className="text-sm text-slate-400 mb-6">Track all role changes, permission modifications, and administrative overrides.</p>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded text-[10px] font-bold">
                      {log.entityType}
                    </span>
                    <span className="font-bold text-slate-200 text-xs">{log.action}</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{log.reason || 'RBAC configuration updated'}</p>
                <div className="text-[11px] text-slate-500 font-mono">Changed by: {log.changedBy}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Create New Custom Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRoleForm.name}
                  onChange={e => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Role Code</label>
                <input
                  type="text"
                  placeholder="e.g. LAB_ASSISTANT"
                  value={newRoleForm.roleCode}
                  onChange={e => setNewRoleForm({ ...newRoleForm, roleCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  value={newRoleForm.description}
                  onChange={e => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-semibold">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLONE ROLE MODAL */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Clone Role: {selectedRole?.name}</h3>
            <form onSubmit={handleCloneRole} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Role Name</label>
                <input
                  type="text"
                  required
                  value={cloneForm.newRoleName}
                  onChange={e => setCloneForm({ ...cloneForm, newRoleName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Role Code</label>
                <input
                  type="text"
                  required
                  value={cloneForm.newRoleCode}
                  onChange={e => setCloneForm({ ...cloneForm, newRoleCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCloneModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-semibold">Clone Now</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER EDIT MODAL */}
      {userEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Super Admin Control: {selectedUser.email}</h3>
            <form onSubmit={handleUserSave} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Assign Role</label>
                <select
                  value={userForm.roleId}
                  onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Designation</label>
                <input
                  type="text"
                  value={userForm.designation}
                  onChange={e => setUserForm({ ...userForm, designation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Status</label>
                <select
                  value={userForm.status}
                  onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={userForm.newPassword}
                  onChange={e => setUserForm({ ...userForm, newPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setUserEditModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-semibold">Save User Control</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
