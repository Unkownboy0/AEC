import React, { useState, useEffect } from 'react';
import { Download, Bell, Megaphone, Search, Filter, Image as ImageIcon, Paperclip, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export const FacultyCircularsPage: React.FC = () => {
  const { user } = useAuth();
  const [circulars, setCirculars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const itemsPerPage = 5;

  const fetchCirculars = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.get('/circulars');
      if (res.data?.status === 'success') {
        setCirculars(res.data.data);
      }
    } catch (err) {
      console.error('[Faculty circulars fetch] error:', err);
      if (!silent) toast.error('Failed to load department circulars');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculars();
    // Auto-refresh/polling loop every 10 seconds to show new circulars immediately
    const interval = setInterval(() => {
      fetchCirculars(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mark circular as read when clicked/expanded
  const handleMarkAsRead = async (circularId: string, isRead: boolean) => {
    if (isRead) return;
    try {
      const res = await api.post(`/circulars/${circularId}/read`);
      if (res.data?.status === 'success') {
        setCirculars(prev => prev.map(c => {
          if (c.id === circularId) {
            return { ...c, isRead: true, readAt: new Date().toISOString() };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Failed to mark circular as read:', err);
    }
  };

  // Helper to extract file extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Map db priority to UI badge labels
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'Urgent';
      case 'NORMAL':
        return 'Important';
      case 'LOW':
        return 'Normal';
      default:
        return priority;
    }
  };

  // Filter Categories list dynamically
  const categories = Array.from(new Set(circulars.map(c => c.category).filter(Boolean)));

  // Filter logic
  const filteredCirculars = circulars.filter(c => {
    const matchesSearch = searchTerm ? (
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.content?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;

    const matchesCategory = selectedCategory === 'all' ? true : c.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPriority = selectedPriority === 'all' ? true : c.priority?.toLowerCase() === selectedPriority.toLowerCase();

    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Pagination bounds
  const totalItems = filteredCirculars.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCirculars = filteredCirculars.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="text-left">
          <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-5.5 w-5.5 text-primary" />
            Faculty Circulars
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Department Circulars Published by HOD
          </p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="border bg-card p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search keyword input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search circulars by title, description or content..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-4 text-xs font-semibold border rounded-xl bg-background focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 border rounded-lg text-xs font-semibold bg-background focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase whitespace-nowrap">Priority:</span>
            <select
              value={selectedPriority}
              onChange={e => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 border rounded-lg text-xs font-semibold bg-background focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">Urgent</option>
              <option value="normal">Important</option>
              <option value="low">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List Workspace */}
      {isLoading ? (
        // Skeleton Loader
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border bg-card p-5 rounded-2xl shadow-sm space-y-3 animate-pulse">
              <div className="flex gap-2">
                <div className="h-4 w-12 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded ml-auto" />
              </div>
              <div className="h-5 w-2/3 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : currentCirculars.length === 0 ? (
        // Empty State
        <div className="border bg-card rounded-2xl p-12 text-center text-xs font-semibold space-y-4 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto text-3xl">📭</div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-foreground text-sm">No department circulars available.</h4>
            <p className="text-muted-foreground text-[10px]">Your HOD hasn't published any bulletins for your department yet.</p>
          </div>
        </div>
      ) : (
        // Circulars Cards
        <div className="space-y-4">
          {currentCirculars.map((c, index) => {
            const idxGlobal = totalItems - indexOfFirstItem - index;
            const pubDate = new Date(c.publishedAt || c.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const parsedImages = typeof c.images === 'string'
              ? JSON.parse(c.images || '[]')
              : (Array.isArray(c.images) ? c.images : []);

            return (
              <div
                key={c.id}
                onClick={() => handleMarkAsRead(c.id, c.isRead)}
                className={`border bg-card p-5 rounded-2xl shadow-sm space-y-4 text-left transition-all hover:shadow-md ${
                  !c.isRead ? 'border-l-4 border-l-amber-500 bg-amber-50/5' : ''
                }`}
              >
                {/* Header Information */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                    Circular #{idxGlobal}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    c.priority === 'HIGH'
                      ? 'bg-rose-50 border border-rose-100 text-rose-600'
                      : c.priority === 'NORMAL'
                        ? 'bg-amber-50 border border-amber-100 text-amber-600'
                        : 'bg-slate-100 border text-slate-600'
                  }`}>
                    {getPriorityLabel(c.priority)}
                  </span>
                  <span className="bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                    {c.category || 'General'}
                  </span>
                  <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                    {c.department?.code || 'DEPT'}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium ml-auto">
                    Published {pubDate}
                  </span>
                </div>

                {/* Circular Title & HOD info */}
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-foreground tracking-tight leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Published By: {c.publishedBy?.firstName} {c.publishedBy?.lastName} (HOD)
                  </p>
                </div>

                {/* Content description & body */}
                <div className="text-xs font-semibold text-foreground/90 space-y-3 leading-relaxed">
                  {c.description && (
                    <p className="italic text-muted-foreground leading-normal bg-muted/20 p-3 rounded-xl">
                      {c.description}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap font-semibold">
                    {c.content}
                  </p>
                </div>

                {/* Inline Image Previews */}
                {parsedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {parsedImages.map((img: any, i: number) => {
                      const url = typeof img === 'string' ? img : (img.url || '');
                      if (!url) return null;
                      return (
                        <div
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingImage(url);
                          }}
                          className="group relative border rounded-xl overflow-hidden bg-muted/10 h-24 cursor-pointer hover:shadow-sm transition-all"
                        >
                          <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-black uppercase">
                            View 🔍
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* File Attachment Details */}
                {c.attachmentUrl && (
                  <div className="flex flex-wrap items-center justify-between p-3 border bg-muted/10 rounded-xl gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-bold text-foreground text-[11px] truncate max-w-[200px]">{c.attachmentName || 'Attachment File'}</p>
                        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-wider">
                          Format: {getFileExtension(c.attachmentName || '').toUpperCase() || 'UNKNOWN'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile({
                            url: c.attachmentUrl,
                            name: c.attachmentName || 'Attachment',
                            type: getFileExtension(c.attachmentName || '')
                          });
                        }}
                        className="px-3 py-1.5 border bg-card hover:bg-muted text-[9px] font-bold rounded-lg transition-all"
                      >
                        Preview
                      </button>
                      <a
                        href={c.attachmentUrl}
                        download={c.attachmentName || 'Attachment'}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-[9px] font-bold hover:bg-primary/95 rounded-lg transition-all shadow-sm"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border rounded-xl text-xs font-bold bg-card hover:bg-muted disabled:opacity-50 transition-all flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-xs font-bold text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border rounded-xl text-xs font-bold bg-card hover:bg-muted disabled:opacity-50 transition-all flex items-center gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden bg-card border rounded-2xl shadow-2xl p-2 animate-in zoom-in-95">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors z-10 font-bold"
            >
              ✕
            </button>
            <img src={viewingImage} alt="Zoom Preview" className="max-h-[80vh] w-auto object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-sm font-extrabold uppercase tracking-wider truncate max-w-md">{previewFile.name}</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{previewFile.type} Document</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5"
                >
                  📥 Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="px-3 py-1.5 border hover:bg-muted rounded-lg text-xs font-bold transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            {/* Modal Body */}
            <div className="flex-1 bg-slate-900/5 flex items-center justify-center overflow-auto p-6 relative">
              {['png', 'jpg', 'jpeg', 'webp'].includes(previewFile.type) ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-h-[60vh] object-contain rounded shadow-md" />
              ) : (
                <iframe src={previewFile.url} title={previewFile.name} className="w-full h-full rounded border shadow-sm bg-white" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
