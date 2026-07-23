import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface RolePermissionMatrixProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

const MODULES = [
  'Dashboard', 'Users', 'Roles', 'Students', 'Admissions', 'Faculty',
  'Departments', 'Courses', 'Subjects', 'Attendance', 'Examinations',
  'Marks', 'Results', 'Fees', 'Library', 'Hostel', 'Transport',
  'Inventory', 'Payroll', 'Certificates', 'Reports', 'Settings',
  'Notifications', 'Audit Logs'
];

const ACTIONS = [
  'View', 'Create', 'Edit', 'Delete', 'Approve', 'Reject',
  'Upload', 'Download', 'Export', 'Import', 'Print', 'Assign',
  'Manage', 'Configure', 'Analytics', 'Reports', 'AI Access',
  'Notifications', 'Messaging', 'API Access'
];

// Group mapping for categorization
const GROUPS: { [key: string]: string[] } = {
  'Core & Admin': ['Dashboard', 'Users', 'Roles', 'Settings', 'Notifications', 'Audit Logs'],
  'Academic Management': ['Students', 'Admissions', 'Faculty', 'Departments', 'Courses', 'Subjects'],
  'Campus Operations': ['Attendance', 'Examinations', 'Marks', 'Results', 'Certificates'],
  'Services & ERP': ['Fees', 'Library', 'Hostel', 'Transport', 'Inventory', 'Payroll', 'Reports']
};

