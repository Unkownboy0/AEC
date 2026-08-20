import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useInstitution } from '../../context/InstitutionContext';
import { WatermarkService } from '../../services/watermarkService';
import { watermarkPresets, type WatermarkPreset } from '../../config/watermark.config';

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

/**
 * ═════════════════════════════════════════════════════════════════════
 * INSTITUTION BACKGROUND WATERMARK — CampusOS
 * 
 * Global subtle background institutional emblem rendered at the app shell level:
 * - Stacking: APP BACKGROUND → WATERMARK → PAGE CONTENT → CARDS / MODALS / NAV
 * - Light Theme: Calibrated ~4.8% opacity with subtle grayscale contrast
 * - Dark Theme: Calibrated ~5.8% opacity with clean monochrome mask
 * - Fixed Viewport: Centered horizontally, top 54% (avoids fighting headers)
 * - Safe Fallback: Graceful failure without broken image icons
 * ═════════════════════════════════════════════════════════════════════
 */
export const InstitutionBackgroundWatermark: React.FC<InstitutionalWatermarkProps> = ({
  logoSrc,
  preset = 'standard',
  opacity: customOpacity,
  size = 'medium',
  position = 'center',
  sidebarOffset = true,
  isSidebarCollapsed = false,
  className = '',
}) => {
  const location = useLocation();
  const institution = useInstitution();
  const [hasError, setHasError] = useState(false);

  // Hide watermark on exempt routes (login, onboarding, biometric, scanner, etc.)
  const isExempt = WatermarkService.shouldHideWatermarkOnRoute(location.pathname);
  const isEnabled = institution.watermark?.enabled ?? true;

  if (!isEnabled || isExempt || hasError) {
    return null;
  }

  const effectiveLogo =
    logoSrc ||
    institution.watermarkLogo ||
    institution.officialLogo ||
    WatermarkService.getInstitutionLogo() ||
    '/branding/official-logo.png';

  const presetValues = watermarkPresets[preset] || watermarkPresets.standard;
  const configuredLight = customOpacity ?? (institution.watermark?.opacity ? institution.watermark.opacity / 100 : presetValues.light);
  
  // Calibrated opacities (Light ~4.8%, Dark ~5.8%)
  const lightOpacity = customOpacity ?? Math.min(0.06, Math.max(0.038, configuredLight || 0.048));
  const darkOpacity = customOpacity ? customOpacity * 1.1 : Math.min(0.07, Math.max(0.045, presetValues.dark || 0.058));

  // Responsive size constraints across viewport breakpoints
  const sizeClassMap = {
    small:
      'w-[50vw] min-w-[180px] max-w-[280px] md:w-[34vw] md:max-w-[380px] lg:w-[26vw] lg:max-w-[420px]',
    medium:
      'w-[65vw] min-w-[220px] max-w-[340px] md:w-[45vw] md:max-w-[440px] lg:w-[36vw] lg:max-w-[540px]',
    large:
      'w-[80vw] min-w-[260px] max-w-[400px] md:w-[58vw] md:max-w-[560px] lg:w-[46vw] lg:max-w-[680px]',
  };

  const positionClass =
    position === 'top-center'
      ? 'top-[42%]'
      : 'top-[54%]';

  const sidebarPaddingClass = sidebarOffset
    ? isSidebarCollapsed
      ? 'lg:left-[calc(50%+2.5rem)]'
      : 'lg:left-[calc(50%+8rem)]'
    : 'left-1/2';

  return (
    <div
      aria-hidden="true"
      className={`
        pointer-events-none
        fixed
        inset-0
        z-0
        overflow-hidden
        select-none
        ${className}
      `}
    >
      <div
        className={`
          absolute
          -translate-x-1/2
          -translate-y-1/2
          flex
          items-center
          justify-center
          transition-all
          duration-300
          ${positionClass}
          ${sidebarPaddingClass}
        `}
      >
        <img
          src={effectiveLogo}
          alt=""
          draggable={false}
          loading="eager"
          decoding="async"
          onError={() => setHasError(true)}
          className={`
            watermark-img
            aspect-square
            h-auto
            object-contain
            transition-all
            duration-300
            ${sizeClassMap[size]}
          `}
          style={
            {
              '--campus-watermark-opacity-light': lightOpacity,
              '--campus-watermark-opacity-dark': darkOpacity,
              '--watermark-opacity-light': lightOpacity,
              '--watermark-opacity-dark': darkOpacity,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
};

// Aliases for seamless backward compatibility across layout templates
export const InstitutionalWatermark = InstitutionBackgroundWatermark;
export default InstitutionBackgroundWatermark;
