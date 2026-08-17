import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink, MessageSquare, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../notifications/NotificationProvider';
import { resolveNotificationRoute } from '../notifications/notification-router';
import { AppNotification } from '../notifications/notification.types';
import { useAuth } from '../context/AuthContext';

function formatNotificationTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(1);
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await markAsRead(n.id);
    }
    setIsOpen(false);

    const targetRoute = resolveNotificationRoute(n.eventType, n.relatedEntityId, n.deepLinkRoute || undefined, user?.role);
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  const { user } = useAuth();
  const roleUpper = (user?.role || '').toUpperCase();
  const notifPath = roleUpper.includes('PRINCIPAL') ? '/principal/notifications'
    : roleUpper.includes('VP') ? '/vp/notifications'
    : roleUpper.includes('HOD') ? '/hod/notifications'
    : roleUpper.includes('FACULTY') ? '/faculty/notifications'
    : '/notifications';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpenDropdown}
        type="button"
        className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-soft rounded-xl transition-colors touch-target flex items-center justify-center"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-surface animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-modal py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-text-primary">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-extrabold bg-primary-soft text-primary rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            {notifications.length > 0 && <button type="button" onClick={() => { if (window.confirm('Clear all notifications and reminders?')) clearAllNotifications(); }} className="text-xs font-bold text-danger hover:underline">Clear all</button>}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary/40" />
                <span>No new notifications</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-surface-soft cursor-pointer transition-colors flex items-start gap-3 ${
                    !n.isRead ? 'bg-primary-soft/30' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-surface-soft text-primary shrink-0 mt-0.5 border border-border/40">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {formatNotificationTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  <button type="button" aria-label="Clear notification" onClick={(event) => { event.stopPropagation(); clearNotification(n.id); }} className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(notifPath);
              }}
              className="w-full py-2 text-xs font-bold text-primary hover:bg-primary-soft rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
