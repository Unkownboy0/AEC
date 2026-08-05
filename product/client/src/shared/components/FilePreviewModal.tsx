import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Download, FileText, ExternalLink } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
  fileType?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType = 'document',
}) => {
  if (!fileUrl) return null;

  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || fileType.includes('image');
  const isPdf = fileUrl.match(/\.pdf$/i) || fileType.includes('pdf');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${fileName}`} maxWidth="xl">
      <div className="space-y-4">
        <div className="flex justify-end gap-2 border-b border-border pb-2">
          <a
            href={fileUrl}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>

        <div className="min-h-[300px] flex items-center justify-center bg-muted/20 rounded-xl p-4 border border-border">
          {isImage ? (
            <img src={fileUrl} alt={fileName} className="max-h-[60vh] object-contain rounded-lg shadow-sm" />
          ) : isPdf ? (
            <iframe src={fileUrl} title={fileName} className="w-full h-[60vh] rounded-lg border border-border" />
          ) : (
            <div className="text-center p-6 space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                Direct preview not available for this file type.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
              >
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
