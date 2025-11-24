import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const usePlatform = () => {
  const [platform] = useState({
    isNative: Capacitor.isNativePlatform(),
    isWeb: !Capacitor.isNativePlatform(),
    isIOS: Capacitor.getPlatform() === 'ios',
    isAndroid: Capacitor.getPlatform() === 'android',
    platform: Capacitor.getPlatform(),
  });

  return platform;
};
