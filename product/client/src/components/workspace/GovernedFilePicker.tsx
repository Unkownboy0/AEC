import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Check, FileText, FolderOpen, HardDrive, Loader2, Search, Upload, Users, X,
} from 'lucide-react';
import { GovernedDriveFile, workspaceApi } from '../../services/workspace.api';
import { toast } from '../ui/Toast';

type PickerTab = 'UPLOAD' | 'DRIVE' | 'RECENT' | 'SHARED' | 'SEARCH';

export interface GovernedFilePickerConstraints {
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
  multiple?: boolean;
  requiredAction?: 'VIEW' | 'DOWNLOAD';
  purpose: 'TASK_ATTACHMENT' | 'CLASSROOM_MATERIAL' | 'CLASSROOM_SUBMISSION' | 'CHAT_ATTACHMENT' | 'APPROVAL_EVIDENCE' | 'IQAC_EVIDENCE' | 'GENERAL_REFERENCE';
}

export interface GovernedFileAttachmentTarget {
  module: string;
  resourceType: string;
  resourceId: string;
  authorizationMode?: 'FILE_ACL' | 'PARENT_RESOURCE';
}

interface GovernedFilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constraints: GovernedFilePickerConstraints;
  attachmentTarget?: GovernedFileAttachmentTarget;
  uploadScope?: 'PERSONAL' | 'DEPARTMENT' | 'COLLEGE';
  uploadParentId?: string;
  onSelect: (files: GovernedDriveFile[]) => void | Promise<void>;
  title?: string;
}

