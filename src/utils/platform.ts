import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const isWeb = () => !Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const getPlatform = () => Capacitor.getPlatform();

// Useful for conditional rendering
export const platformClass = () => {
  if (isIOS()) return 'platform-ios';
  if (isAndroid()) return 'platform-android';
  return 'platform-web';
};
