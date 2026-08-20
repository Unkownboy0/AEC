import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, ShieldAlert, LogOut, Check, Search, Plus } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { useAuth } from '../../context/AuthContext';

interface GroupMember {
  id: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  roleName: 'Faculty' | 'Student';
  profilePhoto?: string | null;
}

interface GroupDetails {
  id: string;
  type: string;
  title: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  members: GroupMember[];
}

interface GroupInfoModalProps {
  isOpen: boolean;
  conversationId: string;
  onClose: () => void;
  onLeaveGroup: () => void;
  onGroupUpdated: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  conversationId,
  onClose,
  onLeaveGroup,
  onGroupUpdated,
}) => {
  const { user } = useAuth();
  const [details, setDetails] = useState<GroupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchGroupDetails();
      setIsEditing(false);
      setIsAddingMember(false);
      setAddSearchQuery('');
      setAddSearchResults([]);
    }
  }, [isOpen, conversationId]);

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      if (res.data?.status === 'success') {
        const d = res.data.data;
        setDetails(d);
        setEditTitle(d.title);
        setEditDescription(d.description || '');
      }
    } catch (_) {
      toast.error('Could not fetch group details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDetails = async () => {
    if (!editTitle.trim()) {
      toast.error('Group name cannot be empty.');
      return;
    }
    try {
      const res = await api.put(`/chat/conversations/group/${conversationId}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      if (res.data?.status === 'success') {
        toast.success('Group details updated!');
        setIsEditing(false);
        fetchGroupDetails();
        onGroupUpdated();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update details.');
    }
  };

  const toggleAdminRole = async (memberId: string, currentRole: 'ADMIN' | 'MEMBER') => {
    const nextRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      const res = await api.put(`/chat/conversations/group/${conversationId}/members/${memberId}/role`, {
        role: nextRole,
      });
      if (res.data?.status === 'success') {
        toast.success('Member role updated.');
        fetchGroupDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await api.delete(`/chat/conversations/group/${conversationId}/members/${memberId}`);
      if (res.data?.status === 'success') {
        toast.success('Member removed.');
        fetchGroupDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      const res = await api.post(`/chat/conversations/group/${conversationId}/leave`);
      if (res.data?.status === 'success') {
        toast.success('You left the group.');
        onLeaveGroup();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to leave group.');
    }
  };

  // Autocomplete search for adding members
  useEffect(() => {
    if (!isAddingMember) return;
    const delayDebounce = setTimeout(() => {
      searchAddRecipients();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [addSearchQuery, isAddingMember]);

  const searchAddRecipients = async () => {
    try {
      const res = await api.get(`/chat/recipients/search?q=${encodeURIComponent(addSearchQuery)}`);
      if (res.data?.status === 'success') {
        // Exclude members already in the group
        const existingIds = new Set(details?.members.map(m => m.id) || []);
        const filtered = (res.data.data || []).filter((r: any) => !existingIds.has(r.id));
        setAddSearchResults(filtered);
      }
    } catch (_) {}
  };

  const handleAddMember = async (memberUserId: string) => {
    try {
      const res = await api.post(`/chat/conversations/group/${conversationId}/members`, {
        memberUserIds: [memberUserId],
      });
      if (res.data?.status === 'success') {
        toast.success('Member added successfully.');
        setIsAddingMember(false);
        setAddSearchQuery('');
        setAddSearchResults([]);
        fetchGroupDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
    }
  };

  if (!isOpen) return null;

  const isAdmin = details?.members.some(m => m.id === user?.id && m.role === 'ADMIN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Group Info</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-muted-foreground">
            Loading details...
          </div>
        ) : details ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Meta */}
            <div className="p-4 border-b border-border bg-muted/10 flex flex-col items-center text-center">
              <ProfileAvatar
                person={{ fullName: details.title, profilePhoto: details.avatar }}
                size="xl"
                shape="circle"
                className="shadow-md mb-3"
              />
              {isEditing ? (
                <div className="w-full space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-center font-bold px-3 py-1.5 text-xs border border-border rounded-xl bg-background focus:outline-none"
                    placeholder="Group Name"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-center px-3 py-1.5 text-xs border border-border rounded-xl bg-background focus:outline-none resize-none"
                    placeholder="Description..."
                    rows={2}
                  />
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleUpdateDetails}
                      className="rounded-lg bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border border-border bg-background px-3 py-1 text-[10px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                    {details.title}
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] text-primary font-semibold hover:underline"
                      >
                        (Edit)
                      </button>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs break-words">
                    {details.description || 'No description provided.'}
                  </p>
                </>
              )}
            </div>

            {/* Actions for Admins */}
            {isAdmin && !isAddingMember && (
              <div className="p-3 border-b border-border flex justify-end">
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary hover:bg-primary/15 font-bold rounded-lg px-2.5 py-1.5"
                >
                  <Plus className="h-3 w-3" />
                  Add Member
                </button>
              </div>
            )}

            {/* Add Member Section */}
            {isAddingMember && (
              <div className="p-3 border-b border-border space-y-2 bg-muted/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-foreground">Add Group Member</span>
                  <button
                    onClick={() => setIsAddingMember(false)}
                    className="text-[10px] text-muted-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background"
                  />
                </div>
                {addSearchResults.length > 0 && (
                  <div className="max-h-36 overflow-y-auto border border-border bg-background rounded-lg divide-y text-xs">
                    {addSearchResults.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleAddMember(r.id)}
                        className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold">{r.name}</p>
                          <p className="text-[9px] text-muted-foreground">{r.role}</p>
                        </div>
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-4 py-2 border-b border-border bg-muted/5">
                <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                  Participants ({details.members.length})
                </p>
              </div>
              <div className="divide-y divide-border">
                {details.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 text-xs font-semibold hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        person={{ fullName: m.name, profilePhoto: m.profilePhoto }}
                        size="sm"
                        shape="circle"
                      />
                      <div>
                        <p className="font-bold text-foreground">
                          {m.name} {m.id === user?.id && <span className="text-muted-foreground">(You)</span>}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{m.roleName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.role === 'ADMIN' && (
                        <span className="inline-flex rounded-md bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 text-[9px] font-bold">
                          Admin
                        </span>
                      )}
                      {isAdmin && m.id !== user?.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleAdminRole(m.id, m.role)}
                            className="rounded-lg border border-border bg-background hover:bg-muted p-1 text-muted-foreground"
                            title={m.role === 'ADMIN' ? 'Dismiss as Admin' : 'Make Group Admin'}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="rounded-lg border border-border bg-background hover:bg-red-50 p-1 text-destructive"
                            title="Remove Member"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Footer */}
            <footer className="p-4 border-t border-border bg-muted/5 flex justify-center">
              <button
                onClick={handleLeaveGroup}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 text-white py-2 text-xs font-bold shadow-md hover:bg-red-700 active:scale-95 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Leave Group
              </button>
            </footer>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No group details.
          </div>
        )}
      </div>
    </div>
  );
};
