import React, { useState, useEffect } from 'react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { Folder, FileText, Search, Upload, Trash2, ExternalLink } from 'lucide-react';
import api from '../../lib/axios';
import { env } from '../../shared/config/environment';

interface MediaFile {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  fileSize: number;
  folder: string;
  createdAt: string;
}

const MediaLibrary: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [activeFolder, setActiveFolder] = useState('/');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const folders = [
    { label: 'Root Directory', path: '/' },
    { label: 'Images Uploads', path: '/images' },
    { label: 'Documents Uploads', path: '/documents' },
  ];

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/files', { params: { folder: activeFolder, search } });
      if (res.data?.status === 'success') {
        setFiles(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load media catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeFolder, search]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const raw = evt.target?.result as string;
        const base64 = raw.split(',')[1]; // Strip mime-type prefix

        const res = await api.post('/files/upload', {
          name: selected.name,
          mimeType: selected.type,
          folder: activeFolder,
          base64,
        });

        if (res.data?.status === 'success') {
          toast.success(`Successfully uploaded: ${selected.name}`);
          fetchFiles();
        }
      } catch (err: any) {
        toast.error(err.message || 'File upload failed');
      } finally {
        setIsUploading(false);
        if (e.target) e.target.value = '';
      }
    };

    reader.readAsDataURL(selected);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media file? This action is permanent.')) return;
    try {
      const res = await api.delete(`/files/${id}`);
      if (res.data?.status === 'success') {
        toast.success('Media file deleted');
        fetchFiles();
      }
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const getFormatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Media Library</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure system logos, document forms, student attachments, and image cards.
          </p>
        </div>
        <div>
          <label className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-sm">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Directories Navigation */}
        <div className="flex flex-col gap-1 lg:col-span-1">
          {folders.map((f) => (
            <button
              key={f.path}
              onClick={() => setActiveFolder(f.path)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-all ${
                activeFolder === f.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Folder className="h-4 w-4" />
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Catalog Items */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Quick search bar */}
          <div className="border bg-card rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search file catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs font-medium w-full outline-none"
            />
          </div>

          {/* Files display */}
          <div className="border bg-card rounded-xl p-6 shadow-sm min-h-[40vh]">
            {isLoading || isUploading ? (
              <div className="flex h-[30vh] items-center justify-center">
                <Loading text={isUploading ? 'Uploading file payload...' : 'Loading media directory...'} />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[30vh] text-center text-xs text-muted-foreground">
                <Folder className="h-10 w-10 text-muted/30 mb-2" />
                <p>No media files uploaded in this folder path.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
                {files.map((file) => {
                  const isImage = file.mimeType.startsWith('image/');
                  const serverOrigin = env.apiUrl.replace('/api', '');
                  const fullUrl = file.path.startsWith('http') ? file.path : `${serverOrigin}${file.path}`;

                  return (
                    <div key={file.id} className="border bg-card rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                      
                      {/* Graphics preview card */}
                      <div className="h-28 rounded-lg bg-muted flex items-center justify-center overflow-hidden mb-2 relative">
                        {isImage ? (
                          <img src={fullUrl} alt={file.name} className="h-full w-full object-cover" />
                        ) : (
                          <FileText className="h-10 w-10 text-muted-foreground/50" />
                        )}
                        
                        {/* Open file link overlay */}
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-5 w-5 text-white" />
                        </a>
                      </div>

                      {/* Info and delete */}
                      <div>
                        <p className="text-[10px] font-bold truncate text-foreground" title={file.name}>{file.name}</p>
                        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t">
                          <span className="text-[9px] text-muted-foreground font-semibold font-mono">{getFormatSize(file.fileSize)}</span>
                          <button onClick={() => handleDelete(file.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default MediaLibrary;
