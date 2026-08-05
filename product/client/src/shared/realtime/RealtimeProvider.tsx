import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface RealtimeContextType {
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  subscribe: () => () => {},
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const sseUrl = `/api/rbac/stream?userId=${encodeURIComponent(user.id)}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.type) {
            window.dispatchEvent(new CustomEvent(`realtime:${payload.type}`, { detail: payload }));
            window.dispatchEvent(new CustomEvent('realtime:any', { detail: payload }));
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user]);

  const subscribe = (eventType: string, callback: (data: any) => void) => {
    const handler = (e: Event) => {
      const customEvt = e as CustomEvent;
      callback(customEvt.detail);
    };
    window.addEventListener(`realtime:${eventType}`, handler);
    return () => {
      window.removeEventListener(`realtime:${eventType}`, handler);
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
