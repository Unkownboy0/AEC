import React from 'react';
import { useLocation } from 'react-router-dom';
import { useInstitution } from '../../context/InstitutionContext';
import { WatermarkService, type WatermarkPolicy } from '../../services/watermarkService';
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

export const InstitutionalWatermark: React.FC<InstitutionalWatermarkProps> = ({
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

  // Hide watermark on exempt routes (login, biometric, scanner, etc.)
  const isExempt = WatermarkService.shouldHideWatermarkOnRoute(location.pathname);
  const isEnabled = institution.watermark?.enabled ?? true;

  if (!isEnabled || isExempt) {
    return null;
  }

  const effectiveLogo = logoSrc || institution.watermarkLogo || institution.officialLogo || WatermarkService.getInstitutionLogo();
  const presetValues = watermarkPresets[preset] || watermarkPresets.standard;
  const lightOpacity = customOpacity ?? (institution.watermark?.opacity ? institution.watermark.opacity / 100 : presetValues.light);
  const darkOpacity = customOpacity ? customOpacity * 0.65 : presetValues.dark;

  // Responsive size constraints
  const sizeClassMap = {
    small:
      'w-[50vw] min-w-[160px] max-w-[260px] md:w-[36vw] md:max-w-[380px] xl:w-[25vw] xl:max-w-[460px]',
    medium:
      'w-[68vw] min-w-[200px] max-w-[340px] md:w-[48vw] md:max-w-[480px] xl:w-[34vw] xl:min-w-[400px] xl:max-w-[620px]',
    large:
      'w-[82vw] min-w-[240px] max-w-[400px] md:w-[58vw] md:max-w-[560px] xl:w-[42vw] xl:max-w-[720px]',
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
        src={effectiveLogo}
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
