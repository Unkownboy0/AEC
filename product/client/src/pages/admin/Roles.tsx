import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { toast } from '../../components/ui/Toast';
import { RolePermissionMatrix } from '../../components/admin/RolePermissionMatrix';
import { RoleAssignmentModal } from '../../components/admin/RoleAssignmentModal';
import { TemplateModal } from '../../components/admin/TemplateModal';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  Shield, Plus, Trash2, Edit2, Users, Copy, FileText,
  Lock, UserCheck, ShieldAlert, Award, Building,
  GraduationCap, UserPlus, Landmark, Home, Truck, PhoneCall,
  Activity, Info, HelpCircle, Eye, Sparkles
} from 'lucide-react';
import api from '../../lib/axios';

// Icon Map helper to render Lucide icons dynamically
const ICON_MAP: { [key: string]: any } = {
  Shield, ShieldAlert, Award, Building, GraduationCap,
  UserPlus, Landmark, Users, UserCheck, Home, Truck, PhoneCall,
  Activity, Settings: Shield, HelpCircle
};

interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  priority: number;
  hierarchy: number;
  isSystem: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  _count?: {
    users: number;
  };
}

const roleFormSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().max(200, 'Description is too long').optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  icon: z.string().min(1, 'Icon name is required'),
  priority: z.coerce.number().int().nonnegative(),
  hierarchy: z.coerce.number().int().nonnegative(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'INACTIVE']),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

