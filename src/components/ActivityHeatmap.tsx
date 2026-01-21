import { useMemo, useState } from 'react';
import { ActivityRecord } from '@/types/lesson';
import { cn } from '@/lib/utils';
import { Calendar, Flame, TrendingUp } from 'lucide-react';

interface ActivityHeatmapProps {
  activityHistory: ActivityRecord[];
}

interface DayData {
  date: string;
  count: number;
  dayOfWeek: number;
  month: number;
  year: number;
}

export const ActivityHeatmap = ({ activityHistory }: ActivityHeatmapProps) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const { weeks, monthLabels, stats } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const weeks: DayData[][] = [];
    const activityMap = new Map(activityHistory.map(a => [a.date, a.count]));
    
    // Start from January 1st of current year
    const startDate = new Date(currentYear, 0, 1);
    
    // Adjust to start from Sunday of that week
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }
    
    let currentWeek: DayData[] = [];
    const tempDate = new Date(startDate);
    
    // Generate until end of current year or today (whichever is later for display)
    const endDate = new Date(currentYear, 11, 31);
    
    while (tempDate <= endDate) {
      const dateStr = tempDate.toISOString().split('T')[0];
      currentWeek.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
        dayOfWeek: tempDate.getDay(),
        month: tempDate.getMonth(),
        year: tempDate.getFullYear(),
      });
      
      if (tempDate.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    // Generate month labels
    const monthLabels: { label: string; weekIndex: number; month: number; year: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonthYear = '';
    
    weeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const firstDay = week[0];
        const monthYearKey = `${firstDay.year}-${firstDay.month}`;
        if (monthYearKey !== lastMonthYear && firstDay.year === currentYear) {
          monthLabels.push({ 
            label: months[firstDay.month], 
            weekIndex, 
            month: firstDay.month,
            year: firstDay.year
          });
          lastMonthYear = monthYearKey;
        }
      }
    });

    // Calculate stats for current year only
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;
    const yearActivity = activityHistory.filter(a => a.date >= yearStart && a.date <= yearEnd);
    
    const totalReviews = yearActivity.reduce((sum, a) => sum + a.count, 0);
    const activeDays = yearActivity.filter(a => a.count > 0).length;
    
    // Calculate current streak
    let currentStreak = 0;
    const sortedDates = [...activityHistory]
      .filter(a => a.count > 0)
      .map(a => a.date)
      .sort()
      .reverse();
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    
    if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    return { 
      weeks, 
      monthLabels,
      stats: { totalReviews, activeDays, currentStreak }
    };
  }, [activityHistory]);

  const getIntensityClass = (count: number): string => {
    if (count === 0) return 'bg-muted/40 dark:bg-muted/20';
    if (count === 1) return 'bg-success/25';
    if (count <= 3) return 'bg-success/45';
    if (count <= 5) return 'bg-success/65';
    if (count <= 8) return 'bg-success/85';
    return 'bg-success';
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayStr = new Date().toISOString().split('T')[0];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate responsive cell size
  const cellSize = 10; // Base cell size for mobile
  const gap = 2;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-lg font-bold text-foreground truncate">{stats.totalReviews}</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">Reviews</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
          <div className="p-1.5 sm:p-2 rounded-lg bg-success/20">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-lg font-bold text-foreground truncate">{stats.activeDays}</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">Active</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
          <div className="p-1.5 sm:p-2 rounded-lg bg-warning/20">
            <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-warning" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-lg font-bold text-foreground truncate">{stats.currentStreak}</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">Streak</div>
          </div>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="rounded-xl border border-border bg-card/30 p-2 sm:p-4 overflow-x-auto">
        <div className="w-full">
          {/* Month labels */}
          <div className="flex mb-1 sm:mb-2 ml-5 sm:ml-6 text-[8px] sm:text-[10px] font-medium text-muted-foreground relative h-4">
            {monthLabels.map(({ label, weekIndex }, index) => {
              const position = weekIndex * (cellSize + gap);
              
              return (
                <span
                  key={`${label}-${weekIndex}-${index}`}
                  className="absolute whitespace-nowrap"
                  style={{ left: `${position}px` }}
                >
                  {label}
                </span>
              );
            })}
          </div>
          
          {/* Grid container */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1 sm:mr-1.5 text-[7px] sm:text-[9px] text-muted-foreground font-medium flex-shrink-0">
              {dayNames.map((day, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-end pr-0.5"
                  style={{ height: `${cellSize}px`, width: '12px' }}
                >
                  {i % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>
            
            {/* Weeks */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                    const day = week.find(d => d.dayOfWeek === dayOfWeek);
                    const isFuture = day && day.date > todayStr;
                    const isToday = day && day.date === todayStr;
                    
                    if (!day || isFuture) {
                      return (
                        <div
                          key={dayOfWeek}
                          className="rounded-[2px] bg-transparent"
                          style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                        />
                      );
                    }
                    
                    return (
                      <div
                        key={dayOfWeek}
                        className={cn(
                          'rounded-[2px] transition-all cursor-pointer',
                          getIntensityClass(day.count),
                          isToday && 'ring-1 ring-primary ring-offset-1 ring-offset-background',
                          'hover:ring-1 hover:ring-foreground/30'
                        )}
                        style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => setHoveredDay(day)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer: Legend + Tooltip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50 gap-2">
            {/* Tooltip area */}
            <div className="text-[10px] sm:text-xs text-muted-foreground min-h-[16px] order-2 sm:order-1">
              {hoveredDay && (
                <span>
                  <span className="font-medium text-foreground">{hoveredDay.count}</span>
                  {' reviews on '}
                  <span className="text-foreground">{formatDate(hoveredDay.date)}</span>
                </span>
              )}
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] text-muted-foreground order-1 sm:order-2">
              <span>Less</span>
              <div className="flex gap-0.5">
                <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px] bg-muted/40 dark:bg-muted/20" />
                <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px] bg-success/25" />
                <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px] bg-success/45" />
                <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px] bg-success/65" />
                <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px] bg-success/85" />
                <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-[2px] bg-success" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
