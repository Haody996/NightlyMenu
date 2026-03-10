import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haoqin.dinnerly',
  appName: 'Dinnerly',
  webDir: 'dist',
  server: {
    url: 'https://dinnerly.menu',
    cleartext: false,
  },
};

export default config;