const Roles: React.FC = () => {
  const { hasPermission } = useAuth();
  const { startRoleSimulation, stopRoleSimulation, simulation } = usePermissions();
  const [simRoleInput, setSimRoleInput] = useState('Student');
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [cloningRole, setCloningRole] = useState<RoleRecord | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
  
  // Assignment and Template Modal States
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [assignmentRole, setAssignmentRole] = useState<RoleRecord | null>(null);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'Shield',
      priority: 0,
      hierarchy: 99,
      status: 'ACTIVE'
    }
  });

  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await api.get('/roles');
      if (response.data?.status === 'success') {
        const list = response.data.data;
        setRoles(list);
        
        // Select first role by default if none is selected
        if (list.length > 0 && !selectedRole) {
          handleSelectRole(list[0]);
        } else if (selectedRole) {
          const updated = list.find((r: any) => r.id === selectedRole.id);
          if (updated) setSelectedRole(updated);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load roles');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const response = await api.get('/roles/permissions');
      if (response.data?.status === 'success') {
        setPermissions(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to load permissions list');
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, []);

  const handleSelectRole = async (role: RoleRecord) => {
    setSelectedRole(role);
    try {
      setIsLoadingPermissions(true);
      const response = await api.get(`/roles/${role.id}`);
      if (response.data?.status === 'success') {
        const perms = response.data.data.permissions.map((p: any) => p.permissionId);
        setSelectedPermissionIds(perms);
      }
    } catch (error: any) {
      toast.error('Failed to load role permissions');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setIsSavingPermissions(true);
      const response = await api.put(`/roles/${selectedRole.id}/permissions`, {
        permissionIds: selectedPermissionIds
      });
      if (response.data?.status === 'success') {
        toast.success(`Synced permissions for '${selectedRole.name}'!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setCloningRole(null);
    reset({
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'Shield',
      priority: 0,
      hierarchy: 99,
      status: 'ACTIVE'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (role: RoleRecord) => {
    setEditingRole(role);
    setCloningRole(null);
    reset({
      name: role.name,
      description: role.description || '',
      color: role.color,
      icon: role.icon,
      priority: role.priority,
      hierarchy: role.hierarchy,
      status: role.status
    });
    setIsFormModalOpen(true);
  };

  const handleOpenClone = (role: RoleRecord) => {
    setCloningRole(role);
    setEditingRole(null);
    reset({
      name: `${role.name} (Copy)`,
      description: `Cloned from ${role.name}`,
      color: role.color,
      icon: role.icon,
      priority: role.priority + 1,
      hierarchy: role.hierarchy,
      status: 'ACTIVE'
    });
    setIsFormModalOpen(true);
  };

  const handleSaveRole = async (values: RoleFormValues) => {
    try {
      if (editingRole) {
        // Edit Role details
        const response = await api.put(`/roles/${editingRole.id}`, values);
        if (response.data?.status === 'success') {
          toast.success('Role updated successfully');
          setIsFormModalOpen(false);
          fetchRoles();
        }
      } else if (cloningRole) {
        // Clone role
        const response = await api.post(`/roles/${cloningRole.id}/clone`, {
          name: values.name,
          description: values.description
        });
        if (response.data?.status === 'success') {
          toast.success('Role cloned successfully');
          setIsFormModalOpen(false);
          fetchRoles();
        }
      } else {
        // Create role
        const response = await api.post('/roles', values);
        if (response.data?.status === 'success') {
          toast.success('Role created successfully');
          setIsFormModalOpen(false);
          fetchRoles();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Operation failed');
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      const response = await api.delete(`/roles/${roleToDelete.id}`);
      if (response.data?.status === 'success') {
        toast.success('Role deleted successfully');
        setRoleToDelete(null);
        // If deleted role was selected, clear it
        if (selectedRole?.id === roleToDelete.id) {
          setSelectedRole(null);
          setSelectedPermissionIds([]);
        }
        fetchRoles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Delete failed');
    }
  };

  const handleOpenAssignments = (role: RoleRecord) => {
    setAssignmentRole(role);
    setIsAssignmentOpen(true);
  };

  const handleApplyTemplate = (permissionIds: string[]) => {
    setSelectedPermissionIds(permissionIds);
  };

  // Helper to render role icon
  const renderRoleIcon = (iconName: string, color: string) => {
    const IconComponent = ICON_MAP[iconName] || Shield;
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: color }}
      >
        <IconComponent className="h-4.5 w-4.5" />
      </div>
    );
  };

  const writePermission = hasPermission('roles:write');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Enterprise Roles & Permissions</h1>
          <p className="text-xs text-muted-foreground">
            Manage system roles, configure the permissions matrix, and control access levels across all modules.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {simulation.isSimulating ? (
            <div className="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              Previewing View: <span>{simulation.simulatedRole}</span>
              <button
                onClick={stopRoleSimulation}
                className="ml-2 px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] hover:bg-amber-700 transition-colors"
              >
                Exit Preview Mode
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 border rounded-lg p-1 bg-background">
              <select
                value={simRoleInput}
                onChange={e => setSimRoleInput(e.target.value)}
                className="h-7 border-none bg-transparent text-xs font-bold focus:outline-none px-1"
              >
                <option value="Super Admin">Super Admin (L1)</option>
                <option value="College Admin">College Admin (L2)</option>
                <option value="Principal">Principal (L3)</option>
                <option value="Vice Principal">Vice Principal (L4)</option>
                <option value="Academic Dean">Academic Dean (L5)</option>
                <option value="Admission Dean">Admission Dean (L6)</option>
                <option value="Accounts Officer">Accounts Officer (L7)</option>
                <option value="HOD">HOD (L8)</option>
                <option value="Mentor">Mentor (Class Advisor) (L9)</option>
                <option value="Faculty">Faculty (L10)</option>
                <option value="Student">Student (L11)</option>
                <option value="Parent">Parent (L12)</option>
                <option value="Placement Officer">Placement Officer (L13)</option>
                <option value="Librarian">Librarian (L14)</option>
                <option value="Examination Cell">Examination Cell (L15)</option>
                <option value="Hostel Warden">Hostel Warden (L16)</option>
                <option value="Transport Manager">Transport Manager (L17)</option>
              </select>
              <button
                onClick={() => {
                  startRoleSimulation(simRoleInput);
                  toast.success(`Role Simulation Active: Previewing as '${simRoleInput}'`);
                }}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded font-extrabold text-xs inline-flex flex-wrap items-center gap-1 hover:bg-indigo-700 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" /> Simulate Role
              </button>
            </div>
          )}

          {writePermission && (
            <Button onClick={handleOpenCreate} className="flex flex-wrap items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Create Custom Role
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles list */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-bold text-sm text-foreground flex flex-wrap items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-primary" />
                Defined System Roles ({roles.length})
              </h3>
            </div>
            
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {isLoadingRoles ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  Loading roles...
                </div>
              ) : roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    className={`p-4 flex items-start justify-between gap-3 cursor-pointer transition-all hover:bg-muted/5 ${
                      isSelected ? 'bg-primary/5 border-l-4 border-l-primary pl-3' : ''
                    }`}
                    onClick={() => handleSelectRole(role)}
                  >
                    <div className="flex flex-wrap gap-3 min-w-0 flex-1">
                      {renderRoleIcon(role.icon, role.color)}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-foreground truncate">{role.name}</span>
                          {role.isSystem && (
                            <span className="inline-flex flex-wrap items-center gap-0.5 px-1 py-0.5 rounded bg-muted text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                              <Lock className="h-2 w-2" /> System
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{role.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                          <span className="flex flex-wrap items-center gap-1">
                            <Users className="h-3 w-3" />
                            {role._count?.users ?? 0} users
                          </span>
                          <span>•</span>
                          <span>Hierarchy: Level {role.hierarchy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Row Actions */}
                    <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignments(role)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Manage Users"
                      >
                        <Users className="h-3.5 w-3.5" />
                      </button>
                      {writePermission && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenClone(role)}
                            className="p-1 text-muted-foreground hover:text-emerald-500 transition-colors"
                            title="Clone Role"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(role)}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Role"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {!role.isSystem && (
                            <button
                              type="button"
                              onClick={() => setRoleToDelete(role)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete Role"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Permission Matrix Editor */}
        <div className="xl:col-span-8 space-y-4">
          {selectedRole ? (
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  {renderRoleIcon(selectedRole.icon, selectedRole.color)}
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Permission Matrix: <span className="text-primary">{selectedRole.name}</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Configure granular action overrides for all functional modules.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTemplateOpen(true)}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    Templates
                  </Button>
                  {writePermission && selectedRole.name !== 'Super Admin' && (
                    <Button
                      size="sm"
                      onClick={handleSavePermissions}
                      disabled={isSavingPermissions}
                    >
                      {isSavingPermissions ? 'Saving...' : 'Save Matrix'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {selectedRole.name === 'Super Admin' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-2xl bg-muted/5">
                    <Lock className="h-10 w-10 text-primary animate-pulse mb-3" />
                    <h4 className="font-bold text-sm text-foreground">Super Admin Permissions are Locked</h4>
                    <p className="text-xs text-muted-foreground max-w-md mt-1">
                      By default, the Super Admin role possesses wildcard (`*:*`) access. It has bypass authorization for all backend operations and cannot be modified.
                    </p>
                  </div>
                ) : isLoadingPermissions ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    Loading permission records...
                  </div>
                ) : (
                  <RolePermissionMatrix
                    permissions={permissions}
                    selectedPermissionIds={selectedPermissionIds}
                    onChange={setSelectedPermissionIds}
                    disabled={!writePermission}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-2xl bg-card shadow-sm">
              <Shield className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h4 className="font-bold text-sm text-foreground">No Role Selected</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Select a role from the left sidebar panel to view its metadata and modify its permission matrix.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create / Edit Role Details Form */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          editingRole
            ? `Edit Role: ${editingRole.name}`
            : cloningRole
            ? `Clone Role: ${cloningRole.name}`
            : 'Create Custom Role'
        }
        size="md"
      >
        <form onSubmit={handleSubmit(handleSaveRole)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Role Name"
              placeholder="e.g. Finance Admin"
              {...register('name')}
              error={errors.name?.message}
              disabled={editingRole?.isSystem}
            />
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-background border rounded-lg text-xs"
                disabled={editingRole?.isSystem}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
              {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
            </div>
          </div>

          <Input
            label="Description"
            placeholder="e.g. Manage billing entries and invoice exports"
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Theme Color (Hex)"
              placeholder="#6366f1"
              type="color"
              {...register('color')}
              error={errors.color?.message}
            />

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Icon Representation</label>
              <select
                {...register('icon')}
                className="w-full px-3 py-2 bg-background border rounded-lg text-xs"
              >
                {Object.keys(ICON_MAP).map((iconName) => (
                  <option key={iconName} value={iconName}>{iconName}</option>
                ))}
              </select>
              {errors.icon && <p className="text-xs text-destructive mt-1">{errors.icon.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Sort Priority"
              type="number"
              placeholder="0"
              {...register('priority')}
              error={errors.priority?.message}
            />
            <Input
              label="Hierarchy Rank (0 = highest)"
              type="number"
              placeholder="99"
              {...register('hierarchy')}
              error={errors.hierarchy?.message}
            />
          </div>

          {editingRole?.isSystem && (
            <p className="text-[10px] text-yellow-600 bg-yellow-50 p-2.5 rounded-lg border border-yellow-100 flex flex-wrap items-start gap-1.5">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              This is a default system role. Renaming and status modifications are disabled to preserve critical routing.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Role Assignments Modal */}
      <RoleAssignmentModal
        isOpen={isAssignmentOpen}
        onClose={() => {
          setIsAssignmentOpen(false);
          setAssignmentRole(null);
        }}
        role={assignmentRole}
        allRoles={roles}
        onAssignmentChange={fetchRoles}
      />

      {/* MODAL 3: Permission Templates Modal */}
      <TemplateModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        selectedPermissionIds={selectedPermissionIds}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* MODAL 4: Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to permanently delete the role '${roleToDelete?.name || ''}'? This operation is irreversible and cannot be completed if users are assigned to this role.`}
      />
    </div>
  );
};

export default Roles;
