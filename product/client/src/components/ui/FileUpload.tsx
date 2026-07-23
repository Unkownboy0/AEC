import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FileUploadProps {
  label?: string;
  error?: string;
  accept?: string;
  maxSizeMB?: number;
  value?: File | null;
  onChange: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error: propError,
  accept,
  maxSizeMB = 5,
  value,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const error = propError || localError;

  const validateFile = (file: File): boolean => {
    setLocalError(null);

    // Max size check
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setLocalError(`File size exceeds the ${maxSizeMB}MB limit.`);
      return false;
    }

    // Accept type check
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      const matchesAccept = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        }
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType + '/');
        }
        return fileType === type;
      });

      if (!matchesAccept) {
        setLocalError(`Invalid file format. Accepted: ${accept}`);
        return false;
      }
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        onChange(droppedFile);
      }
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        onChange(selectedFile);
      }
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </span>
      )}

      {!value ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-card p-6 text-center cursor-pointer hover:bg-muted/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            {
              'border-primary bg-primary/5': isDragActive,
              'border-destructive': error,
            }
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleSelectFile}
            accept={accept}
            className="hidden"
          />
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
          <p className="text-sm font-semibold">Click to upload or drag & drop</p>
          <p className="text-xs text-muted-foreground mt-1">
            Max upload size: {maxSizeMB}MB
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-input bg-card p-3 shadow-sm animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <File className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">
                {value.name}
              </p>
              <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
            </div>
          </div>
          <button
            onClick={handleRemoveFile}
            className="rounded-md p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-destructive animate-in fade-in-50 duration-150">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
