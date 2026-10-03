import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitmob.app',
  appName: 'FitMob',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
