import React, { useState } from 'react';
import { RefreshCw, FileText, Bell } from 'lucide-react';
import { useCirculars } from '../hooks/useCirculars';
import { CircularCard } from '../components/CircularCard';
import { CircularDetail } from '../components/CircularDetail';
import { Circular } from '../types/circular.types';

interface RoleCircularsPageProps {
  roleLabel: string;
  roleColor?: string;
}

const FacultyCircularsPage: React.FC = () => <RoleCircularsPage roleLabel="Faculty" roleColor="blue" />;

export const RoleCircularsPage: React.FC<RoleCircularsPageProps> = ({ roleLabel, roleColor = 'blue' }) => {
  const { circulars, loading, error, refresh, acknowledge } = useCirculars();
  const [selected, setSelected] = useState<Circular | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = async (id: string) => {
    setAcknowledging(true);
    await acknowledge(id);
    setAcknowledging(false);
  };

  const unread = circulars.filter(c => !c.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Circulars</h1>
          <p className="text-xs text-gray-400">{roleLabel} · {unread} unread</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              <Bell className="w-3 h-3" />
              {unread}
            </span>
          )}
          <button
            onClick={refresh}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">{error}</p>
            <button onClick={refresh} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Retry</button>
          </div>
        )}
        {!loading && !error && circulars.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No circulars yet</p>
            <p className="text-gray-400 text-sm mt-1">Circulars addressed to you will appear here</p>
          </div>
        )}
        {!loading && circulars.length > 0 && (
          <div className="space-y-3">
            {circulars.map(c => (
              <CircularCard
                key={c.id}
                circular={c}
                onClick={setSelected}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl sm:mx-4 sm:rounded-2xl max-h-[90vh] rounded-t-2xl overflow-hidden shadow-2xl">
            <CircularDetail
              circular={selected}
              onClose={() => setSelected(null)}
              onAcknowledge={handleAcknowledge}
              acknowledging={acknowledging}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { FacultyCircularsPage };
export default FacultyCircularsPage;
