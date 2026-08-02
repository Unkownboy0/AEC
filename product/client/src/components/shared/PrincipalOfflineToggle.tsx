import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { Power } from 'lucide-react';

export const PrincipalOfflineToggle: React.FC = () => {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPrincipal = user?.role === 'Principal' || user?.role === 'Super Admin';

  const fetchStatus = async () => {
    try {
      const res = await api.get('/settings/principal-availability');
      if (res.data?.status === 'success') {
        setIsOffline(res.data.data.isOffline);
      }
    } catch (err) {
      console.error('Failed to fetch Principal status:', err);
    }
  };

  useEffect(() => {
    if (isPrincipal) {
      fetchStatus();
    }
  }, [isPrincipal]);

  if (!isPrincipal) return null;

  const toggleAvailability = async () => {
    try {
      setLoading(true);
      const nextOffline = !isOffline;
      const res = await api.post('/settings/principal-availability', { isOffline: nextOffline });
      if (res.data?.status === 'success') {
        setIsOffline(res.data.data.isOffline);
      }
    } catch (err) {
      console.error('Failed to toggle Principal availability:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleAvailability}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all ${
        isOffline
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
      }`}
    >
      <Power className={`w-3.5 h-3.5 ${isOffline ? 'text-amber-400' : 'text-emerald-400'}`} />
      <span>Principal: {isOffline ? 'OFFLINE (Delegated to VP)' : 'ONLINE'}</span>
    </button>
  );
};
