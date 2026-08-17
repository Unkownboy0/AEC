import { CapacitorConfig } from '@capacitor/cli';

const developmentServerUrl = process.env.CAPACITOR_DEV_SERVER_URL?.trim();
const androidScheme = process.env.CAPACITOR_ANDROID_SCHEME === 'http' ? 'http' : 'https';

const config: CapacitorConfig = {
  appId: 'com.geetorus.campusos',
  appName: 'GEETORUS CAMPUSOS',
  webDir: 'dist',
  server: developmentServerUrl
    ? { url: developmentServerUrl, androidScheme: developmentServerUrl.startsWith('https:') ? 'https' : 'http', cleartext: true }
    : { androidScheme, cleartext: androidScheme === 'http' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#F59E0B',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
