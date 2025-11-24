import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';

export const configureStatusBar = async (options: {
  style?: 'light' | 'dark';
  backgroundColor?: string;
}) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (options.style) {
      await StatusBar.setStyle({
        style: options.style === 'light' ? Style.Light : Style.Dark
      });
    }

    if (options.backgroundColor) {
      await StatusBar.setBackgroundColor({ color: options.backgroundColor });
    }
  } catch (error) {
    logger.error('Status bar configuration error', error as Error);
  }
};

// Usage example: Call this when theme changes
export const setLightStatusBar = () =>
  configureStatusBar({ style: 'light', backgroundColor: '#44403c' });

export const setDarkStatusBar = () =>
  configureStatusBar({ style: 'dark', backgroundColor: '#fef2f2' });
