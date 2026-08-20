import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useKeyboardState } from '../../context/KeyboardContext';
import { getContextualActions } from '../../navigation/action-registry';
import { shouldShowQuickStart } from '../../navigation/quickstart-policy';

export const QuickActionFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, hasPermission } = useAuth();
  const { isKeyboardOpen } = useKeyboardState();
  const navigate = useNavigate();
  const location = useLocation();

  // Close open action menu whenever route changes or keyboard opens
  useEffect(() => {
    if (isOpen && isKeyboardOpen) {
      setIsOpen(false);
    }
  }, [isOpen, isKeyboardOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const actions = getContextualActions(user.role || '', location.pathname, hasPermission);

  const isVisible = shouldShowQuickStart({
    pathname: location.pathname,
    isKeyboardOpen,
    hasActions: actions.length > 0,
  });

  if (!isVisible) return null;

  return (
    <div
      className={clsx(
        'fixed right-4 sm:right-6 z-40 flex flex-col items-end lg:hidden',
        // Clears the mobile bottom nav bar + the device's own safe-area inset (gesture
        // bar / home indicator) with a consistent 16px margin above it.
        'bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-area-bottom)+16px)]'
      )}
    >
      {/* Action menu backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Items List */}
      {isOpen && (
        <div className="z-50 mb-3 space-y-2 animate-in slide-in-from-bottom-3 fade-in duration-150 flex flex-col items-end">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  setIsOpen(false);
                  navigate(act.path);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface border border-border shadow-modal text-text-primary hover:bg-surface-soft transition-all text-xs font-bold group shrink-0 touch-target"
              >
                <span>{act.label}</span>
                <div className={`p-2 rounded-xl text-white ${act.color} shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`z-50 p-4 rounded-2xl bg-primary text-primary-foreground shadow-2xl hover:bg-primary-hover active:scale-95 transition-all duration-200 flex items-center justify-center touch-target ${
          isOpen ? 'rotate-45 bg-rose-600 hover:bg-rose-700' : ''
        }`}
        title="Quick Actions"
        aria-label="Quick Actions"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
};
