/**
 * InstitutionContext
 *
 * Loads institution branding once on app bootstrap from GET /api/settings/branding
 * (which is a public, unauthenticated endpoint returning safe display data).
 *
 * Strictly separates:
 * - appIcon (IMAGE 1): Android application icon ONLY.
 * - officialLogo / watermarkLogo (IMAGE 2): Official Institution Emblem / Logo for documents, watermarks, PDFs, print.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { BrandingService, DEFAULT_BRANDING } from '../services/brandingService';
import { API_BASE_URL } from '../config/api-config';

export interface InstitutionBranding {
  /** Official institution name — use everywhere the institution name appears */
  institutionName: string;
  collegeName: string; // Alias for backward compatibility
  shortName: string;
  tagline: string;
  address: string;
  collegeAddress: string; // Alias
  phone: string;
  collegePhone: string; // Alias
  website: string;
  collegeWebsite: string; // Alias
  brandColor: string;
  
  // Asset Separation
  appIcon: string;       // IMAGE 1 (Android App Icon)
  officialLogo: string;  // IMAGE 2 (Official Emblem / Crest)
  watermarkLogo: string; // IMAGE 2

  /** Watermark configuration */
  watermark: {
    enabled: boolean;
    logoUrl: string;
    opacity: number;
    position: 'CENTER' | 'TILED' | 'DIAGONAL';
    applyPdf: boolean;
    applyPrint: boolean;
    applyCertificates: boolean;
    applyReceipts: boolean;
    applyDocs: boolean;
  };

  /** True while the first load is in progress */
  isLoading: boolean;
  /** True if the API load failed (component should use fallback values) */
  hasError: boolean;
  /** Re-fetch institution branding */
  refresh: () => void;
}

const FALLBACK: InstitutionBranding = {
  institutionName: DEFAULT_BRANDING.institutionName,
  collegeName: DEFAULT_BRANDING.institutionName,
  shortName: DEFAULT_BRANDING.shortName,
  tagline: DEFAULT_BRANDING.tagline,
  address: DEFAULT_BRANDING.address,
  collegeAddress: DEFAULT_BRANDING.address,
  phone: DEFAULT_BRANDING.phone,
  collegePhone: DEFAULT_BRANDING.phone,
  website: DEFAULT_BRANDING.website,
  collegeWebsite: DEFAULT_BRANDING.website,
  brandColor: DEFAULT_BRANDING.primaryColor,
  appIcon: DEFAULT_BRANDING.appIconUrl,
  officialLogo: DEFAULT_BRANDING.officialLogoUrl,
  watermarkLogo: DEFAULT_BRANDING.watermarkLogoUrl,
  watermark: {
    enabled: DEFAULT_BRANDING.watermarkEnabled,
    logoUrl: DEFAULT_BRANDING.watermarkLogoUrl,
    opacity: DEFAULT_BRANDING.watermarkOpacityLight * 100,
    position: DEFAULT_BRANDING.watermarkPosition,
    applyPdf: DEFAULT_BRANDING.downloadWatermarkEnabled,
    applyPrint: DEFAULT_BRANDING.printWatermarkEnabled,
    applyCertificates: DEFAULT_BRANDING.certificateWatermarkEnabled,
    applyReceipts: DEFAULT_BRANDING.receiptWatermarkEnabled,
    applyDocs: DEFAULT_BRANDING.downloadWatermarkEnabled,
  },
  isLoading: false,
  hasError: false,
  refresh: () => {},
};

const InstitutionContext = createContext<InstitutionBranding>(FALLBACK);

interface InstitutionProviderProps {
  children: ReactNode;
  /** Override API base URL (defaults to /api) */
  apiBase?: string;
}

export function InstitutionProvider({ children, apiBase = '' }: InstitutionProviderProps) {
  const [branding, setBranding] = useState<Omit<InstitutionBranding, 'refresh'>>({
    ...FALLBACK,
    isLoading: true,
  });

  const load = useCallback(async () => {
    try {
      setBranding((prev) => ({ ...prev, isLoading: true, hasError: false }));
      const baseUrl = apiBase || API_BASE_URL || '/api';
      const cleanUrl = baseUrl.endsWith('/api') ? `${baseUrl}/settings/branding` : `${baseUrl}/api/settings/branding`;
      const res = await fetch(cleanUrl, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.status === 'success' && json?.data) {
        const d = json.data;
        const name = d.collegeName || d.institutionName || FALLBACK.institutionName;
        const shortName = d.shortName || FALLBACK.shortName;
        const addr = d.collegeAddress || d.address || FALLBACK.address;
        const ph = d.collegePhone || d.phone || FALLBACK.phone;
        const web = d.collegeWebsite || d.website || FALLBACK.website;
        const color = d.brandColor || FALLBACK.brandColor;
        const officialLogo = d.officialLogo || d.watermark?.logoUrl || FALLBACK.officialLogo;
        const appIcon = d.appIcon || FALLBACK.appIcon;

        // Synchronize in-memory BrandingService
        BrandingService.setBranding({
          institutionName: name,
          shortName,
          address: addr,
          phone: ph,
          website: web,
          primaryColor: color,
          officialLogoUrl: officialLogo,
          watermarkLogoUrl: officialLogo,
          appIconUrl: appIcon,
        });

        setBranding({
          institutionName: name,
          collegeName: name,
          shortName,
          tagline: d.tagline || FALLBACK.tagline,
          address: addr,
          collegeAddress: addr,
          phone: ph,
          collegePhone: ph,
          website: web,
          collegeWebsite: web,
          brandColor: color,
          appIcon,
          officialLogo,
          watermarkLogo: officialLogo,
          watermark: {
            enabled: d.watermark?.enabled ?? FALLBACK.watermark.enabled,
            logoUrl: officialLogo,
            opacity: d.watermark?.opacity ?? FALLBACK.watermark.opacity,
            position: d.watermark?.position || FALLBACK.watermark.position,
            applyPdf: d.watermark?.applyPdf ?? FALLBACK.watermark.applyPdf,
            applyPrint: d.watermark?.applyPrint ?? FALLBACK.watermark.applyPrint,
            applyCertificates: d.watermark?.applyCertificates ?? FALLBACK.watermark.applyCertificates,
            applyReceipts: d.watermark?.applyReceipts ?? FALLBACK.watermark.applyReceipts,
            applyDocs: d.watermark?.applyDocs ?? FALLBACK.watermark.applyDocs,
          },
          isLoading: false,
          hasError: false,
        });
      } else {
        throw new Error('Unexpected response shape');
      }
    } catch {
      setBranding((prev) => ({
        ...FALLBACK,
        ...(prev.isLoading ? {} : prev),
        isLoading: false,
        hasError: true,
      }));
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const value: InstitutionBranding = { ...branding, refresh: load };

  return (
    <InstitutionContext.Provider value={value}>
      {children}
    </InstitutionContext.Provider>
  );
}

/**
 * Hook to access institution branding.
 */
export function useInstitution(): InstitutionBranding {
  return useContext(InstitutionContext);
}
