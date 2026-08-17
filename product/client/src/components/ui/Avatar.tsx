import React, { useState } from 'react';
import { resolveAssetUrl } from '../../utils/assets';
import { clsx } from 'clsx';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl sm:w-28 sm:h-28 sm:text-3xl',
};

const BG_COLORS = [
  'bg-indigo-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-teal-600',
];

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getBgColor(name?: string | null): string {
  if (!name) return BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[index];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = src && !hasError ? resolveAssetUrl(src) : null;
  const initials = getInitials(name);
  const bgColor = getBgColor(name);

  return (
    <div
      className={clsx(
        'relative rounded-xl flex items-center justify-center font-bold text-white shadow-xs overflow-hidden shrink-0 select-none',
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        !resolvedUrl && bgColor,
        className
      )}
      aria-label={alt || name || 'User Avatar'}
    >
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
