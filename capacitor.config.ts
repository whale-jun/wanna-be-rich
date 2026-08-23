import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wannaberich.ledger',
  appName: 'Wanna Be Rich?',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0b0f19',
    preferredContentMode: 'mobile'
  }
};

export default config;
