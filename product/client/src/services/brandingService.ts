/**
 * CAMPUSOS INSTITUTION BRANDING SERVICE
 *
 * Central authority for institutional identity, logos, and visual assets.
 * Strictly separates:
 * - App Icon (IMAGE 1): Used exclusively for Android app launcher, splash, and install identity.
 * - Official Emblem / Logo (IMAGE 2): Used for official documents, watermarks, PDFs, print, and headers.
 */

export interface InstitutionBrandingConfig {
  institutionName: string;
  shortName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  affiliation: string;
  accreditation: string;
  
  // Asset Paths
  appIconUrl: string;       // IMAGE 1 (Squircle App Icon)
  officialLogoUrl: string;  // IMAGE 2 (Official Emblem / Crest)
  watermarkLogoUrl: string; // IMAGE 2 (Watermark variant)

  // Brand Palette
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;

  // Watermark Defaults
  watermarkEnabled: boolean;
  watermarkOpacityLight: number; // 0.035 (3.5%)
  watermarkOpacityDark: number;  // 0.025 (2.5%)
  watermarkScale: number;        // 0.42 (42% of page/container)
  watermarkPosition: 'CENTER' | 'TILED' | 'DIAGONAL';

  // Per-Document Feature Flags
  printWatermarkEnabled: boolean;
  downloadWatermarkEnabled: boolean;
  certificateWatermarkEnabled: boolean;
  receiptWatermarkEnabled: boolean;
  documentHeaderLogoEnabled: boolean;
  documentFooterEnabled: boolean;
}

export const DEFAULT_BRANDING: InstitutionBrandingConfig = {
  institutionName: 'Al-Ameen Engineering College',
  shortName: 'AEC',
  tagline: 'Allah Enhances Efficiency',
  address: 'Karungalpalayam, Erode - 638 003, Tamil Nadu, India',
  phone: '+91 424 2500354',
  email: 'info@alameen.ac.in',
  website: 'https://alameen.ac.in',
  affiliation: 'Affiliated to Anna University, Chennai & Approved by AICTE, New Delhi',
  accreditation: 'Accredited by NAAC with A+ Grade | NBA Accredited Programmes',

  // Asset Paths
  appIconUrl: '/branding/app-icon.png',
  officialLogoUrl: '/branding/official-logo.png',
  watermarkLogoUrl: '/branding/official-logo.png',

  // Brand Palette
  primaryColor: '#4F46E5',
  primaryHoverColor: '#4338CA',
  accentColor: '#10B981',

  // Watermark Defaults
  watermarkEnabled: true,
  watermarkOpacityLight: 0.04,
  watermarkOpacityDark: 0.025,
  watermarkScale: 0.42,
  watermarkPosition: 'CENTER',

  // Per-Document Policies
  printWatermarkEnabled: true,
  downloadWatermarkEnabled: true,
  certificateWatermarkEnabled: true,
  receiptWatermarkEnabled: true,
  documentHeaderLogoEnabled: true,
  documentFooterEnabled: true,
};

let currentBranding: InstitutionBrandingConfig = { ...DEFAULT_BRANDING };

export class BrandingService {
  /**
   * Get the current active branding configuration.
   */
  static getBranding(): InstitutionBrandingConfig {
    return { ...currentBranding };
  }

  /**
   * Update active branding in-memory.
   */
  static setBranding(config: Partial<InstitutionBrandingConfig>): void {
    currentBranding = { ...currentBranding, ...config };
  }

  /**
   * Official Logo (IMAGE 2) - for documents, watermarks, certificates, and reports.
   */
  static getOfficialLogo(): string {
    return currentBranding.officialLogoUrl;
  }

  /**
   * App Icon (IMAGE 1) - ONLY for launcher icon, install badge, and app identity.
   */
  static getAppIcon(): string {
    return currentBranding.appIconUrl;
  }

  /**
   * Watermark Logo (IMAGE 2).
   */
  static getWatermarkLogo(): string {
    return currentBranding.watermarkLogoUrl || currentBranding.officialLogoUrl;
  }

  /**
   * Full Institution Name.
   */
  static getInstitutionName(): string {
    return currentBranding.institutionName;
  }

  /**
   * Short Name / Acronym (e.g. AEC).
   */
  static getShortName(): string {
    return currentBranding.shortName;
  }

  /**
   * Format standard institutional header letterhead string.
   */
  static getLetterheadText(): {
    title: string;
    tagline: string;
    affiliation: string;
    address: string;
  } {
    return {
      title: currentBranding.institutionName.toUpperCase(),
      tagline: currentBranding.tagline,
      affiliation: currentBranding.affiliation,
      address: currentBranding.address,
    };
  }
}
