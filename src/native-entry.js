// Bundled into www/js/native.js at build time (scripts/bundle-native.mjs).
// Loads Capacitor and every plugin the app uses, so notifications, adhan, GPS etc. work on the phone.
import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Geolocation } from "@capacitor/geolocation";
import { Preferences } from "@capacitor/preferences";
import { App } from "@capacitor/app";
import { Haptics } from "@capacitor/haptics";
import { StatusBar } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
window.KPT_NATIVE = {
  Capacitor, LocalNotifications, Geolocation, Preferences, App, Haptics, StatusBar, SplashScreen, Filesystem, Share,
  KptNative: registerPlugin("KptNative")
};
