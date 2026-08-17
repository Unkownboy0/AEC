import React, { useState, useEffect, useRef } from 'react';
import { Bell, Send, ImagePlus, X, FileImage, RefreshCw, Trash2, Eye, Activity, Inbox } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import api from '../../lib/axios';
import { env } from '../../shared/config/environment';
import { UnifiedNotificationInbox } from '../../components/notifications/UnifiedNotificationInbox';
import { NotificationControlCenter } from './NotificationControlCenter';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const NotificationCenter: React.FC = () => {
  const [mainTab, setMainTab] = useState<'INBOX' | 'CIRCULARS' | 'DIAGNOSTICS'>('INBOX');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewCircular, setViewCircular] = useState<any | null>(null);

  // Form fields
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');
  const [category, setCategory]   = useState('ANNOUNCEMENT');
  const [priority, setPriority]   = useState('NORMAL');
  const [audience, setAudience]   = useState('ALL');
  const [publishDate, setPublishDate] = useState('');
  const [expiryDate, setExpiryDate]   = useState('');

  // Image attachment state
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageB64, setImageB64]         = useState<string | null>(null);
  const [imageError, setImageError]     = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadCirculars = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data?.status === 'success') {
        setAnnouncements(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCirculars();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setImageError(`Image exceeds the 10 MB maximum. (${formatBytes(file.size)})`);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      // Strip the data URL prefix for the backend
      setImageB64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageB64(null);
    setImageError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and Body Content are required.');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      // 1. Upload image to Media Storage if one was selected
      if (imageFile && imageB64) {
        const uploadRes = await api.post('/files/upload', {
          name: imageFile.name,
          mimeType: imageFile.type,
          base64: imageB64,
          folder: '/circulars',
        });
        if (uploadRes.data?.status === 'success') {
          imageUrl = uploadRes.data.data.path;
        } else {
          toast.error('Image upload failed. Circular will be saved without image.');
        }
      }

      // 2. Create the circular/notification
      const res = await api.post('/notifications', {
        title: title.trim(),
        content: body.trim(),
        type: category,
        imageUrl,
      });

      if (res.data?.status === 'success') {
        toast.success('Circular published and dispatched to recipients!');
        // Reset form
        setTitle(''); setBody('');
        setCategory('ANNOUNCEMENT'); setPriority('NORMAL');
        setAudience('ALL'); setPublishDate(''); setExpiryDate('');
        handleRemoveImage();
        await loadCirculars();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish circular.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Circular removed.');
    } catch {
      toast.error('Could not delete circular.');
    }
  };

  const serverBase = env.apiUrl.replace('/api', '');

  const resolveImage = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${serverBase}${url}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <button
          type="button"
          onClick={() => setMainTab('INBOX')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'INBOX'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Inbox className="h-4 w-4" /> Notification Inbox & Feed
        </button>
        <button
          type="button"
          onClick={() => setMainTab('CIRCULARS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'CIRCULARS'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Send className="h-4 w-4" /> Compose & Manage Circulars
        </button>
        <button
          type="button"
          onClick={() => setMainTab('DIAGNOSTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'DIAGNOSTICS'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Activity className="h-4 w-4 text-amber-500" /> Super Admin Diagnostics & Health
        </button>
      </div>

      {mainTab === 'INBOX' && <UnifiedNotificationInbox />}

      {mainTab === 'DIAGNOSTICS' && <NotificationControlCenter />}

      {mainTab === 'CIRCULARS' && (
        <>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Circular Management</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Compose, publish, and manage institution-wide circulars with image attachments.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

            {/* ── Compose Panel ─────────────────────────────────────────────── */}
            <div className="xl:col-span-2 border bg-card p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-2">
                <Send className="h-3.5 w-3.5" /> Compose Circular
              </h3>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs font-semibold">

            {/* Circular Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Circular Title *</label>
              <input
                type="text"
                required
                placeholder="Enter circular title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-9 border rounded-lg bg-background px-3 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Category & Priority row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="h-9 border rounded-lg bg-background px-2 font-semibold text-xs focus:outline-none">
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="EVENT">Event</option>
                  <option value="EXAM">Examination</option>
                  <option value="FEE">Fee</option>
                  <option value="HOSTEL">Hostel</option>
                  <option value="PLACEMENT">Placement</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)}
                  className="h-9 border rounded-lg bg-background px-2 font-semibold text-xs focus:outline-none">
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Audience */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value)}
                className="h-9 border rounded-lg bg-background px-2 font-semibold text-xs focus:outline-none">
                <option value="ALL">All Users</option>
                <option value="Student">Students Only</option>
                <option value="Faculty">Faculty Only</option>
                <option value="Parent">Parents Only</option>
                <option value="HOD">HODs Only</option>
                <option value="Mentor">Mentors Only</option>
              </select>
            </div>

            {/* Publish / Expiry dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Publish Date</label>
                <input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)}
                  className="h-9 border rounded-lg bg-background px-2 text-xs focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                  className="h-9 border rounded-lg bg-background px-2 text-xs focus:outline-none" />
              </div>
            </div>

            {/* Body Content */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Body Content *</label>
              <textarea
                required
                placeholder="Write the full circular content here..."
                rows={5}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="border rounded-lg bg-background p-3 font-normal leading-relaxed text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* ── Image Attachment ──────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground flex flex-wrap items-center gap-1.5">
                <ImagePlus className="h-3 w-3" /> Circular Image Attachment
              </label>

              {/* Preview area */}
              {imagePreview ? (
                <div className="border rounded-xl overflow-hidden bg-muted/30 relative">
                  <img
                    src={imagePreview}
                    alt="Circular attachment preview"
                    className="w-full max-h-48 object-contain bg-black/5"
                  />
                  <div className="p-2 border-t flex flex-wrap items-center justify-between gap-2 bg-card">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <FileImage className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[10px] font-semibold truncate text-foreground">{imageFile?.name}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0">({formatBytes(imageFile?.size || 0)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {/* Replace button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-[9px] font-bold rounded hover:bg-black/80 transition-colors"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-2 text-muted-foreground"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10px] font-semibold">Click to upload image</span>
                  <span className="text-[9px]">JPG, JPEG, PNG, WEBP · Max 10 MB</span>
                </button>
              )}

              {imageError && (
                <p className="text-[10px] text-destructive font-semibold">{imageError}</p>
              )}

              {/* Hidden file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={submitting}>
              Publish Circular
            </Button>
          </form>
        </div>

        {/* ── Circular Feed ──────────────────────────────────────────────── */}
        <div className="xl:col-span-3 border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-2">
              <Bell className="h-3.5 w-3.5" /> Active Circulars ({announcements.length})
            </h3>
            <button
              onClick={loadCirculars}
              disabled={loading}
              className="p-1.5 rounded-lg border bg-background hover:bg-muted transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              No circulars published yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {announcements.map(ann => (
                <div key={ann.id} className="border rounded-xl bg-muted/10 overflow-hidden">
                  {/* Image banner if available */}
                  {ann.imageUrl && (
                    <img
                      src={resolveImage(ann.imageUrl)}
                      alt={ann.title}
                      className="w-full max-h-40 object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}

                  <div className="p-3.5 space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-extrabold text-xs text-foreground truncate">{ann.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {ann.type && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase">{ann.type}</span>
                          )}
                          {ann.imageUrl && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold flex flex-wrap items-center gap-0.5">
                              <FileImage className="h-2.5 w-2.5" /> Image
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 shrink-0">
                        <button
                          onClick={() => setViewCircular(ann)}
                          className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                          title="View"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2">{ann.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Circular Detail Modal ──────────────────────────────────────── */}
      {viewCircular && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setViewCircular(null)}
        >
          <div
            className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            {viewCircular.imageUrl && (
              <img
                src={resolveImage(viewCircular.imageUrl)}
                alt={viewCircular.title}
                className="w-full max-h-72 object-cover rounded-t-2xl"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}

            <div className="p-6 space-y-4">
              {/* Title & meta */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {viewCircular.type && (
                    <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">{viewCircular.type}</span>
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    Published: {new Date(viewCircular.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-foreground">{viewCircular.title}</h2>
              </div>

              {/* Body */}
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{viewCircular.content}</p>

              {/* Image attachment section */}
              {viewCircular.imageUrl && (
                <div className="border-t pt-4">
                  <h5 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex flex-wrap items-center gap-1.5">
                    <FileImage className="h-3 w-3" /> Attached Image
                  </h5>
                  <img
                    src={resolveImage(viewCircular.imageUrl)}
                    alt="Circular attachment"
                    className="w-full max-h-64 object-contain border rounded-xl bg-muted/20"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-[10px] text-muted-foreground">Status: <strong>{viewCircular.status}</strong></span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 text-[11px] font-bold border rounded-lg hover:bg-muted transition-colors"
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => setViewCircular(null)}
                    className="px-3 py-1.5 text-[11px] font-bold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default NotificationCenter;
