import { Home, Library, GraduationCap, BarChart3, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const navItems = [
  { icon: Home, label: 'Tasks', path: '/' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: GraduationCap, label: 'Exams', path: '/categories' },
  { icon: BarChart3, label: 'Stats', path: '/stats' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, getTodayLessons, getMissedLessons } = useLocalStorage();
  const { isTabletMode, containerClass } = useDisplayMode(data.settings.displayMode);

  const todayCount = getTodayLessons().length;
  const missedCount = getMissedLessons().length;
  const totalTasks = todayCount + missedCount;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className={cn(
        'mx-auto flex items-center justify-around py-2 px-4',
        containerClass
      )}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isTasks = label === 'Tasks';
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg transition-all duration-200 relative',
                isTabletMode ? 'px-6 py-3' : 'px-4 py-2',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'rounded-xl transition-all duration-200 relative',
                isTabletMode ? 'p-3' : 'p-2',
                isActive && 'bg-primary/10'
              )}>
                <Icon className={cn(
                  isTabletMode ? 'w-6 h-6' : 'w-5 h-5',
                  isActive && 'scale-110'
                )} />
                
                {isTasks && totalTasks > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in duration-300">
                    {totalTasks > 99 ? '99+' : totalTasks}
                  </span>
                )}
              </div>
              <span className={cn(
                'font-medium',
                isTabletMode ? 'text-sm' : 'text-xs'
              )}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
