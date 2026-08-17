import React, { useState, useEffect } from 'react';
import { Clock, X, RotateCcw, ChevronDown, Loader2 } from 'lucide-react';
import { workspaceApi, WorkspaceVersion } from '../../services/workspace.api';
import { toast } from '../ui/Toast';

interface Props {
  documentId: string;
  currentVersion: number;
  onClose: () => void;
  onRestore: () => void;
}

const WorkspaceVersionsPanel: React.FC<Props> = ({ documentId, currentVersion, onClose, onRestore }) => {
  const [versions, setVersions] = useState<WorkspaceVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await workspaceApi.getVersions(documentId);
        setVersions(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [documentId]);

  const handleRestore = async (versionNumber: number) => {
    if (versionNumber === currentVersion) return;
    if (!window.confirm(`Restore version ${versionNumber}? This will create a new version with the old content.`)) return;
    setRestoring(versionNumber);
    try {
      await workspaceApi.restoreVersion(documentId, versionNumber);
      toast.success(`Restored to version ${versionNumber}.`);
      onRestore();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to restore.');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
      date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getAuthorName = (v: WorkspaceVersion) => {
    if (v.author?.faculty) return `${v.author.faculty.firstName} ${v.author.faculty.lastName}`;
    return 'Unknown';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-800">Version History</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-gray-100 h-16" />
          ))
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No version history yet.</p>
          </div>
        ) : (
          versions.map((v) => {
            const isCurrent = v.versionNumber === currentVersion;
            return (
              <div
                key={v.id}
                className={`rounded-xl border p-3 ${isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'} transition-colors`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800">Version {v.versionNumber}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Current</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{getAuthorName(v)} · {formatDate(v.createdAt)}</p>
                    {v.changeSummary && (
                      <p className="text-xs text-gray-600 mt-1 italic">"{v.changeSummary}"</p>
                    )}
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => handleRestore(v.versionNumber)}
                      disabled={restoring === v.versionNumber}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      {restoring === v.versionNumber ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                      Restore
                    </button>
                  )}
                </div>

                {/* Preview toggle */}
                <button
                  onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 mt-2 transition-colors"
                >
                  <ChevronDown size={10} className={`transition-transform ${expanded === v.id ? 'rotate-180' : ''}`} />
                  {expanded === v.id ? 'Hide' : 'Preview'}
                </button>
                {expanded === v.id && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-[10px] text-gray-500 max-h-20 overflow-y-auto font-mono">
                    {(() => {
                      try {
                        const content = JSON.parse(v.contentSnapshot);
                        const text = content?.content?.map((n: any) =>
                          n.content?.map((c: any) => c.text || '').join('') || ''
                        ).join(' ').slice(0, 200);
                        return text || '(empty)';
                      } catch {
                        return '(binary snapshot)';
                      }
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorkspaceVersionsPanel;
