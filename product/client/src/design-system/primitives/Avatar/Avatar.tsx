import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   AVATAR — CampusOS Design System Primitive
   
   User avatar with image, initials fallback, and size variants.
   ═══════════════════════════════════════════════════════════════════ */

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles: Record<string, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-caption-sm',
  md: 'w-9 h-9 text-caption',
  lg: 'w-11 h-11 text-body',
  xl: 'w-14 h-14 text-section-title',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name?: string): string {
  if (!name) return 'bg-muted text-muted-foreground';
  const colors = [
    'bg-primary/10 text-primary',
    'bg-success/10 text-success',
    'bg-warning/10 text-warning',
    'bg-info/10 text-info',
    'bg-danger/10 text-danger',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, name, size = 'md', className }) => {
  const [imgError, setImgError] = React.useState(false);
  const showImage = src && !imgError;

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full shrink-0',
        'font-semibold select-none overflow-hidden',
        !showImage && getColorFromName(name),
        sizeStyles[size],
        className
      )}
      role="img"
      aria-label={alt || name || 'User avatar'}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';
export default Avatar;
