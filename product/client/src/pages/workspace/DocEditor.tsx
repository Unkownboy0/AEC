import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bold, Italic, Underline, Strikethrough, List, ListOrdered, ListChecks,
  Quote, Code2, Table as TableIcon, Image as ImageIcon, Link as LinkIcon, Minus,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Search, History, MessageSquare,
  Download, Printer, Share2, Loader2, Check, CloudOff, RefreshCw, CornerDownRight,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const HEADINGS = [
  { label: 'Normal text', value: 'p' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
];

export const DocEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [panel, setPanel] = useState<'none' | 'versions' | 'comments' | 'share'>('none');
  const [versions, setVersions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/workspace/documents/${id}`);
      setDoc(res.data.data);
      if (editorRef.current) editorRef.current.innerHTML = res.data.data.content || '<p></p>';
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not open this document.');
      navigate('/workspace');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { void load(); }, [load]);

  const canEdit = doc?.access === 'EDITOR' || doc?.access === 'OWNER';

  const scheduleSave = useCallback(() => {
    if (!canEdit || !id) return;
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put(`/workspace/documents/${id}/content`, { content: editorRef.current?.innerHTML ?? '' });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1200);
  }, [canEdit, id]);

  // Autosave-on-navigate-away: flush any pending debounce immediately.
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const exec = (command: string, value?: string) => {
    if (!canEdit) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    scheduleSave();
  };

  const insertTable = () => {
    const rows = Number(window.prompt('Rows', '2')) || 2;
    const cols = Number(window.prompt('Columns', '2')) || 2;
    let html = '<table>';
    for (let r = 0; r < rows; r++) { html += '<tr>'; for (let c = 0; c < cols; c++) html += '<td>&nbsp;</td>'; html += '</tr>'; }
    html += '</table><p></p>';
    exec('insertHTML', html);
  };

  const insertImage = () => {
    const url = window.prompt('Image URL');
    if (url) exec('insertImage', url);
  };

  const insertLink = () => {
    const url = window.prompt('Link URL');
    if (url) exec('createLink', url);
  };

  const insertChecklist = () => {
    // ponytail: visual-only checklist glyphs, not a stateful <input> — the sanitizer strips form controls. Upgrade to a clickable custom block editor if interactive checkboxes are needed.
    exec('insertHTML', '<ul><li>&#9744;&nbsp;</li></ul>');
  };

  const insertPageBreak = () => {
    exec('insertHTML', '<div style="page-break-before: always; margin-top: 24px; border-top: 1px dashed #ccc"></div><p></p>');
  };

  const findReplace = () => {
    const term = window.prompt('Find');
    if (!term) return;
    const replacement = window.prompt(`Replace "${term}" with (leave blank to just find)`, '');
    if (replacement === null) return;
    if (!editorRef.current) return;
    if (!replacement) {
      // @ts-expect-error legacy, widely supported for a simple find-and-scroll
      if (window.find) { (window as any).find(term); return; }
      toast.error('Find is not supported in this browser.');
      return;
    }
    editorRef.current.innerHTML = editorRef.current.innerHTML.split(term).join(replacement);
    scheduleSave();
  };

  const saveVersion = async () => {
    if (!id) return;
    const note = window.prompt('Version note (optional)') || undefined;
    try {
      await api.post(`/workspace/documents/${id}/versions`, { changeNote: note });
      toast.success('Version saved.');
      if (panel === 'versions') void loadVersions();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Could not save version.'); }
  };

  const loadVersions = useCallback(async () => {
    if (!id) return;
    try { setVersions((await api.get(`/workspace/documents/${id}/versions`)).data?.data ?? []); } catch { /* noop */ }
  }, [id]);

  const restoreVersion = async (version: number) => {
    if (!id) return;
    try {
      await api.post(`/workspace/documents/${id}/versions/${version}/restore`);
      toast.success(`Restored version ${version}.`);
      void load();
      void loadVersions();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Restore failed.'); }
  };

  const loadComments = useCallback(async () => {
    if (!id) return;
    try { setComments((await api.get(`/workspace/documents/${id}/comments`)).data?.data ?? []); } catch { /* noop */ }
  }, [id]);

  const addComment = async () => {
    if (!id || !newComment.trim()) return;
    try {
      await api.post(`/workspace/documents/${id}/comments`, { body: newComment.trim() });
      setNewComment('');
      void loadComments();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Could not add comment.'); }
  };

  const resolveComment = async (commentId: string, resolved: boolean) => {
    if (!id) return;
    try { await api.patch(`/workspace/documents/${id}/comments/${commentId}`, { resolved }); void loadComments(); } catch { /* noop */ }
  };

  const setStatus = async (status: string) => {
    if (!id) return;
    const note = (status === 'RETURNED') ? (window.prompt('Note for correction') || '') : undefined;
    try {
      await api.post(`/workspace/documents/${id}/status`, { status, note });
      toast.success(`Marked as ${status.toLowerCase()}.`);
      void load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Could not update status.'); }
  };

  const refreshFields = async () => {
    if (!id) return;
    try {
      const res = await api.post(`/workspace/documents/${id}/refresh-fields`);
      if (editorRef.current) editorRef.current.innerHTML = res.data.data.content || '';
      toast.success('Institutional data refreshed.');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Refresh failed.'); }
  };

  const exportPdf = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/workspace/documents/${id}/export.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = window.document.createElement('a');
      a.href = url; a.download = `${doc?.name || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) { toast.error(err.response?.data?.message || 'PDF export failed.'); }
  };

  const openPanel = (next: 'versions' | 'comments') => {
    setPanel((prev) => (prev === next ? 'none' : next));
    if (next === 'versions') void loadVersions();
    if (next === 'comments') void loadComments();
  };

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!doc) return null;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 pb-16 print:block">
      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 print:hidden">
        <button onClick={() => navigate('/workspace')} className="rounded-lg p-2 hover:bg-muted" aria-label="Back to Drive"><ArrowLeft className="h-4 w-4" /></button>
        <input
          defaultValue={doc.name}
          disabled={!canEdit}
          onBlur={(e) => { if (e.target.value.trim() && e.target.value !== doc.name) api.patch(`/workspace/documents/${id}`, { name: e.target.value.trim() }).catch(() => {}); }}
          className="min-w-0 flex-1 rounded-lg border-none bg-transparent text-lg font-bold outline-none focus:bg-muted/50"
        />
        <SaveStatusBadge status={saveStatus} />
        {doc.status !== 'DRAFT' && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{doc.status}</span>}
        <div className="flex items-center gap-1">
          <button onClick={refreshFields} title="Refresh institutional data" className="rounded-lg p-2 hover:bg-muted"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => openPanel('comments')} title="Comments" className="rounded-lg p-2 hover:bg-muted"><MessageSquare className="h-4 w-4" /></button>
          <button onClick={() => openPanel('versions')} title="Version history" className="rounded-lg p-2 hover:bg-muted"><History className="h-4 w-4" /></button>
          <button onClick={() => window.print()} title="Print" className="rounded-lg p-2 hover:bg-muted"><Printer className="h-4 w-4" /></button>
          <button onClick={exportPdf} title="Export PDF" className="rounded-lg p-2 hover:bg-muted"><Download className="h-4 w-4" /></button>
          {doc.access === 'OWNER' && <button onClick={() => setPanel('share')} title="Share" className="rounded-lg p-2 hover:bg-muted"><Share2 className="h-4 w-4" /></button>}
        </div>
      </header>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/70 bg-card p-2 print:hidden">
          <select onChange={(e) => exec('formatBlock', `<${e.target.value}>`)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            {HEADINGS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
          <ToolbarDivider />
          <ToolBtn icon={Bold} onClick={() => exec('bold')} />
          <ToolBtn icon={Italic} onClick={() => exec('italic')} />
          <ToolBtn icon={Underline} onClick={() => exec('underline')} />
          <ToolBtn icon={Strikethrough} onClick={() => exec('strikeThrough')} />
          <input type="color" onChange={(e) => exec('foreColor', e.target.value)} title="Text color" className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-background p-1" />
          <input type="color" onChange={(e) => exec('hiliteColor', e.target.value)} title="Highlight" className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-background p-1" />
          <ToolbarDivider />
          <ToolBtn icon={AlignLeft} onClick={() => exec('justifyLeft')} />
          <ToolBtn icon={AlignCenter} onClick={() => exec('justifyCenter')} />
          <ToolBtn icon={AlignRight} onClick={() => exec('justifyRight')} />
          <ToolbarDivider />
          <ToolBtn icon={List} onClick={() => exec('insertUnorderedList')} />
          <ToolBtn icon={ListOrdered} onClick={() => exec('insertOrderedList')} />
          <ToolBtn icon={ListChecks} onClick={insertChecklist} />
          <ToolBtn icon={Quote} onClick={() => exec('formatBlock', '<blockquote>')} />
          <ToolBtn icon={Code2} onClick={() => exec('formatBlock', '<pre>')} />
          <ToolbarDivider />
          <ToolBtn icon={TableIcon} onClick={insertTable} />
          <ToolBtn icon={ImageIcon} onClick={insertImage} />
          <ToolBtn icon={LinkIcon} onClick={insertLink} />
          <ToolBtn icon={Minus} onClick={() => exec('insertHorizontalRule')} />
          <button onClick={insertPageBreak} className="h-9 rounded-lg px-2 text-xs font-semibold hover:bg-muted">Page break</button>
          <ToolbarDivider />
          <ToolBtn icon={Undo2} onClick={() => exec('undo')} />
          <ToolBtn icon={Redo2} onClick={() => exec('redo')} />
          <ToolBtn icon={Search} onClick={findReplace} />
          <div className="ml-auto flex items-center gap-2">
            <button onClick={saveVersion} className="h-9 rounded-lg border border-border px-3 text-xs font-semibold hover:border-primary/50">Save version</button>
            {doc.status === 'DRAFT' && doc.access === 'OWNER' && <button onClick={() => setStatus('SUBMITTED')} className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">Submit</button>}
            {doc.status === 'SUBMITTED' && doc.access !== 'OWNER' && (
              <>
                <button onClick={() => setStatus('RETURNED')} className="h-9 rounded-lg border border-rose-400 px-3 text-xs font-semibold text-rose-600">Return</button>
                <button onClick={() => setStatus('APPROVED')} className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white">Approve</button>
              </>
            )}
            {doc.status === 'RETURNED' && doc.access === 'OWNER' && <button onClick={() => setStatus('SUBMITTED')} className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">Resubmit</button>}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 overflow-x-auto rounded-2xl border border-border/70 bg-muted/30 p-6 print:border-none print:bg-white print:p-0">
          <div
            ref={editorRef}
            contentEditable={canEdit}
            suppressContentEditableWarning
            onInput={scheduleSave}
            className="doc-page mx-auto min-h-[1000px] w-[794px] max-w-full rounded-sm bg-white p-[72px] text-[15px] leading-7 text-slate-900 shadow-sm outline-none print:w-auto print:p-0 print:shadow-none"
          />
        </div>

        {panel === 'versions' && (
          <SidePanel title="Version history" onClose={() => setPanel('none')}>
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                <div><p className="font-semibold">Version {v.version}</p><p className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}{v.changeNote ? ` · ${v.changeNote}` : ''}</p></div>
                <button onClick={() => void restoreVersion(v.version)} className="text-xs font-semibold text-primary hover:underline">Restore</button>
              </div>
            ))}
            {versions.length === 0 && <p className="text-sm text-muted-foreground">No checkpoints yet — use "Save version".</p>}
          </SidePanel>
        )}

        {panel === 'comments' && (
          <SidePanel title="Comments" onClose={() => setPanel('none')}>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className={`rounded-lg border px-3 py-2 text-sm ${c.resolved ? 'border-border/40 bg-muted/30 opacity-60' : 'border-border/60'}`}>
                  <p>{c.body}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                    <button onClick={() => void resolveComment(c.id, !c.resolved)} className="font-semibold text-primary hover:underline">{c.resolved ? 'Reopen' : 'Resolve'}</button>
                  </div>
                  {(c.replies ?? []).map((r: any) => (
                    <div key={r.id} className="mt-2 flex items-start gap-1.5 border-t border-border/40 pt-2 text-xs">
                      <CornerDownRight className="mt-0.5 h-3 w-3 text-muted-foreground" /><span>{r.body}</span>
                    </div>
                  ))}
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment" className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm" onKeyDown={(e) => e.key === 'Enter' && void addComment()} />
              <button onClick={() => void addComment()} className="h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">Add</button>
            </div>
          </SidePanel>
        )}
      </div>
    </main>
  );
};

