import React, { useState, useEffect } from 'react';
import { Search, X, Users, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';
import { ProfileAvatar } from '../profile/ProfileAvatar';

interface Recipient {
  id: string;
  name: string;
  role: string;
  profilePhoto?: string | null;
  context?: string | null;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Recipient[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedMembers([]);
      setGroupTitle('');
      setGroupDescription('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 1) return;
    const delayDebounce = setTimeout(() => {
      searchRecipients();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, step, isOpen]);

  const searchRecipients = async () => {
    try {
      const res = await api.get(`/chat/recipients/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.data?.status === 'success') {
        setSearchResults(res.data.data || []);
      }
    } catch (_) {
      toast.error('Could not search recipients.');
    }
  };

  const toggleMember = (recipient: Recipient) => {
    if (selectedMembers.some((m) => m.id === recipient.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== recipient.id));
    } else {
      setSelectedMembers([...selectedMembers, recipient]);
    }
  };

  const handleNext = () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member.');
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    if (!groupTitle.trim()) {
      toast.error('Please enter a group name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/chat/conversations/group', {
        title: groupTitle.trim(),
        description: groupDescription.trim(),
        memberUserIds: selectedMembers.map((m) => m.id),
      });
      if (res.data?.status === 'success') {
        toast.success('Group created successfully!');
        onGroupCreated(res.data.data.id);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Create New Group</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {step === 1 ? `Step 1: Select members (${selectedMembers.length} selected)` : 'Step 2: Enter group details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Step 1: Member Selection */}
        {step === 1 && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search classmates or mentors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Selected Chips */}
            {selectedMembers.length > 0 && (
              <div className="p-2 border-b border-border flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2 py-1 text-[10px] font-semibold whitespace-nowrap"
                  >
                    {m.name}
                    <button
                      onClick={() => toggleMember(m)}
                      className="rounded-full hover:bg-primary/20 p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  No results found
                </div>
              ) : (
                searchResults.map((r) => {
                  const isChecked = selectedMembers.some((m) => m.id === r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleMember(r)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left text-xs font-semibold"
                    >
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          person={{ fullName: r.name, profilePhoto: r.profilePhoto }}
                          size="sm"
                          shape="circle"
                        />
                        <div>
                          <p className="font-bold text-foreground">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.role} · {r.context || ''}</p>
                        </div>
                      </div>
                      <div
                        className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <footer className="p-3 border-t border-border flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold active:scale-95 transition-all shadow-md hover:bg-primary/95"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </footer>
          </div>
        )}

        {/* Step 2: Metadata Input */}
        {step === 2 && (
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="Enter a descriptive name..."
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What is this group for?..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <footer className="pt-4 mt-4 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground px-4 py-2 text-xs font-bold active:scale-95 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="rounded-xl bg-primary text-primary-foreground px-5 py-2 text-xs font-bold active:scale-95 transition-all shadow-md hover:bg-primary/95 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
