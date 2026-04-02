import { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;
const isDevelopment = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  appId: 'br.com.tritecnologias.veiculosmanager',
  appName: 'VeiculosManager',
  webDir: 'dist/public',
  server: {
    url: 'https://app.cotazerokm.com.br',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDevelopment,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
