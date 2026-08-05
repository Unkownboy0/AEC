import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Circular } from '../types/circular.types';
import { fetchCircularById, acknowledgeCircular } from '../api/circularApi';
import { CircularDetail } from '../components/CircularDetail';

export const CircularDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [circular, setCircular] = useState<Circular | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCircularById(id)
      .then(setCircular)
      .catch(err => setError(err?.response?.data?.error ?? err?.message ?? 'Circular not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAcknowledge = async (circularId: string) => {
    setAcknowledging(true);
    try {
      await acknowledgeCircular(circularId);
      setCircular(prev => prev ? { ...prev, isAcknowledged: true, userAcknowledgedAt: new Date().toISOString() } : prev);
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Back bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
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
          <CircularDetail
            circular={circular}
            onAcknowledge={handleAcknowledge}
            acknowledging={acknowledging}
          />
        )}
      </div>
    </div>
  );
};

export default CircularDetailPage;