const TABS: Array<{ id: PickerTab; label: string; icon: React.ElementType }> = [
  { id: 'UPLOAD', label: 'Upload', icon: Upload },
  { id: 'DRIVE', label: 'Campus Drive', icon: HardDrive },
  { id: 'RECENT', label: 'Recent', icon: FolderOpen },
  { id: 'SHARED', label: 'Shared with me', icon: Users },
  { id: 'SEARCH', label: 'Search', icon: Search },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',').pop() || '');
    reader.onerror = () => reject(new Error('The selected file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export const GovernedFilePicker: React.FC<GovernedFilePickerProps> = ({
  open,
  onOpenChange,
  constraints,
  attachmentTarget,
  uploadScope = 'PERSONAL',
  uploadParentId,
  onSelect,
  title = 'Choose a CampusOS file',
}) => {
  const [tab, setTab] = useState<PickerTab>('UPLOAD');
  const [files, setFiles] = useState<GovernedDriveFile[]>([]);
  const [selected, setSelected] = useState<GovernedDriveFile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useMemo(() => constraints.allowedMimeTypes?.join(','), [constraints.allowedMimeTypes]);

  const loadFiles = useCallback(async () => {
    if (!open || tab === 'UPLOAD' || (tab === 'SEARCH' && !search.trim())) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      setFiles(await workspaceApi.listPickerFiles({
        mode: tab,
        search: tab === 'SEARCH' ? search.trim() : undefined,
        action: constraints.requiredAction || 'VIEW',
        mimeTypes: constraints.allowedMimeTypes,
        maxSizeBytes: constraints.maxSizeBytes,
      }));
    } catch {
      setFiles([]);
      toast.error('Authorized files could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [constraints.allowedMimeTypes, constraints.maxSizeBytes, constraints.requiredAction, open, search, tab]);

  useEffect(() => {
    const timer = window.setTimeout(loadFiles, tab === 'SEARCH' ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadFiles, tab]);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSearch('');
      setTab('UPLOAD');
    }
  }, [open]);

  const toggleFile = (file: GovernedDriveFile) => {
    setSelected((current) => {
      const exists = current.some((item) => item.fileId === file.fileId);
      if (exists) return current.filter((item) => item.fileId !== file.fileId);
      return constraints.multiple ? [...current, file] : [file];
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files || []);
    event.target.value = '';
    if (!chosen.length) return;
    const uploadFiles = constraints.multiple ? chosen : chosen.slice(0, 1);
    setSubmitting(true);
    try {
      const uploaded: GovernedDriveFile[] = [];
      for (const file of uploadFiles) {
        if (constraints.allowedMimeTypes?.length && !constraints.allowedMimeTypes.includes(file.type)) {
          throw new Error(`${file.name} is not an allowed file type.`);
        }
        if (constraints.maxSizeBytes && file.size > constraints.maxSizeBytes) {
          throw new Error(`${file.name} exceeds the ${formatBytes(constraints.maxSizeBytes)} limit.`);
        }
        uploaded.push(await workspaceApi.uploadDriveFile({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: await readAsBase64(file),
          parentId: uploadParentId,
          scope: uploadScope,
          sourceModule: attachmentTarget?.module || 'CAMPUS_DRIVE',
        }));
      }
      setSelected((current) => constraints.multiple ? [...current, ...uploaded] : uploaded.slice(-1));
      toast.success(`${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded to Campus Drive.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'File upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSelection = async () => {
    if (!selected.length) return;
    setSubmitting(true);
    try {
      const resolvedSelection = selected.map((file) => ({ ...file }));
      if (attachmentTarget) {
        for (const file of resolvedSelection) {
          const reference = await workspaceApi.attachFileReference(file.fileId, {
            ...attachmentTarget,
            purpose: constraints.purpose,
            requiredAction: constraints.requiredAction || 'VIEW',
          });
          if (attachmentTarget.authorizationMode === 'PARENT_RESOURCE' && reference?.id) {
            file.downloadUrl = `${file.downloadUrl}${file.downloadUrl.includes('?') ? '&' : '?'}referenceId=${encodeURIComponent(reference.id)}`;
          }
        }
      }
      await onSelect(resolvedSelection);
      onOpenChange(false);
    } catch {
      toast.error('The selected file could not be attached.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[1.75rem] border border-border bg-card shadow-2xl outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,760px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem]">
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-base font-extrabold tracking-tight text-foreground">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                Server authorization filters every filename and selection.
              </Dialog.Description>
            </div>
            <Dialog.Close className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close file picker</span>
            </Dialog.Close>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 sm:px-5" aria-label="File sources">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </nav>

          <section className="min-h-64 flex-1 overflow-y-auto p-4 sm:p-6">
            {tab === 'UPLOAD' ? (
              <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-border bg-muted/25 p-6 text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-extrabold text-foreground">Upload to Campus Drive</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                    {constraints.allowedMimeTypes?.length ? constraints.allowedMimeTypes.join(', ') : 'CampusOS supported document and image formats'}
                    {constraints.maxSizeBytes ? ` · up to ${formatBytes(constraints.maxSizeBytes)}` : ''}
                  </p>
                  <input ref={inputRef} className="sr-only" type="file" accept={accept} multiple={constraints.multiple} onChange={handleUpload} />
                  <button type="button" disabled={submitting} onClick={() => inputRef.current?.click()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Choose {constraints.multiple ? 'files' : 'a file'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {tab === 'SEARCH' && (
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search authorized files" className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                )}
                {loading ? (
                  <div className="grid min-h-48 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : !files.length ? (
                  <div className="grid min-h-48 place-items-center text-center text-sm text-muted-foreground">
                    {tab === 'SEARCH' && !search.trim() ? 'Enter a filename to search.' : 'No authorized files match this source.'}
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {files.map((file) => {
                      const checked = selected.some((item) => item.fileId === file.fileId);
                      return (
                        <button key={`${file.id}-${file.fileId}`} type="button" onClick={() => toggleFile(file)} className={`flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? 'border-primary bg-primary/8' : 'border-border bg-background hover:border-primary/35'}`}>
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-primary"><FileText className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-extrabold text-foreground">{file.name}</span>
                            <span className="mt-1 block text-[10px] text-muted-foreground">{formatBytes(file.fileSize)} · {new Date(file.updatedAt).toLocaleDateString('en-IN')}</span>
                          </span>
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{checked && <Check className="h-3.5 w-3.5" />}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          <footer className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-6">
            <span className="text-xs font-semibold text-muted-foreground">{selected.length} selected</span>
            <button type="button" disabled={!selected.length || submitting} onClick={confirmSelection} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {attachmentTarget ? 'Attach selected' : 'Use selected'}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default GovernedFilePicker;
