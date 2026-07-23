import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Download, Eye, Edit2, Trash2, X, Upload, ImageIcon,
  FileText, CheckCircle, Archive, Clock, Send, Users, CheckSquare
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

type CircularStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type CircularPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface CircularImage {
  url: string;
  name: string;
  size: number;
}

interface Circular {
  id: string;
  title: string;
  category: string;
  priority: CircularPriority;
  description: string;
  content: string;
  status: CircularStatus;
  images: CircularImage[];
  attachmentUrl?: string;
  attachmentName?: string;
  publishedAt?: string;
  createdAt: string;
  isRead?: boolean;
}

interface RecipientStat {
  id: string;
  status: string;
  readAt?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface CircularStats {
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
  recipients: RecipientStat[];
}

const CATEGORIES = ['Academic', 'Examination', 'Event', 'Placement', 'Administrative', 'Holiday', 'Faculty', 'Other'];
const PRIORITIES: CircularPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const priorityConfig: Record<CircularPriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  NORMAL: { label: 'Normal', color: 'bg-sky-50 text-sky-600 border-sky-200' },
  HIGH: { label: 'High', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  URGENT: { label: 'Urgent', color: 'bg-rose-50 text-rose-600 border-rose-200' },
};

const statusConfig: Record<CircularStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Clock className="h-3 w-3" /> },
  PUBLISHED: { label: 'Published', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle className="h-3 w-3" /> },
  ARCHIVED: { label: 'Archived', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: <Archive className="h-3 w-3" /> },
};

const initialForm: Omit<Circular, 'id' | 'createdAt'> = {
  title: '',
  category: 'Academic',
  priority: 'NORMAL',
  description: '',
  content: '',
  status: 'DRAFT',
  images: [],
  attachmentUrl: '',
  attachmentName: '',
};

