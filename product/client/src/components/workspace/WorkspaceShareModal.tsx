import React, { useState, useEffect } from 'react';
import { Share2, X, Plus, Trash2, Globe, Building2, Lock, Users, Loader2, Check } from 'lucide-react';
import { workspaceApi } from '../../services/workspace.api';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

interface Props {
  documentId: string;
  title: string;
  onClose: () => void;
}

type Permission = 'VIEWER' | 'COMMENTER' | 'EDITOR';
type Scope = 'PRIVATE' | 'DEPARTMENT' | 'ALL_CAMPUS';

interface ShareEntry {
  email: string;
  permission: Permission;
  canDownload: boolean;
  canPrint: boolean;
}

const WorkspaceShareModal: React.FC<Props> = ({ documentId, title, onClose }) => {
  const [scope, setScope] = useState<Scope>('PRIVATE');
  const [shareEntries, setShareEntries] = useState<ShareEntry[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [permission, setPermission] = useState<Permission>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const handleEmailSearch = async (q: string) => {
    setEmailInput(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get('/users/search', { params: { q, limit: 5 } });
      setSearchResults(res.data?.data || []);
    } catch { setSearchResults([]); }
  };

  const addEntry = (email: string) => {
    if (shareEntries.find((e) => e.email === email)) return;
    setShareEntries((prev) => [...prev, { email, permission, canDownload: false, canPrint: false }]);
    setEmailInput('');
    setSearchResults([]);
  };

  const removeEntry = (email: string) => {
    setShareEntries((prev) => prev.filter((e) => e.email !== email));
  };

  const updateEntryPermission = (email: string, perm: Permission) => {
    setShareEntries((prev) => prev.map((e) => e.email === email ? { ...e, permission: perm } : e));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await workspaceApi.shareDocument(documentId, shareEntries, scope);
      toast.success('Sharing settings saved.');
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save sharing settings.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-800">Share "{title}"</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Scope */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block">Access Level</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'PRIVATE', icon: Lock, label: 'Private', desc: 'Only you' },
                { key: 'DEPARTMENT', icon: Building2, label: 'Department', desc: 'Your dept only' },
                { key: 'ALL_CAMPUS', icon: Globe, label: 'All Campus', desc: 'All users' },
              ] as const).map(({ key, icon: Icon, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setScope(key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                    scope === key ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} className={scope === key ? 'text-blue-600' : 'text-gray-500'} />
                  <span className={`text-xs font-medium ${scope === key ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
                  <span className="text-[10px] text-gray-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add People */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block">Share with specific people</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => handleEmailSearch(e.target.value)}
                  placeholder="Search by email or name…"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter' && emailInput.includes('@')) addEntry(emailInput); }}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {searchResults.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => addEntry(u.email)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-[11px] font-bold text-blue-700 flex-shrink-0">
                          {u.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{u.name || u.email}</p>
                          <p className="text-[10px] text-gray-500">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as Permission)}
                className="text-xs border border-gray-200 rounded-xl px-2 outline-none focus:border-blue-400 bg-white cursor-pointer"
              >
                <option value="VIEWER">Viewer</option>
                <option value="COMMENTER">Commenter</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>

            {/* Added entries */}
            {shareEntries.length > 0 && (
              <div className="mt-3 space-y-2">
                {shareEntries.map((e) => (
                  <div key={e.email} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700 flex-shrink-0">
                      {e.email[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-xs text-gray-700 truncate">{e.email}</span>
                    <select
                      value={e.permission}
                      onChange={(ev) => updateEntryPermission(e.email, ev.target.value as Permission)}
                      className="text-[10px] border border-gray-200 rounded-lg px-1 py-0.5 bg-white outline-none"
                    >
                      <option value="VIEWER">View</option>
                      <option value="COMMENTER">Comment</option>
                      <option value="EDITOR">Edit</option>
                    </select>
                    <button onClick={() => removeEntry(e.email)} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={copyLink}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            Copy link
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Save settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceShareModal;