export const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
  permissions,
  selectedPermissionIds,
  onChange,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  
  // Index permission ids by permission name for fast lookup
  const permissionNameToIdMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    permissions.forEach((p) => {
      map[p.name] = p.id;
    });
    return map;
  }, [permissions]);



  const toggleGroup = (group: string) => {
    if (collapsedGroups.includes(group)) {
      setCollapsedGroups(collapsedGroups.filter((g) => g !== group));
    } else {
      setCollapsedGroups([...collapsedGroups, group]);
    }
  };

  const getPermissionId = (moduleName: string, actionName: string): string | undefined => {
    const key = `${moduleName.toLowerCase().replace(' ', '_')}:${actionName.toLowerCase()}`;
    return permissionNameToIdMap[key];
  };

  const isChecked = (moduleName: string, actionName: string): boolean => {
    const pId = getPermissionId(moduleName, actionName);
    return pId ? selectedPermissionIds.includes(pId) : false;
  };

  const handleToggle = (moduleName: string, actionName: string) => {
    if (disabled) return;
    const pId = getPermissionId(moduleName, actionName);
    if (!pId) return;

    if (selectedPermissionIds.includes(pId)) {
      onChange(selectedPermissionIds.filter((id) => id !== pId));
    } else {
      onChange([...selectedPermissionIds, pId]);
    }
  };

  // Toggle all permissions in the entire matrix
  const handleToggleAll = (checked: boolean) => {
    if (disabled) return;
    if (checked) {
      const allIds = permissions.map((p) => p.id);
      onChange(allIds);
    } else {
      onChange([]);
    }
  };

  // Toggle all actions for a specific module (Row)
  const handleToggleRow = (moduleName: string, checked: boolean) => {
    if (disabled) return;
    const modulePrefix = moduleName.toLowerCase().replace(' ', '_');
    
    // Find all valid permission IDs for this module
    const rowPermIds = permissions
      .filter((p) => p.name.startsWith(`${modulePrefix}:`))
      .map((p) => p.id);

    if (checked) {
      // Add all
      const union = Array.from(new Set([...selectedPermissionIds, ...rowPermIds]));
      onChange(union);
    } else {
      // Remove all
      onChange(selectedPermissionIds.filter((id) => !rowPermIds.includes(id)));
    }
  };

  // Toggle a specific action across all modules (Column)
  const handleToggleColumn = (actionName: string, checked: boolean) => {
    if (disabled) return;
    const actionSuffix = `:${actionName.toLowerCase()}`;
    
    const colPermIds = permissions
      .filter((p) => p.name.endsWith(actionSuffix))
      .map((p) => p.id);

    if (checked) {
      const union = Array.from(new Set([...selectedPermissionIds, ...colPermIds]));
      onChange(union);
    } else {
      onChange(selectedPermissionIds.filter((id) => !colPermIds.includes(id)));
    }
  };

  // Filter modules based on search search
  const filteredModules = useMemo(() => {
    if (!searchTerm) return MODULES;
    return MODULES.filter((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const isAllSelected = useMemo(() => {
    if (permissions.length === 0) return false;
    return permissions.every((p) => selectedPermissionIds.includes(p.id));
  }, [permissions, selectedPermissionIds]);

  return (
    <div className="flex flex-col space-y-4">
      {/* Matrix Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-muted">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search permissions by module name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(true)}
            disabled={disabled}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(false)}
            disabled={disabled}
          >
            Clear All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCollapsedGroups(Object.keys(GROUPS))}
          >
            Collapse Groups
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCollapsedGroups([])}
          >
            Expand Groups
          </Button>
        </div>
      </div>

      {/* Permission Table Container */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm max-h-[600px] overflow-y-auto relative">
        <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full border-collapse text-left text-xs">
          {/* Table Header */}
          <thead className="sticky top-0 z-30 bg-muted/95 border-b backdrop-blur-sm">
            <tr>
              <th className="p-3 font-semibold text-foreground min-w-[200px] sticky left-0 bg-muted z-40 border-r">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    disabled={disabled}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                    className="h-4 w-4 rounded border-muted text-primary focus:ring-primary transition-all cursor-pointer"
                  />
                  <span>Module / Capabilities</span>
                </div>
              </th>
              {ACTIONS.map((action) => {
                // Check if all modules have this action checked
                const isColChecked = filteredModules.every((mod) => isChecked(mod, action));
                return (
                  <th key={action} className="p-3 text-center font-semibold text-muted-foreground min-w-[90px] hover:text-foreground border-r last:border-r-0">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="font-semibold text-[10px] uppercase tracking-wider">{action}</span>
                      <input
                        type="checkbox"
                        checked={isColChecked}
                        disabled={disabled}
                        onChange={(e) => handleToggleColumn(action, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-muted text-primary focus:ring-primary cursor-pointer transition-all"
                        title={`Toggle ${action} for all modules`}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y">
            {Object.entries(GROUPS).map(([groupName, groupModules]) => {
              const displayModules = groupModules.filter((m) => filteredModules.includes(m));
              if (displayModules.length === 0) return null;

              const isCollapsed = collapsedGroups.includes(groupName);

              return (
                <React.Fragment key={groupName}>
                  {/* Group Header Row */}
                  <tr className="bg-muted/30 font-bold text-foreground">
                    <td colSpan={ACTIONS.length + 1} className="p-3 sticky left-0 z-10 border-b">
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupName)}
                        className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:opacity-80 transition-opacity"
                      >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {groupName} ({displayModules.length})
                      </button>
                    </td>
                  </tr>

                  {/* Module Rows */}
                  {!isCollapsed && displayModules.map((module) => {
                    // Check if all actions in this row are checked
                    const isRowChecked = ACTIONS.every((action) => {
                      const pId = getPermissionId(module, action);
                      return pId ? selectedPermissionIds.includes(pId) : true; // ignore missing permissions
                    });

                    return (
                      <tr key={module} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-medium text-foreground sticky left-0 bg-card z-20 border-r border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isRowChecked}
                                disabled={disabled}
                                onChange={(e) => handleToggleRow(module, e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-muted text-primary focus:ring-primary cursor-pointer transition-all"
                              />
                              <span className="font-semibold text-xs">{module}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                              {module.toLowerCase().replace(' ', '_')}
                            </span>
                          </div>
                        </td>

                        {ACTIONS.map((action) => {
                          const pId = getPermissionId(module, action);
                          const checked = isChecked(module, action);
                          const exists = !!pId;

                          return (
                            <td
                              key={action}
                              className={`p-3 text-center border-r last:border-r-0 border-b ${!exists ? 'bg-muted/20' : 'cursor-pointer hover:bg-muted/20'}`}
                              onClick={() => exists && handleToggle(module, action)}
                            >
                              {exists ? (
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => handleToggle(module, action)}
                                  className="h-4 w-4 rounded border-muted text-primary focus:ring-primary cursor-pointer transition-all mx-auto block"
                                  title={`${module} - ${action}`}
                                />
                              ) : (
                                <span className="text-[10px] text-muted-foreground/40 font-mono">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
};
