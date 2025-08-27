import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medicacalc.voice',
  appName: 'medi-calc-voice',
  webDir: 'dist',
  // server: {
  //   url: "https://80b807c4-f11b-40c7-881e-069bbe21eeb5.lovableproject.com?forceHideBadge=true",
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999"
    }
  }
};

export default config;
