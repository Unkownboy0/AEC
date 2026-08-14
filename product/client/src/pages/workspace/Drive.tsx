import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Folder, Upload, Plus, Search, Star, MoreVertical, Trash2, Share2,
  RotateCcw, Loader2, AlertTriangle, Users, Building2, Clock, FolderPlus,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

type WorkspaceFile = {
  id: string; name: string; type: string; ownerId: string; departmentId: string | null;
  folderId: string | null; scope: string; status: string; currentVersion: number;
  createdAt: string; updatedAt: string; starred: boolean;
};
type Template = { key: string; name: string; category: string };

const VIEWS: Array<{ id: string; label: string; icon: any }> = [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'my', label: 'My Files', icon: FileText },
  { id: 'shared', label: 'Shared With Me', icon: Users },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'department', label: 'Department Files', icon: Building2 },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const fmtDate = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const Drive: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('recent');
  const [q, setQ] = useState('');
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<WorkspaceFile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/workspace/files', { params: { view, q: q || undefined } });
      setFiles(res.data?.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load Campus Workspace files.');
    } finally {
      setLoading(false);
    }
  }, [view, q]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void api.get('/workspace/doc-templates').then((res) => setTemplates(res.data?.data ?? [])).catch(() => {}); }, []);

  const createDocument = async (templateKey: string, name?: string) => {
    try {
      const res = await api.post('/workspace/documents', { name: name || `Untitled document`, templateKey });
      setShowTemplates(false);
      setShowCreateMenu(false);
      navigate(`/workspace/docs/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the document.');
    }
  };

  const createFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name?.trim()) return;
    try {
      await api.post('/workspace/folders', { name: name.trim() });
      toast.success('Folder created.');
      setShowCreateMenu(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the folder.');
    }
  };

  const upload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result).split(',')[1];
      try {
        await api.post('/workspace/upload', { name: file.name, mimeType: file.type, base64 });
        toast.success(`Uploaded "${file.name}".`);
        setShowCreateMenu(false);
        void load();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Upload failed.');
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleStar = async (file: WorkspaceFile) => {
    try {
      await api.post(`/workspace/files/${file.id}/star`, { starred: !file.starred });
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, starred: !f.starred } : f)));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update star.');
    }
  };

  const trashOrRestore = async (file: WorkspaceFile) => {
    try {
      if (view === 'trash') await api.post(`/workspace/files/${file.id}/restore`);
      else await api.delete(`/workspace/files/${file.id}`);
      toast.success(view === 'trash' ? 'File restored.' : 'Moved to trash.');
      setMenuFor(null);
      void load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const openFile = (file: WorkspaceFile) => {
    if (file.type === 'DOCUMENT') navigate(`/workspace/docs/${file.id}`);
    else window.open(`/api/workspace/files/${file.id}/download`, '_blank');
  };

  const visible = useMemo(() => files, [files]);

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-5 pb-16">
      <header className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card px-6 py-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary"><FolderKanbanFallback /> Campus Workspace</div>
          <h1 className="text-3xl font-extrabold tracking-[-0.035em]">Docs, files and shared drive</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Create documents from institutional templates, upload files, and share within your department or the institution — permissions are enforced on every open.</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowCreateMenu((v) => !v)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> New
          </button>
          {showCreateMenu && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-xl">
              <button onClick={() => { setShowTemplates(true); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-muted"><FileText className="h-4 w-4 text-primary" /> Document</button>
              <button onClick={createFolder} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-muted"><FolderPlus className="h-4 w-4 text-primary" /> Folder</button>
              <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-muted">
                <Upload className="h-4 w-4 text-primary" /> Upload file
                <input type="file" className="hidden" onChange={(e) => void upload(e.target.files)} />
              </label>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return <button key={v.id} onClick={() => setView(v.id)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${view === v.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}><Icon className="h-4 w-4" />{v.label}</button>;
          })}
        </nav>
        <label className="relative block w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files by name" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
      </div>

      {error && <section role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5"><AlertTriangle className="h-5 w-5 text-rose-500" /><p className="text-sm">{error}</p></section>}

      <section className="rounded-2xl border border-border/75 bg-card">
        {loading ? (
          <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center"><div><Folder className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">Nothing here yet</p><p className="mt-1 text-sm text-muted-foreground">Create a document or upload a file to get started.</p></div></div>
        ) : (
          <div className="divide-y divide-border/60">
            {visible.map((file) => (
              <div key={file.id} className="group flex items-center gap-4 px-5 py-3.5">
                <button onClick={() => openFile(file)} className="flex flex-1 items-center gap-3 text-left">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{file.type === 'DOCUMENT' ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}</div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{file.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{file.scope === 'PERSONAL' ? 'Private' : file.scope === 'DEPARTMENT' ? 'Department' : 'Institution'} · v{file.currentVersion} · {fmtDate(file.updatedAt)}{file.status !== 'DRAFT' ? ` · ${file.status}` : ''}</p>
                  </div>
                </button>
                <button onClick={() => void toggleStar(file)} className="rounded-lg p-2 hover:bg-muted" aria-label="Star"><Star className={`h-4 w-4 ${file.starred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} /></button>
                <div className="relative">
                  <button onClick={() => setMenuFor(menuFor === file.id ? null : file.id)} className="rounded-lg p-2 hover:bg-muted"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
                  {menuFor === file.id && (
                    <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                      {view !== 'trash' && file.type === 'DOCUMENT' && <button onClick={() => { setShareFor(file); setMenuFor(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"><Share2 className="h-4 w-4" /> Share</button>}
                      <button onClick={() => void trashOrRestore(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-500/10">{view === 'trash' ? <><RotateCcw className="h-4 w-4" /> Restore</> : <><Trash2 className="h-4 w-4" /> Move to trash</>}</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showTemplates && (
        <TemplatePicker templates={templates} onClose={() => setShowTemplates(false)} onPick={(key) => void createDocument(key)} />
      )}
      {shareFor && <ShareDialog file={shareFor} onClose={() => setShareFor(null)} />}
    </main>
  );
};

const FolderKanbanFallback: React.FC = () => <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />;

const TemplatePicker: React.FC<{ templates: Template[]; onClose: () => void; onPick: (key: string) => void }> = ({ templates, onClose, onPick }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
    <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-lg font-bold">Choose a template</h2>
      <p className="mt-1 text-sm text-muted-foreground">Institution data auto-fills where available.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {templates.map((t) => (
          <button key={t.key} onClick={() => onPick(t.key)} className="rounded-xl border border-border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5">
            <p className="font-semibold">{t.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.category}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
);

type Share = { id: string; scope: string; userId: string | null; roleName: string | null; departmentId: string | null; permission: string };

const ShareDialog: React.FC<{ file: WorkspaceFile; onClose: () => void }> = ({ file, onClose }) => {
  const [shares, setShares] = useState<Share[]>([]);
  const [scope, setScope] = useState('ROLE');
  const [target, setTarget] = useState('');
  const [permission, setPermission] = useState('VIEWER');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setShares((await api.get(`/workspace/files/${file.id}/shares`)).data?.data ?? []); } catch { /* owner-only endpoint */ }
    finally { setLoading(false); }
  }, [file.id]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (scope !== 'INSTITUTION' && !target.trim()) return;
    try {
      await api.post(`/workspace/files/${file.id}/shares`, {
        scope, permission,
        userId: scope === 'USER' ? target.trim() : undefined,
        roleName: scope === 'ROLE' ? target.trim() : undefined,
        departmentId: scope === 'DEPARTMENT' ? target.trim() : undefined,
      });
      setTarget('');
      void load();
      toast.success('Shared.');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Could not share.'); }
  };

  const remove = async (shareId: string) => {
    try { await api.delete(`/workspace/files/${file.id}/shares/${shareId}`); void load(); } catch (err: any) { toast.error(err.response?.data?.message || 'Could not remove share.'); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Share "{file.name}"</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-2 text-sm"><option value="USER">User (by ID)</option><option value="ROLE">Role name</option><option value="DEPARTMENT">Department (by ID)</option><option value="INSTITUTION">Whole institution</option></select>
          {scope !== 'INSTITUTION' && <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={scope === 'ROLE' ? 'e.g. HOD' : 'ID'} className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm" />}
          <select value={permission} onChange={(e) => setPermission(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-2 text-sm"><option value="VIEWER">Viewer</option><option value="COMMENTER">Commenter</option><option value="EDITOR">Editor</option></select>
          <button onClick={() => void add()} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Share</button>
        </div>
        <div className="mt-5 max-h-56 space-y-2 overflow-y-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : shares.length === 0 ? <p className="text-sm text-muted-foreground">Not shared with anyone yet.</p> : shares.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span>{s.scope}: {s.userId || s.roleName || s.departmentId || 'Everyone'} — {s.permission}</span>
              <button onClick={() => void remove(s.id)} className="text-rose-600 hover:underline">Remove</button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-xl border border-border py-2.5 text-sm font-semibold">Close</button>
      </div>
    </div>
  );
};

export default Drive;
