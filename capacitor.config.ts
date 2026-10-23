import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.brightfolio.app",
  appName: "Brightfolio",
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#ffffff",
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 900,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
};

export default config;
