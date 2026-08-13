import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  watermarkConfig,
  watermarkPresets,
  type WatermarkPreset,
} from '../../config/watermark.config';

export interface InstitutionalWatermarkProps {
  logoSrc?: string;
  preset?: WatermarkPreset;
  opacity?: number;
  size?: 'small' | 'medium' | 'large';
  position?: 'center' | 'top-center';
  sidebarOffset?: boolean;
  isSidebarCollapsed?: boolean;
  className?: string;
}

export const InstitutionalWatermark: React.FC<InstitutionalWatermarkProps> = ({
  logoSrc = watermarkConfig.logo,
  preset = watermarkConfig.defaultPreset,
  opacity: customOpacity,
  size = 'medium',
  position = 'center',
  sidebarOffset = true,
  isSidebarCollapsed = false,
  className = '',
}) => {
  const location = useLocation();

  // Hide watermark on unauthenticated / exempt routes
  const shouldHide = watermarkConfig.hideRoutes.some((r) =>
    location.pathname.startsWith(r)
  );

  if (!watermarkConfig.enabled || shouldHide) {
    return null;
  }

  const presetValues = watermarkPresets[preset] || watermarkPresets.standard;
  const lightOpacity = customOpacity ?? presetValues.light;
  const darkOpacity = customOpacity ? customOpacity * 0.7 : presetValues.dark;

  // Custom size modifiers if requested
  const sizeClassMap = {
    small:
      'w-[55vw] min-w-[180px] max-w-[280px] md:w-[40vw] md:max-w-[400px] xl:w-[28vw] xl:max-w-[500px]',
    medium:
      'w-[72vw] min-w-[220px] max-w-[360px] md:w-[52vw] md:max-w-[520px] xl:w-[36vw] xl:min-w-[420px] xl:max-w-[680px]',
    large:
      'w-[85vw] min-w-[260px] max-w-[420px] md:w-[62vw] md:max-w-[600px] xl:w-[44vw] xl:max-w-[780px]',
  };

  const positionClass =
    position === 'top-center'
      ? 'items-start pt-20 sm:pt-28'
      : 'items-center';

  const sidebarPaddingClass = sidebarOffset
    ? isSidebarCollapsed
      ? 'lg:pl-20'
      : 'lg:pl-64'
    : '';

  return (
    <div
      aria-hidden="true"
      className={`
        pointer-events-none
        fixed
        inset-0
        z-0
        flex
        justify-center
        overflow-hidden
        select-none
        transition-all
        duration-300
        ${positionClass}
        ${sidebarPaddingClass}
        ${className}
      `}
    >
      <img
        src={logoSrc}
        alt=""
        draggable={false}
        loading="eager"
        decoding="async"
        className={`
          watermark-img
          h-auto
          object-contain
          transition-all
          duration-300
          ${sizeClassMap[size]}
        `}
        style={
          {
            '--watermark-opacity-light': lightOpacity,
            '--watermark-opacity-dark': darkOpacity,
          } as React.CSSProperties
        }
      />
    </div>
  );
};

export default InstitutionalWatermark;
