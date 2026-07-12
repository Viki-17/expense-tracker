import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expensetracker.app',
  appName: 'Expense Tracker',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // In dev, Capacitor will load from the dev server.
    // Comment out for production APK builds.
    // url: 'http://192.168.1.x:5173',
    // cleartext: true,
  },
  plugins: {
    // Allow our custom SMS plugin
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