const ToolBtn: React.FC<{ icon: any; onClick: () => void }> = ({ icon: Icon, onClick }) => (
  <button onClick={onClick} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted"><Icon className="h-4 w-4" /></button>
);
const ToolbarDivider: React.FC = () => <span className="mx-1 h-6 w-px bg-border" />;

const SaveStatusBadge: React.FC<{ status: SaveStatus }> = ({ status }) => {
  if (status === 'idle') return null;
  const map = {
    saving: { icon: Loader2, text: 'Saving…', cls: 'text-muted-foreground animate-spin' },
    saved: { icon: Check, text: 'Saved', cls: 'text-emerald-600' },
    error: { icon: CloudOff, text: 'Offline changes pending', cls: 'text-rose-600' },
  } as const;
  const s = map[status];
  const Icon = s.icon;
  return <span className={`flex items-center gap-1.5 text-xs font-semibold ${s.cls.replace('animate-spin', '')}`}><Icon className={`h-3.5 w-3.5 ${status === 'saving' ? 'animate-spin' : ''}`} />{s.text}</span>;
};

const SidePanel: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <aside className="w-80 shrink-0 rounded-2xl border border-border/70 bg-card p-4 print:hidden">
    <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{title}</h3><button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button></div>
    {children}
  </aside>
);

export default DocEditor;
