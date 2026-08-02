import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  description: string;
  duration?: number;
}

type ToastCallback = (message: ToastMessage) => void;
const listeners = new Set<ToastCallback>();

export const toast = {
  show: (description: string, type: ToastType = 'info', title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const msg: ToastMessage = { id, type, title, description, duration };
    listeners.forEach((listener) => listener(msg));
    return id;
  },
  success: (description: string, title?: string, duration?: number) => {
    return toast.show(description, 'success', title, duration);
  },
  error: (description: string, title?: string, duration?: number) => {
    return toast.show(description, 'error', title, duration);
  },
  warn: (description: string, title?: string, duration?: number) => {
    return toast.show(description, 'warning', title, duration);
  },
  info: (description: string, title?: string, duration?: number) => {
    return toast.show(description, 'info', title, duration);
  },
};

export function useToast() {
  return {
    showToast: (msg: string, type: ToastType = 'info') => {
      toast.show(msg, type);
    }
  };
}

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration || 4000);
      }
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 p-4">
      {toasts.map((t) => {
        let Icon = Info;
        let iconColor = 'text-blue-500';
        let borderColor = 'border-blue-200 dark:border-blue-900';

        if (t.type === 'success') {
          Icon = CheckCircle;
          iconColor = 'text-green-500';
          borderColor = 'border-green-200 dark:border-green-900';
        } else if (t.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-red-500';
          borderColor = 'border-red-200 dark:border-red-900';
        } else if (t.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-500';
          borderColor = 'border-amber-200 dark:border-amber-900';
        }

        return (
          <div
            key={t.id}
            className={cn(
              'flex w-full items-start gap-3 rounded-lg border bg-card p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-5',
              borderColor
            )}
          >
            <div className={cn('mt-0.5 flex-shrink-0', iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              {t.title && <h4 className="text-sm font-semibold leading-none mb-1">{t.title}</h4>}
              <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 rounded-md p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all duration-150"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};
