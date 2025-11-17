import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const useSafeArea = () => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const getSafeAreaInsets = () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Get safe area insets from CSS environment variables
          const computedStyle = getComputedStyle(document.documentElement);
          const top = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)').replace('px', '')) || 0;
          const right = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)').replace('px', '')) || 0;
          const bottom = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)').replace('px', '')) || 0;
          const left = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)').replace('px', '')) || 0;

          setInsets({ top, right, bottom, left });
        } catch (error) {
          console.error('Error getting safe area:', error);
        }
      }
    };

    getSafeAreaInsets();

    // Re-check on resize (orientation change)
    window.addEventListener('resize', getSafeAreaInsets);
    return () => window.removeEventListener('resize', getSafeAreaInsets);
  }, []);

  return insets;
};
