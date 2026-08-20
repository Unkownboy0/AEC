import React from 'react';
import { clsx } from 'clsx';

export type LogoVariant = 'onboarding' | 'login' | 'header' | 'document' | 'watermark' | 'compact';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';

export interface InstitutionLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  imageClassName?: string;
  withContainer?: boolean;
  alt?: string;
}

const SIZE_CONTAINER_CLASSES: Record<LogoSize, string> = {
  xs: 'w-6 h-6 p-0.5 rounded-md',
  sm: 'w-8 h-8 p-1 rounded-lg',
  md: 'w-12 h-12 p-1.5 rounded-xl',
  lg: 'w-16 h-16 p-2 rounded-2xl',
  xl: 'w-20 h-20 p-2.5 rounded-2xl',
  '2xl': 'w-28 h-28 p-3.5 rounded-3xl',
  custom: '',
};

export const InstitutionLogo: React.FC<InstitutionLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className,
  imageClassName,
  withContainer = true,
  alt = 'Al-Ameen Engineering College Official Seal',
}) => {
  const isWatermark = variant === 'watermark';

  if (isWatermark) {
    return (
      <img
        src="/branding/official-logo.png"
        alt={alt}
        className={clsx('object-contain pointer-events-none select-none opacity-5 dark:opacity-10', className)}
      />
    );
  }

  const containerSurface = clsx(
    'relative flex items-center justify-center shrink-0 overflow-hidden transition-all duration-200',
    // High-contrast clean emblem surface in both Light and Dark modes
    variant === 'login' && 'bg-white shadow-md border border-slate-200/80 hover:shadow-lg',
    variant === 'onboarding' && 'bg-white shadow-xl border border-white/30 backdrop-blur-sm',
    variant === 'header' && 'bg-white shadow-xs border border-border/80',
    variant === 'document' && 'bg-white border border-slate-200',
    variant === 'compact' && 'bg-white border border-border',
    SIZE_CONTAINER_CLASSES[size],
    className
  );

  const imageStyles = clsx(
    'w-full h-full object-contain filter drop-shadow-xs select-none',
    imageClassName
  );

  if (!withContainer) {
    return (
      <img
        src="/branding/official-logo.png"
        alt={alt}
        className={clsx('object-contain', className)}
      />
    );
  }

  return (
    <div className={containerSurface}>
      <img
        src="/branding/official-logo.png"
        alt={alt}
        className={imageStyles}
        loading="eager"
      />
    </div>
  );
};

export default InstitutionLogo;
