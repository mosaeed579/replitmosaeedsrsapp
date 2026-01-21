import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { LibraryPage } from "./pages/LibraryPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { BottomNav } from "./components/BottomNav";
import NotFound from "./pages/NotFound";
import { useEffect, useRef } from "react";
import { isNativePlatform } from "@/lib/platform";
import { loadTheme, applyTheme } from "@/lib/themeStorage";
import { incrementQuoteIndex } from "@/lib/quoteStorage";

const queryClient = new QueryClient();

// ============= IMMEDIATE THEME INITIALIZATION =============
// This runs BEFORE React mounts to prevent flash of wrong theme
const initializeThemeImmediate = async () => {
  try {
    // 1. Load and apply color theme (lavender, tide, etc.)
    const savedColorTheme = await loadTheme();
    if (savedColorTheme) {
      applyTheme(savedColorTheme);
    }
    
    // 2. Load and apply dark/light mode
    let themeMode: string | null = null;
    
    if (isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        
        // First try dedicated theme-mode key
        const result = await Preferences.get({ key: 'theme-mode' });
        if (result.value) {
          themeMode = result.value;
        } else {
          // Fallback: read from full app data
          const dataResult = await Preferences.get({ key: 'spaced-repetition-data' });
          if (dataResult.value) {
            const data = JSON.parse(dataResult.value);
            themeMode = data.settings?.theme || 'light';
          }
        }
      } catch (e) {
        console.error('[App] Error loading theme from Preferences:', e);
      }
    } else {
      // Web: read from localStorage
      const stored = localStorage.getItem('spaced-repetition-data');
      if (stored) {
        const data = JSON.parse(stored);
        themeMode = data.settings?.theme || 'light';
      }
    }
    
    // Apply dark/light mode immediately
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themeMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    console.error('[App] Failed to initialize theme immediately:', e);
  }
};

// Execute theme init immediately (before React renders)
initializeThemeImmediate();

const AppContent = () => {
  const hasInitialized = useRef(false);

  // Increment quote index on each app launch (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      incrementQuoteIndex();
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
