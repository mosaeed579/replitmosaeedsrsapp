import { useEffect, useState } from 'react';
import { DisplayMode } from '@/types/lesson';

const TABLET_MIN_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

export function useDisplayMode(settingMode: DisplayMode = 'auto') {
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if we should use tablet mode
  const isTabletMode = (() => {
    if (settingMode === 'tablet') return true;
    if (settingMode === 'mobile') return false;
    // Auto mode: detect based on screen width
    return screenWidth >= TABLET_MIN_WIDTH;
  })();

  // Return responsive values based on mode
  return {
    isTabletMode,
    displayMode: settingMode,
    screenWidth,
    // Utility values for layouts
    containerClass: isTabletMode ? 'max-w-5xl' : 'max-w-lg',
    gridClass: isTabletMode ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-3',
    cardPadding: isTabletMode ? 'p-5' : 'p-4',
  };
}
