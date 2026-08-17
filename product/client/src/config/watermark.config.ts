export interface WatermarkPresetConfig {
  light: number;
  dark: number;
}

export type WatermarkPreset = 'subtle' | 'standard' | 'visible';

export const watermarkPresets: Record<WatermarkPreset, WatermarkPresetConfig> = {
  subtle: {
    light: 0.03,
    dark: 0.02,
  },
  standard: {
    light: 0.04,
    dark: 0.025,
  },
  visible: {
    light: 0.055,
    dark: 0.04,
  },
};

export const watermarkConfig = {
  enabled: true,
  logo: '/branding/official-logo.png',
  defaultPreset: 'standard' as WatermarkPreset,
  hideRoutes: [
    '/login',
    '/forgot-password',
    '/verify-otp',
    '/reset-password',
    '/public',
    '/scanner',
    '/camera',
    '/biometric',
  ],
  responsiveSizes: {
    mobile: {
      width: '72vw',
      maxWidth: 360,
      minWidth: 220,
    },
    tablet: {
      width: '52vw',
      maxWidth: 520,
    },
    desktop: {
      width: '36vw',
      minWidth: 420,
      maxWidth: 680,
    },
  },
};
