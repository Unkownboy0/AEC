import React, { useEffect, useState } from 'react';
import { Check, Loader2, Search, Share2, Trash2, X } from 'lucide-react';
import { workspaceApi } from '../../services/workspace.api';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

interface Props { documentId: string; title: string; onClose: () => void }
type Permission = 'VIEWER' | 'COMMENTER' | 'EDITOR';
interface Recipient {
  id: string; name: string; role: string; context?: string | null; reference?: string | null; gender?: string | null;
  profileImage?: { fileId?: string | null; url?: string | null; version?: string | null } | null;
}
interface ShareEntry extends Recipient { permission: Permission; canDownload: boolean; canPrint: boolean }

const WorkspaceShareModal: React.FC<Props> = ({ documentId, title, onClose }) => {
  const [query, setQuery] = useState('');
  const [permission, setPermission] = useState<Permission>('VIEWER');
  const [entries, setEntries] = useState<ShareEntry[]>([]);
  const [results, setResults] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await api.get('/workspace/share-recipients', { params: { q, limit: 15 }, signal: controller.signal });
        setResults((response.data?.data || []).filter((item: Recipient) => !entries.some((entry) => entry.id === item.id)));
      } catch (error: any) {
        if (error?.code !== 'ERR_CANCELED') setResults([]);
      } finally { if (!controller.signal.aborted) setSearching(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, entries]);

  const add = (recipient: Recipient) => {
    setEntries((current) => current.some((entry) => entry.id === recipient.id) ? current : [...current, { ...recipient, permission, canDownload: false, canPrint: false }]);
    setQuery('');
  };

  const share = async () => {
    if (!entries.length) return;
    setSaving(true);
    try {
      await workspaceApi.shareDocument(documentId, entries.map((entry) => ({
        userId: entry.id, permission: entry.permission, canDownload: false, canPrint: false, canShare: false, canExport: false,
      })), 'PRIVATE');
      toast.success(entries.length === 1 ? `Shared with ${entries[0].name}.` : `Shared with ${entries.length} people.`);
      onClose();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'The document could not be shared.'); }
    finally { setSaving(false); }
  };

  const avatar = (person: Recipient) => <ProfileAvatar person={{ id: person.id, fullName: person.name, gender: person.gender, profileImage: person.profileImage }} size="sm" />;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="max-h-[calc(100dvh-var(--safe-area-top)-1rem)] w-full overflow-y-auto rounded-t-2xl border bg-card shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3 sm:px-5">
          <div className="min-w-0"><div className="flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /><h2 id="share-title" className="text-sm font-semibold">Share document</h2></div><p className="truncate text-xs text-muted-foreground">{title}</p></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-5 p-4 sm:p-5">
          <section>
            <label htmlFor="recipient-search" className="mb-2 block text-xs font-semibold">Who are you sharing with?</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="recipient-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, register number, or employee ID" className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary" autoComplete="off" />
              {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />}
            </div>
            {query.trim().length > 0 && query.trim().length < 2 && <p className="mt-2 text-xs text-muted-foreground">Enter at least two characters.</p>}
            {query.trim().length >= 2 && !searching && !results.length && <p className="mt-2 text-xs text-muted-foreground">No authorized recipients match this search.</p>}
            {!!results.length && <div className="mt-2 overflow-hidden rounded-xl border">{results.map((recipient) => (
              <button key={recipient.id} onClick={() => add(recipient)} className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60">
                {avatar(recipient)}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{recipient.name}</span><span className="block truncate text-xs text-muted-foreground">{[recipient.role, recipient.context, recipient.reference].filter(Boolean).join(' • ')}</span></span><span className="text-xs font-semibold text-primary">Add</span>
              </button>
            ))}</div>}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-xs font-semibold">Selected recipients</h3><label className="flex items-center gap-2 text-xs text-muted-foreground">Default access<select value={permission} onChange={(event) => setPermission(event.target.value as Permission)} className="rounded-lg border bg-background px-2 py-1.5 text-foreground"><option value="VIEWER">View</option><option value="COMMENTER">Comment</option><option value="EDITOR">Edit</option></select></label></div>
            {!entries.length ? <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">No recipients selected.</div> : <div className="space-y-2">{entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-xl border p-2.5">{avatar(entry)}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{entry.name}</span><span className="block truncate text-xs text-muted-foreground">{entry.role}{entry.context ? ` • ${entry.context}` : ''}</span></span><select value={entry.permission} onChange={(event) => setEntries((current) => current.map((item) => item.id === entry.id ? { ...item, permission: event.target.value as Permission } : item))} className="rounded-lg border bg-background px-2 py-1.5 text-xs"><option value="VIEWER">View</option><option value="COMMENTER">Comment</option><option value="EDITOR">Edit</option></select><button onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))} className="rounded-lg p-1.5 text-muted-foreground hover:text-danger" aria-label={`Remove ${entry.name}`}><Trash2 className="h-4 w-4" /></button></div>
            ))}</div>}
          </section>

          <section className="rounded-xl bg-muted/50 p-3 text-xs"><p><b>Document:</b> {title}</p><p className="mt-1"><b>Sharing with:</b> {entries.length ? entries.map((entry) => entry.name).join(', ') : 'Nobody selected'}</p><p className="mt-1 text-muted-foreground">Sharing grants access only. It does not submit this document for approval.</p></section>
        </div>

        <footer className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-card px-4 pb-[max(var(--safe-area-bottom),0.75rem)] pt-3 sm:px-5 sm:pb-4"><button onClick={onClose} className="rounded-lg border px-3 py-2 text-xs font-medium">Cancel</button><button onClick={share} disabled={saving || !entries.length} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Share</button></footer>
      </div>
    </div>
  );
};

export default WorkspaceShareModal;
