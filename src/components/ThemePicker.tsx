import { Check } from 'lucide-react';
import { ColorTheme } from '@/types/lesson';
import { cn } from '@/lib/utils';

interface ThemePickerProps {
  currentTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
}

const themes: { id: ColorTheme; name: string; colors: string[] }[] = [
  { id: 'zinc', name: 'Default', colors: ['#71717a', '#a1a1aa', '#52525b'] },
  { id: 'glacier', name: 'Glacier', colors: ['#0ea5e9', '#38bdf8', '#0284c7'] },
  { id: 'harvest', name: 'Harvest', colors: ['#f59e0b', '#fbbf24', '#d97706'] },
  { id: 'lavender', name: 'Lavender', colors: ['#8b5cf6', '#a78bfa', '#7c3aed'] },
  { id: 'brutalist', name: 'Brutalist', colors: ['#000000', '#404040', '#171717'] },
  { id: 'obsidian', name: 'Obsidian', colors: ['#4c1d95', '#6d28d9', '#3b0764'] },
  { id: 'orchid', name: 'Orchid', colors: ['#db2777', '#ec4899', '#be185d'] },
  { id: 'solar', name: 'Solar', colors: ['#eab308', '#facc15', '#ca8a04'] },
  { id: 'tide', name: 'Tide', colors: ['#0891b2', '#22d3ee', '#0e7490'] },
  { id: 'verdant', name: 'Verdant', colors: ['#059669', '#34d399', '#047857'] },
];

export const ThemePicker = ({ currentTheme, onThemeChange }: ThemePickerProps) => {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={cn(
            'flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-lg border transition-all duration-200',
            currentTheme === theme.id
              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden" style={{
            background: `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 50%, ${theme.colors[2]} 100%)`
          }}>
            {currentTheme === theme.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>
          <span className={cn(
            'text-[10px] sm:text-xs font-medium',
            currentTheme === theme.id ? 'text-primary' : 'text-muted-foreground'
          )}>
            {theme.name}
          </span>
        </button>
      ))}
    </div>
  );
};