export const CircularManagement: React.FC = () => {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CircularStatus>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [viewCircular, setViewCircular] = useState<Circular | null>(null);
  const [viewStats, setViewStats] = useState<CircularStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...initialForm });
  const [imageUploading, setImageUploading] = useState(false);
  const [attachUploading, setAttachUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/circulars');
      if (res.data?.status === 'success') {
        setCirculars(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load department circulars.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCircularStats = async (circularId: string) => {
    setIsLoadingStats(true);
    try {
      const res = await api.get(`/circulars/${circularId}/stats`);
      if (res.data?.status === 'success') {
        setViewStats(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load read stats.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const invalidFiles = files.filter(f => !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type));
    if (invalidFiles.length > 0) { toast.error('Only JPG, PNG, WEBP images are allowed.'); return; }
    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) { toast.error('Each image must be under 10MB.'); return; }

    setImageUploading(true);
    try {
      const uploadedImages: CircularImage[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const rawBase64 = await base64Promise;
        const base64Data = rawBase64.includes(';base64,') ? rawBase64.split(';base64,')[1] : rawBase64;

        const res = await api.post('/files/upload', {
          name: file.name,
          mimeType: file.type,
          folder: '/circulars/images',
          base64: base64Data
        });
        if (res.data?.status === 'success') {
          uploadedImages.push({ url: res.data.data.path, name: file.name, size: file.size });
        }
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...uploadedImages] }));
      toast.success(`${uploadedImages.length} image(s) uploaded successfully.`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to upload image due to network or permission error.';
      toast.error(errorMsg);
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel'
    ];
    const isAllowedType = allowedTypes.includes(file.type) || file.name.match(/\.(pdf|docx|xlsx|pptx|zip|txt|csv|xls)$/i);

    if (!isAllowedType) {
      toast.error('Only PDF, DOCX, XLSX, PPTX, ZIP, or TXT files are allowed for attachments.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) { 
      toast.error('Attachment must be under 25MB.'); 
      return; 
    }

    setAttachUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const rawBase64 = await base64Promise;
      const base64Data = rawBase64.includes(';base64,') ? rawBase64.split(';base64,')[1] : rawBase64;

      const res = await api.post('/files/upload', {
        name: file.name,
        mimeType: file.type,
        folder: '/circulars/attachments',
        base64: base64Data
      });
      if (res.data?.status === 'success') {
        setForm(prev => ({ ...prev, attachmentUrl: res.data.data.path, attachmentName: file.name }));
        toast.success(`Attachment "${file.name}" uploaded successfully.`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to upload attachment due to network or permission error.';
      toast.error(errorMsg);
    } finally {
      setAttachUploading(false);
      if (attachInputRef.current) attachInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idx: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (targetStatus: CircularStatus) => {
    if (!form.title.trim()) { toast.error('Circular title is required.'); return; }
    if (!form.content.trim()) { toast.error('Circular content is required.'); return; }

    setIsSaving(true);
    try {
      const payload = { ...form, status: targetStatus };
      if (editingId) {
        await api.put(`/circulars/${editingId}`, payload);
        toast.success('Circular updated successfully.');
      } else {
        await api.post('/circulars', payload);
        toast.success(targetStatus === 'PUBLISHED' ? 'Circular published successfully!' : 'Circular saved as draft.');
      }
      setShowEditor(false);
      setEditingId(null);
      setForm({ ...initialForm });
      fetchCirculars();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save circular.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (c: Circular) => {
    setForm({ title: c.title, category: c.category, priority: c.priority, description: c.description, content: c.content, status: c.status, images: c.images, attachmentUrl: c.attachmentUrl, attachmentName: c.attachmentName });
    setEditingId(c.id);
    setShowEditor(true);
    setViewCircular(null);
  };

  const handleArchive = async (id: string) => {
    try {
      await api.put(`/circulars/${id}`, { status: 'ARCHIVED' });
      toast.success('Circular archived.');
      fetchCirculars();
    } catch (err) {
      toast.error('Failed to archive circular.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this circular?')) return;
    try {
      await api.delete(`/circulars/${id}`);
      toast.success('Circular deleted.');
      fetchCirculars();
    } catch (err) {
      toast.error('Failed to delete circular.');
    }
  };

  const openNew = () => {
    setForm({ ...initialForm });
    setEditingId(null);
    setShowEditor(true);
    setViewCircular(null);
  };

  const handleView = (c: Circular) => {
    setViewCircular(c);
    setViewStats(null);
    if (c.status === 'PUBLISHED') {
      fetchCircularStats(c.id);
    }
  };

  const filtered = circulars.filter(c => {
    const matchSearch = searchTerm === '' || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loading text="Loading Circulars..." /></div>;

  if (viewCircular) {
    const cfg = statusConfig[viewCircular.status];
    const pCfg = priorityConfig[viewCircular.priority];
    return (
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => { setViewCircular(null); setViewStats(null); }} className="p-2 hover:bg-muted rounded-lg border">
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-extrabold uppercase truncate">{viewCircular.title}</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 border bg-card p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase flex items-center gap-1 ${cfg.color}`}>{cfg.icon}{cfg.label}</span>
              <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${pCfg.color}`}>{pCfg.label}</span>
              <span className="border px-2 py-0.5 rounded text-[9px] font-bold text-muted-foreground bg-muted">{viewCircular.category}</span>
              <span className="text-[9px] text-muted-foreground ml-auto">{new Date(viewCircular.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            {viewCircular.description && <p className="text-xs font-semibold text-muted-foreground italic">{viewCircular.description}</p>}
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap border-t pt-4">{viewCircular.content}</div>
            
            {viewCircular.images.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Attached Images</p>
                <div className="grid grid-cols-2 gap-3">
                  {viewCircular.images.map((img, idx) => (
                    <div key={idx} className="border rounded-xl overflow-hidden bg-muted/20">
                      <img src={img.url} alt={img.name} className="w-full h-32 object-cover" />
                      <p className="text-[9px] font-semibold text-muted-foreground px-2 py-1 truncate">{img.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {viewCircular.attachmentUrl && (
              <div className="border-t pt-4">
                <a href={viewCircular.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20">
                  <Download className="h-3.5 w-3.5" /> Download Attachment: {viewCircular.attachmentName}
                </a>
              </div>
            )}
            
            <div className="border-t pt-4 flex gap-3">
              <button type="button" onClick={() => handleEdit(viewCircular)} className="px-4 py-2 border bg-card hover:bg-muted rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
              {viewCircular.status !== 'ARCHIVED' && (
                <button type="button" onClick={() => { handleArchive(viewCircular.id); setViewCircular(null); }} className="px-4 py-2 border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center gap-1.5"><Archive className="h-3.5 w-3.5" /> Archive</button>
              )}
            </div>
          </div>

          {/* Delivery & Read Tracker Stats */}
          {viewCircular.status === 'PUBLISHED' && (
            <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
              <SectionHeader icon={<Users className="h-4 w-4" />} title="Recipients Read Status" />
              {isLoadingStats ? (
                <Loading text="Loading stats..." />
              ) : viewStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border rounded-xl p-2 bg-slate-50">
                      <span className="text-lg font-black block">{viewStats.totalRecipients}</span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Recipients</span>
                    </div>
                    <div className="border rounded-xl p-2 bg-emerald-50 text-emerald-700">
                      <span className="text-lg font-black block">{viewStats.readCount}</span>
                      <span className="text-[8px] font-bold uppercase">Read</span>
                    </div>
                    <div className="border rounded-xl p-2 bg-rose-50 text-rose-700">
                      <span className="text-lg font-black block">{viewStats.unreadCount}</span>
                      <span className="text-[8px] font-bold uppercase">Unread</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto divide-y pr-1">
                    {viewStats.recipients.map((rec) => (
                      <div key={rec.id} className="pt-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold">{rec.user.firstName} {rec.user.lastName}</p>
                          <p className="text-[9px] text-muted-foreground">{rec.user.email}</p>
                        </div>
                        <span className={`border px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          rec.status === 'READ' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {rec.status === 'READ' ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No stats available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Editor view toggle, form header, categories filters list, list view Cards same as standard */}
      {showEditor ? (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold uppercase">{editingId ? 'Edit Circular' : 'New Circular'}</h2>
            <button type="button" onClick={() => { setShowEditor(false); setEditingId(null); setForm({ ...initialForm }); }} className="p-2 hover:bg-muted rounded-lg border"><X className="h-4 w-4" /></button>
          </div>

          <div className="border bg-card p-6 rounded-2xl shadow-sm space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Circular Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter circular title..." className="h-10 w-full border rounded-lg bg-background px-3 text-sm font-semibold" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="h-10 w-full border rounded-lg bg-background px-3 text-xs font-semibold">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as CircularPriority }))} className="h-10 w-full border rounded-lg bg-background px-3 text-xs font-semibold">
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Short Description</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief one-line summary..." className="h-9 w-full border rounded-lg bg-background px-3 text-xs font-semibold" />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Circular Content *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={8}
                placeholder="Enter the full circular content here..."
                className="w-full border rounded-lg bg-background px-3 py-2.5 text-xs font-semibold resize-none"
              />
            </div>

            {/* Images Dropzone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Images</label>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                  className="px-3 py-1.5 border bg-card hover:bg-muted rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                >
                  {imageUploading ? <div className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div> : <ImageIcon className="h-3.5 w-3.5 text-primary" />}
                  Upload
                </button>
                <input ref={imageInputRef} type="file" className="hidden" accept="image/jpg,image/jpeg,image/png,image/webp" multiple onChange={handleImageUpload} />
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative border rounded-xl overflow-hidden group">
                      <img src={img.url} alt={img.name} className="w-full h-28 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">File Attachment</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  disabled={attachUploading}
                  className="px-3 py-2 border bg-card hover:bg-muted rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                >
                  {attachUploading ? <div className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div> : <Upload className="h-3.5 w-3.5" />}
                  Upload Attachment
                </button>
                <input ref={attachInputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.pptx,.zip,.txt,.csv,.xls" onChange={handleAttachmentUpload} />
                {form.attachmentName && (
                  <div className="flex items-center gap-2 border bg-emerald-50 border-emerald-200 px-3 py-1.5 rounded-lg">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700">{form.attachmentName}</span>
                    <button type="button" onClick={() => setForm(p => ({ ...p, attachmentUrl: '', attachmentName: '' }))} className="text-rose-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowEditor(false); setEditingId(null); setForm({ ...initialForm }); }} className="px-4 py-2 border bg-card hover:bg-muted rounded-lg text-xs font-bold">Cancel</button>
              <button type="button" onClick={() => handleSave('DRAFT')} disabled={isSaving} className="px-4 py-2 border bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Save Draft</button>
              <button type="button" onClick={() => handleSave('PUBLISHED')} disabled={isSaving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                {isSaving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="h-3.5 w-3.5" />}
                Publish Circular
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">Circular Management</h2>
              <p className="text-xs text-muted-foreground font-semibold">Publish, Manage & Archive Department Circulars with Image & File Attachments</p>
            </div>
            <button
              type="button"
              onClick={openNew}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-primary/90 w-fit"
            >
              <Plus className="h-4 w-4" /> New Circular
            </button>
          </div>

          {/* Status KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(statusConfig) as CircularStatus[]).map(st => {
              const cfg = statusConfig[st];
              const count = circulars.filter(c => c.status === st).length;
              return (
                <div
                  key={st}
                  onClick={() => setStatusFilter(statusFilter === st ? 'all' : st)}
                  className={`border p-4 rounded-2xl shadow-sm cursor-pointer text-center transition-all hover:shadow-md ${statusFilter === st ? 'ring-2 ring-primary' : ''} bg-card`}
                >
                  <span className={`text-2xl font-black block`}>{count}</span>
                  <span className={`text-[9px] uppercase font-bold mt-1 block ${cfg.color.split(' ')[1]}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search circulars..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9 w-full border rounded-lg bg-background pl-9 pr-3 text-xs font-semibold" />
            </div>
            <div className="flex border rounded-lg overflow-hidden text-xs font-bold">
              {(['all', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 border-r last:border-r-0 ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted text-muted-foreground'}`}
                >
                  {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="border bg-card rounded-2xl p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No circulars found.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first circular using the button above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => {
                const cfg = statusConfig[c.status];
                const pCfg = priorityConfig[c.priority];
                return (
                  <div key={c.id} className="border bg-card p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase flex items-center gap-1 ${cfg.color}`}>{cfg.icon}{cfg.label}</span>
                          <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${pCfg.color}`}>{pCfg.label}</span>
                          <span className="border px-2 py-0.5 rounded text-[9px] font-bold text-muted-foreground bg-muted">{c.category}</span>
                        </div>
                        <h3 className="text-sm font-bold">{c.title}</h3>
                        {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                        <p className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => handleView(c)} className="p-2 hover:bg-muted rounded-lg border" title="View"><Eye className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => handleEdit(c)} className="p-2 hover:bg-muted rounded-lg border" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                        {c.status !== 'ARCHIVED' && <button type="button" onClick={() => handleArchive(c.id)} className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg border" title="Archive"><Archive className="h-3.5 w-3.5" /></button>}
                        <button type="button" onClick={() => handleDelete(c.id)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg border" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 border-b pb-3 mb-4">
    <span className="text-primary">{icon}</span>
    <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">{title}</h4>
  </div>
);

export default CircularManagement;
