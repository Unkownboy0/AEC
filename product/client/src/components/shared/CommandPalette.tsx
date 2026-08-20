import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Users, Settings, Database, Folder, Shield, Bell, FileBarChart, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState('');

  // Handle Ctrl+K shortcut to toggle open state globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // The parent layout will toggle the state
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const allItems = [
    { name: 'Go to Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Manage Users', path: '/users', icon: Users, perm: 'users:read' },
    { name: 'System Settings', path: '/admin/settings', icon: Settings, perm: 'settings:write' },
    { name: 'Academic Configuration', path: '/academics', icon: GraduationCap, perm: 'academics:read' },
    { name: 'Master Data Lists', path: '/masters', icon: Database, perm: 'masters:read' },
    { name: 'Database Backups', path: '/backups', icon: Database, perm: 'backups:read' },
    { name: 'Media Library', path: '/media', icon: Folder, perm: 'files:read' },
    { name: 'Security & Audits', path: '/security', icon: Shield, perm: 'audit:read' },
    { name: 'Notifications Console', path: '/notifications', icon: Bell, perm: 'notifications:read' },
    { name: 'Reports Panel', path: '/reports', icon: FileBarChart, perm: 'reports:read' },
  ];

  const visibleItems = allItems.filter(
    (item) => (!item.perm || hasPermission(item.perm)) &&
      item.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm p-4 pt-[15vh] animate-in fade-in-0 duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center border-b px-3 bg-muted/20">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Type a command or search panels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {visibleItems.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No matches found.</p>
          ) : (
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all duration-150"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
