import React from 'react';
import { ApprovalAttachmentItem } from './ApprovalTypes';
import { FileText, Image as ImageIcon, FileSpreadsheet, ExternalLink, Download, Paperclip } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';

interface ApprovalAttachmentSectionProps {
  attachments?: ApprovalAttachmentItem[];
  className?: string;
}

export const ApprovalAttachmentSection: React.FC<ApprovalAttachmentSectionProps> = ({
  attachments,
  className = '',
}) => {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (item: ApprovalAttachmentItem) => {
    const ext = item.name.split('.').pop()?.toLowerCase() || item.type;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'image'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-sky-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    }
    return <FileText className="w-4 h-4 text-purple-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 shadow-sm ${className}`}>
      <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-blue-600" />
        <span>Attached Evidence & Documents ({attachments.length})</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {attachments.map((item) => {
          const resolvedUrl = resolveAssetUrl(item.url);
          return (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 flex items-center justify-between gap-3 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate">
                {getFileIcon(item)}
                <div className="truncate">
                  <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={item.name}>
                    {item.name}
                  </p>
                  {item.sizeBytes && (
                    <p className="text-[10px] text-gray-400">{formatFileSize(item.sizeBytes)}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  title="Preview document"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={resolvedUrl}
                  download={item.name}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
