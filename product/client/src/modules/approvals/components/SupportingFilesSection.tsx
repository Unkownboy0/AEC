import React from 'react';
import { ApprovalAttachmentItem } from '../api/approvalRequests.api';
import { Paperclip, Eye, Download, FileText } from 'lucide-react';

interface SupportingFilesSectionProps {
  attachments: ApprovalAttachmentItem[];
  isLoading?: boolean;
}

export const SupportingFilesSection: React.FC<SupportingFilesSectionProps> = ({
  attachments,
  isLoading = false,
}) => {
  // CRITICAL RULE: Supporting Files section must appear ONLY when at least one valid attachment exists
  if (!isLoading && attachments.length === 0) {
    return null;
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-amber-400" />
        Supporting Documents ({attachments.length})
      </h4>

      {isLoading ? (
        <div className="text-xs text-slate-500 text-center py-2">Loading attachments...</div>
      ) : (
        <div className="space-y-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-200 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold truncate text-white">{file.fileName || file.originalFileName}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {formatSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {file.canPreview && (
                  <a
                    href={file.downloadUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="View Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </a>
                )}

                <a
                  href={file.downloadUrl || '#'}
                  download={file.fileName}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
