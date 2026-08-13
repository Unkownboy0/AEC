import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEntriesForRole } from '../navigation/navigation.utils';

export interface CommandAction {
  id: string;
  title: string;
  category: string;
  icon?: string;
  path?: string;
  action?: () => void;
  keywords?: string[];
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Build command actions list based on user's role
  const roleEntries = getEntriesForRole(user?.role);
  
  const actions: CommandAction[] = [
    // Navigation items
    ...roleEntries.map((e) => ({
      id: `nav-${e.id}`,
      title: e.label,
      category: 'Navigation',
      icon: e.icon,
      path: e.path,
      keywords: [e.label.toLowerCase(), e.group],
    })),
    // System Quick Actions
    {
      id: 'sys-profile',
      title: 'View My Profile',
      category: 'System',
      icon: 'User',
      path: '/profile',
      keywords: ['profile', 'user', 'account', 'me'],
    },
    {
      id: 'sys-notifications',
      title: 'View Notifications',
      category: 'System',
      icon: 'Bell',
      path: '/notifications',
      keywords: ['notifications', 'alerts', 'messages'],
    },
    {
      id: 'sys-logout',
      title: 'Sign Out',
      category: 'System',
      icon: 'LogOut',
      action: async () => {
        await logout();
        navigate('/login');
      },
      keywords: ['logout', 'signout', 'exit', 'log out'],
    },
  ];

  // Filter actions by query
  const filteredActions = query.trim() === ''
    ? actions
    : actions.filter((act) => {
        const q = query.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.category.toLowerCase().includes(q) ||
          act.keywords?.some((k) => k.includes(q))
        );
      });

  const executeAction = (action: CommandAction) => {
    close();
    if (action.action) {
      action.action();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return {
    isOpen,
    query,
    setQuery,
    toggle,
    open,
    close,
    filteredActions,
    executeAction,
  };
}
