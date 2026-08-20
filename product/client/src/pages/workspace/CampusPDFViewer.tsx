import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw,
  Printer, Share2, Shield, Eye, Loader2, AlertCircle, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

const CampusPDFViewer: React.FC = () => {
  const params = useParams<{ id?: string; documentId?: string }>();
  const id = params.id || params.documentId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [docData, blob] = await Promise.all([
          workspaceApi.getDocument(id),
          workspaceApi.exportDocument(id, 'pdf').catch(() => null),
        ]);
        setDoc(docData);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch {
        toast.error('Failed to load PDF document.');
      } finally {
        setLoading(false);
      }
    };
    load();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    try {
      const blob = await workspaceApi.exportDocument(id, 'pdf');
      downloadBlob(blob, `${doc?.title || 'document'}.pdf`);
      toast.success('Downloaded PDF');
    } catch {
      toast.error('Failed to download PDF.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-red-500 mx-auto mb-3" />
          <p className="text-xs text-gray-400">Rendering secure watermarked PDF…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden font-sans">
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-gray-800/90 border-b border-gray-700 flex items-center justify-between px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-700 rounded-xl transition-colors">
            <ArrowLeft size={16} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-sm">{doc?.title || 'PDF Document'}</h1>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Shield size={10} className="text-emerald-400" /> Institutional Secure Preview • Watermarked
            </p>
          </div>
        </div>

        {/* View controls */}
        <div className="flex items-center gap-1 bg-gray-700/60 rounded-xl p-1">
          <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="p-1.5 hover:bg-gray-600 rounded-lg text-gray-300">
            <ZoomOut size={13} />
          </button>
          <span className="text-xs font-mono px-2 text-gray-200">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="p-1.5 hover:bg-gray-600 rounded-lg text-gray-300">
            <ZoomIn size={13} />
          </button>
          <div className="w-px h-4 bg-gray-600 mx-1" />
          <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 hover:bg-gray-600 rounded-lg text-gray-300" title="Rotate">
            <RotateCw size={13} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="p-2 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors" title="Print">
            <Printer size={15} />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Download size={13} /> Download
          </button>
        </div>
      </div>

      {/* ─── PDF Canvas ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-gray-950 p-6 flex items-center justify-center">
        {pdfBlobUrl ? (
          <div
            className="shadow-2xl rounded-sm overflow-hidden bg-white transition-transform"
            style={{
              width: `${(800 * zoom) / 100}px`,
              height: `${(1100 * zoom) / 100}px`,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
              title={doc?.title || 'PDF Preview'}
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-3 opacity-30 text-red-400" />
            <p className="text-sm">Unable to render inline preview.</p>
            <button onClick={handleDownload} className="mt-3 text-xs text-red-400 hover:underline">
              Download PDF to view
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusPDFViewer;
