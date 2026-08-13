import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Circular } from '../types/circular.types';
import { fetchCircularById, markCircularRead } from '../api/circularApi';
import { CircularDetail } from '../components/CircularDetail';

export const CircularDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [circular, setCircular] = useState<Circular | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCircularById(id)
      .then(async (item) => {
        setCircular(item ? { ...item, isRead: true, userReadAt: item.userReadAt || new Date().toISOString() } : item);
        if (item && !item.isRead) await markCircularRead(id).catch(() => undefined);
      })
      .catch(err => setError(err?.response?.data?.error ?? err?.message ?? 'Circular not found'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-slate-50/60 pb-16 dark:bg-[#090d14]">
      {/* Back bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-[#090d14]/85 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-3 pt-5 sm:px-6 sm:pt-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-24 px-4">
            <p className="text-gray-500 text-lg mb-2">Circular Not Found</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">
              Go Back
            </button>
          </div>
        )}

        {!loading && !error && circular && (
          <CircularDetail circular={circular} />
        )}
      </div>
    </main>
  );
};

export default CircularDetailPage;
