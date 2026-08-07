import React from 'react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import { AppIcon } from '../design-system/icons/AppIcon';
import { clsx } from 'clsx';

/*
  CAMPUSOS THEME SELECTOR v2
  
  Compact button toggle or pill group that allows instant switching
  between Light, Dark, and System modes across desktop & mobile.
*/

interface ThemeSelectorProps {
  variant?: 'icon' | 'pills' | 'dropdown';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'icon',
  className,
}) => {
  const { preference, resolved, setTheme, toggleTheme } = useTheme();

  if (variant === 'pills') {
    const options: { value: ThemePreference; label: string; icon: string }[] = [
      { value: 'light', label: 'Light', icon: 'Sun' },
      { value: 'dark', label: 'Dark', icon: 'Moon' },
      { value: 'system', label: 'System', icon: 'Laptop' },
    ];

    return (
      <div className={clsx('flex items-center gap-1 p-1 bg-surface-soft rounded-xl border border-border', className)}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            type="button"
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              preference === opt.value
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-secondary'
            )}
          >
            <AppIcon name={opt.icon} size="xs" />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default icon toggle (Sun <-> Moon)
  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={clsx(
        'p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-soft border border-transparent hover:border-border transition-colors touch-target flex items-center justify-center',
        className
      )}
      title={`Current: ${preference} mode (${resolved}). Click to switch to ${resolved === 'dark' ? 'light' : 'dark'} mode.`}
    >
      <AppIcon name={resolved === 'dark' ? 'Sun' : 'Moon'} size="sm" />
    </button>
  );
};
