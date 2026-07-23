import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { Search } from '../ui/Search';
import { Plus, Trash2, ArrowLeftRight, Users, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface RoleRecord {
  id: string;
  name: string;
}

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleRecord | null;
  allRoles: RoleRecord[];
  onAssignmentChange?: () => void;
}

export const RoleAssignmentModal: React.FC<RoleAssignmentModalProps> = ({
  isOpen,
  onClose,
  role,
  allRoles,
  onAssignmentChange
}) => {
  const [assignedUsers, setAssignedUsers] = useState<UserRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for adding users
  const [isAdding, setIsAdding] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserRecord[]>([]);
  const [selectedAddUserIds, setSelectedAddUserIds] = useState<string[]>([]);
  const [searchAvailableTerm, setSearchAvailableTerm] = useState('');
  const [availablePage, setAvailablePage] = useState(1);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [isAddLoading, setIsAddLoading] = useState(false);

  // States for transferring users
  const [transferUser, setTransferUser] = useState<UserRecord | null>(null);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const pageSize = 5;

  // Fetch users assigned to this role
  const fetchAssignedUsers = async () => {
    if (!role) return;
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        pageSize,
        search: searchTerm || undefined
      };
      const response = await api.get(`/roles/${role.id}/users`, { params });
      if (response.data?.status === 'success') {
        setAssignedUsers(response.data.data.users);
        setTotalCount(response.data.data.totalCount);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch assigned users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all users that can be assigned (excluding current role)
  const fetchAvailableUsers = async () => {
    try {
      setIsAddLoading(true);
      const params = {
        page: availablePage,
        pageSize: 5,
        search: searchAvailableTerm || undefined
      };
      const response = await api.get('/users', { params });
      if (response.data?.status === 'success') {
        // Filter out users who already have this role
        const filtered = response.data.data.users.filter(
          (u: any) => u.role.id !== role?.id
        );
        setAvailableUsers(filtered);
        setAvailableTotal(response.data.data.totalCount);
      }
    } catch (error: any) {
      toast.error('Failed to load eligible users');
    } finally {
      setIsAddLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && role) {
      fetchAssignedUsers();
    }
  }, [isOpen, role, currentPage, searchTerm]);

  useEffect(() => {
    if (isAdding) {
      fetchAvailableUsers();
    }
  }, [isAdding, availablePage, searchAvailableTerm]);

  const handleRemoveUser = async (userId: string) => {
    if (!role) return;
    try {
      const response = await api.delete(`/roles/${role.id}/users/${userId}`);
      if (response.data?.status === 'success') {
        toast.success('User unassigned from role');
        fetchAssignedUsers();
        if (onAssignmentChange) onAssignmentChange();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Unassign failed');
    }
  };

  const handleBulkAssign = async () => {
    if (!role || selectedAddUserIds.length === 0) return;
    try {
      const response = await api.post(`/roles/${role.id}/users`, {
        userIds: selectedAddUserIds
      });
      if (response.data?.status === 'success') {
        toast.success(`Assigned ${selectedAddUserIds.length} users to ${role.name}`);
        setSelectedAddUserIds([]);
        setIsAdding(false);
        fetchAssignedUsers();
        if (onAssignmentChange) onAssignmentChange();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Assignment failed');
    }
  };

  const handleTransfer = async () => {
    if (!transferUser || !targetRoleId) return;
    try {
      setIsTransferring(true);
      const response = await api.post(`/roles/${targetRoleId}/users`, {
        userIds: [transferUser.id]
      });
      if (response.data?.status === 'success') {
        toast.success(`Transferred user to ${allRoles.find(r => r.id === targetRoleId)?.name}`);
        setTransferUser(null);
        setTargetRoleId('');
        fetchAssignedUsers();
        if (onAssignmentChange) onAssignmentChange();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    if (selectedAddUserIds.includes(userId)) {
      setSelectedAddUserIds(selectedAddUserIds.filter(id => id !== userId));
    } else {
      setSelectedAddUserIds([...selectedAddUserIds, userId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsAdding(false);
        setTransferUser(null);
        onClose();
      }}
      title={`Role Assignments: ${role?.name || ''}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* VIEW 1: Transfer User Role */}
        {transferUser && (
          <div className="bg-muted/40 p-4 rounded-xl border space-y-4">
            <h4 className="font-bold text-sm text-foreground flex flex-wrap items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              Transfer User Role
            </h4>
            <p className="text-xs text-muted-foreground">
              Select a target role to transfer <strong>{transferUser.firstName} {transferUser.lastName}</strong> ({transferUser.email}) to.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={targetRoleId}
                onChange={(e) => setTargetRoleId(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border rounded-lg text-xs"
              >
                <option value="">Select Target Role...</option>
                {allRoles.filter(r => r.id !== role?.id).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleTransfer}
                  disabled={!targetRoleId || isTransferring}
                >
                  {isTransferring ? 'Transferring...' : 'Transfer'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTransferUser(null);
                    setTargetRoleId('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Bulk Assign Users */}
        {isAdding ? (
          <div className="border p-4 rounded-xl bg-card space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-foreground flex flex-wrap items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" />
                Assign Users to {role?.name}
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAdding(false)}
              >
                Back to List
              </Button>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex-1">
                <Search
                  value={searchAvailableTerm}
                  onChange={setSearchAvailableTerm}
                  placeholder="Search available users..."
                />
              </div>
            </div>

            {isAddLoading ? (
              <div className="flex justify-center p-6"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
            ) : availableUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No users found eligible for assignment.</p>
            ) : (
              <div className="space-y-4">
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>User Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedAddUserIds.includes(u.id)}
                            onChange={() => toggleSelectUser(u.id)}
                            className="h-4 w-4 rounded border-muted text-primary cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-bold">{u.firstName} {u.lastName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {selectedAddUserIds.length} users selected
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkAssign}
                      disabled={selectedAddUserIds.length === 0}
                    >
                      Confirm Assignment
                    </Button>
                    <Pagination
                      currentPage={availablePage}
                      totalPages={Math.ceil(availableTotal / 5)}
                      onPageChange={setAvailablePage}
                      pageSize={5}
                      totalCount={availableTotal}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 3: Primary Assigned Users List */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                <Search
                  value={searchTerm}
                  onChange={(val) => {
                    setSearchTerm(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search assigned users..."
                />
              </div>
              <Button
                onClick={() => setIsAdding(true)}
                size="sm"
                className="flex flex-wrap items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Assign Users
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : assignedUsers.length === 0 ? (
              <div className="text-center py-8 border rounded-xl bg-muted/10">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No Users Assigned</p>
                <p className="text-xs text-muted-foreground/60">No users currently hold the {role?.name} role.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTransferUser(user)}
                              className="p-1 text-muted-foreground hover:text-primary transition-colors"
                              title="Transfer Role"
                            >
                              <ArrowLeftRight className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(user.id)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove Assignment (Downgrade to Student)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Total: {totalCount} assigned users
                  </span>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCount / pageSize)}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    totalCount={totalCount}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
