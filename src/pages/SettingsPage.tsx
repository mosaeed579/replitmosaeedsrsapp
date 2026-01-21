import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemePicker } from '@/components/ThemePicker';
import { IntervalPresets } from '@/components/IntervalPresets';
import { IntervalBuilder } from '@/components/IntervalBuilder';
import { DisplayModeSelector } from '@/components/DisplayModeSelector';
import { DebugStorageDialog } from '@/components/DebugStorageDialog';
import { Settings, Download, Upload, Clock, Sun, Moon, Monitor, Palette, Sparkles, LayoutGrid, Bug, Brain } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

import { ColorTheme, DisplayMode } from '@/types/lesson';

export const SettingsPage = () => {
  const { data, updateSettings, exportData, importData, migrateAllToFSRS } = useLocalStorage();
  const [intervals, setIntervals] = useState(data.settings.intervals);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isTabletMode, containerClass } = useDisplayMode(data.settings.displayMode);

  const handleDisplayModeChange = (displayMode: DisplayMode) => {
    updateSettings({ displayMode });
  };

  const handleSaveIntervals = () => {
    if (intervals.length === 0) {
      return;
    }
    updateSettings({ intervals });
  };

  const handleSelectPreset = (presetIntervals: number[]) => {
    setIntervals(presetIntervals);
    updateSettings({ intervals: presetIntervals });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        setIntervals(data.settings.intervals);
      }
    };
    reader.readAsText(file);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    
    // Save to dedicated key for faster startup loading (blocking script reads this)
    localStorage.setItem('theme-mode', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  };

const handleColorThemeChange = async (colorTheme: ColorTheme) => {
    // Save theme to persistent storage (Preferences on native)
    const { saveTheme } = await import('@/lib/themeStorage');
    await saveTheme(colorTheme);
    
    // Also save to dedicated key for faster startup loading (blocking script reads this)
    localStorage.setItem('color-theme', colorTheme);
    
    updateSettings({ colorTheme });
    document.documentElement.setAttribute('data-theme', colorTheme);
  };

  // Apply color theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.settings.colorTheme || 'medical');
  }, [data.settings.colorTheme]);

  // Sync intervals state when data changes (e.g., after import)
  useEffect(() => {
    setIntervals(data.settings.intervals);
  }, [data.settings.intervals]);

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  const hasUnsavedChanges = JSON.stringify(intervals) !== JSON.stringify(data.settings.intervals);

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-8 pb-4">
        <div className={`${containerClass} mx-auto`}>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground text-xs font-medium">
              Configuration
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Settings
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className={`${containerClass} mx-auto px-4 py-6 space-y-6`}>
        {/* Display Mode */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">Display Mode</CardTitle>
            </div>
            <CardDescription>
              Optimize the layout for your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DisplayModeSelector
              value={data.settings.displayMode || 'auto'}
              onChange={handleDisplayModeChange}
            />
          </CardContent>
        </Card>

        {/* FSRS Algorithm Settings */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.03s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">FSRS Algorithm</CardTitle>
            </div>
            <CardDescription>
              Adaptive spaced repetition based on your recall performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable FSRS</label>
                <p className="text-xs text-muted-foreground">
                  Use AI-optimized scheduling instead of fixed intervals
                </p>
              </div>
              <Switch
                checked={data.settings.useFSRS}
                onCheckedChange={(checked) => {
                  updateSettings({ useFSRS: checked });
                  if (checked) {
                    migrateAllToFSRS();
                  }
                }}
              />
            </div>
            
            {data.settings.useFSRS && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Desired Retention</label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {Math.round((data.settings.desiredRetention || 0.9) * 100)}%
                  </span>
                </div>
                <Slider
                  value={[(data.settings.desiredRetention || 0.9) * 100]}
                  onValueChange={([value]) => updateSettings({ desiredRetention: value / 100 })}
                  min={70}
                  max={97}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher retention = more reviews. 90% is recommended for most users.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interval Presets */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">Quick Presets</CardTitle>
            </div>
            <CardDescription>
              {data.settings.useFSRS 
                ? 'Starting intervals for new cards (FSRS will adapt after first review)'
                : 'Choose a preset schedule or customize your own'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntervalPresets 
              currentIntervals={data.settings.intervals} 
              onSelectPreset={handleSelectPreset}
              customIntervals={intervals}
            />
          </CardContent>
        </Card>

        {/* Custom Interval Builder */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">Custom Intervals</CardTitle>
            </div>
            <CardDescription>
              Build your own spaced repetition schedule (in days)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <IntervalBuilder 
              intervals={intervals}
              onChange={setIntervals}
            />
            {hasUnsavedChanges && (
              <Button onClick={handleSaveIntervals} className="w-full">
                Save Custom Intervals
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Color Theme */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">Color Theme</CardTitle>
            </div>
            <CardDescription>
              Choose your preferred color palette
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePicker 
              currentTheme={data.settings.colorTheme || 'tide'} 
              onThemeChange={handleColorThemeChange} 
            />
          </CardContent>
        </Card>

        {/* Light/Dark Mode */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">Appearance</CardTitle>
            </div>
            <CardDescription>
              Light or dark mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 ${
                    data.settings.theme === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    data.settings.theme === value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className={`text-sm font-medium ${
                    data.settings.theme === value ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">Data Management</CardTitle>
            </div>
            <CardDescription>
              Backup and restore your study data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={exportData} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Data (JSON)
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </CardContent>
        </Card>

        {/* Debug Storage */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading">Developer Tools</CardTitle>
            </div>
            <CardDescription>
              Debug storage and file persistence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DebugStorageDialog />
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <CardHeader>
            <CardTitle className="font-heading">About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">
                MedStudy SRS Pro
              </h3>
              <p className="text-sm text-muted-foreground">
                Version 3.0 • Spaced Repetition System
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data.lessons.length} lessons • {data.lessons.filter(l => l.completed).length} mastered
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
