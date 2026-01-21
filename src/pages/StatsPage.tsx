import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { MasteryChart } from '@/components/MasteryChart';
import { WeeklyProgressChart } from '@/components/WeeklyProgressChart';
import { StageDistributionChart } from '@/components/StageDistributionChart';
import { DifficultyBreakdown } from '@/components/DifficultyBreakdown';
import { CategoryPerformance } from '@/components/CategoryPerformance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Trophy, Target, TrendingUp, Flame, BookOpen, Layers, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StatsPage = () => {
  const { data, getMasteryStats, getTodayLessons, getMissedLessons, getDaysUntilExam } = useLocalStorage();
  const { isTabletMode, containerClass } = useDisplayMode(data.settings.displayMode);
  
  const { completed, inProgress, total, masteryPercentage } = getMasteryStats();
  const todayCount = getTodayLessons().length;
  const missedCount = getMissedLessons().length;

  // Calculate streak
  const calculateStreak = (): { current: number; best: number } => {
    if (data.activityHistory.length === 0) return { current: 0, best: 0 };
    
    const sortedHistory = [...data.activityHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const recordDate = new Date(sortedHistory[i].date);
      recordDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (recordDate.getTime() === expectedDate.getTime() && sortedHistory[i].count > 0) {
        currentStreak++;
      } else if (i === 0 && recordDate.getTime() !== expectedDate.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (recordDate.getTime() === yesterday.getTime() && sortedHistory[i].count > 0) {
          currentStreak = 1;
          continue;
        }
        break;
      } else {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = currentStreak;
    let tempStreak = 0;
    const allDates = sortedHistory.map(h => h.date).sort();
    
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(allDates[i - 1]);
        const currDate = new Date(allDates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }
    
    return { current: currentStreak, best: bestStreak };
  };

  const { current: streak, best: bestStreak } = calculateStreak();

  // Calculate average daily reviews
  const avgDailyReviews = data.activityHistory.length > 0
    ? Math.round(data.activityHistory.reduce((sum, r) => sum + r.count, 0) / data.activityHistory.length)
    : 0;

  // Get motivational message
  const getMotivation = () => {
    if (streak >= 30) return "🔥 Incredible! You're on fire!";
    if (streak >= 14) return "💪 Amazing consistency!";
    if (streak >= 7) return "⭐ Great week! Keep going!";
    if (streak >= 3) return "👍 Nice streak building!";
    if (todayCount === 0 && missedCount === 0) return "✨ All caught up!";
    if (missedCount > 0) return "📚 Let's catch up today!";
    return "🎯 Ready to learn?";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-card to-card border-b border-border px-4 pt-8 pb-4">
        <div className={cn(containerClass, 'mx-auto')}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground text-xs font-medium">
              Analytics
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Statistics
          </h1>
          <p className="text-muted-foreground text-sm">
            {getMotivation()}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className={cn(containerClass, 'mx-auto px-4 py-6 space-y-6')}>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 animate-fade-in">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Flame className={`w-5 h-5 mx-auto mb-1 ${streak > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              <p className="text-xl font-heading font-bold text-foreground">{streak}</p>
              <p className="text-xs text-muted-foreground leading-tight">Streak</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-success" />
              <p className="text-xl font-heading font-bold text-foreground">{completed}</p>
              <p className="text-xs text-muted-foreground leading-tight">Mastered</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-heading font-bold text-foreground">{todayCount}</p>
              <p className="text-xs text-muted-foreground leading-tight">Due</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <BarChart3 className="w-5 h-5 mx-auto mb-1 text-danger" />
              <p className="text-xl font-heading font-bold text-foreground">{missedCount}</p>
              <p className="text-xs text-muted-foreground leading-tight">Missed</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-3 lg:col-span-1">
            <CardContent className="p-3 sm:p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="text-xl font-heading font-bold text-foreground">{avgDailyReviews}</p>
              <p className="text-xs text-muted-foreground leading-tight">Avg/Day</p>
            </CardContent>
          </Card>
        </div>

        {/* Streak info */}
        {bestStreak > 0 && (
          <div className="text-center text-sm text-muted-foreground animate-fade-in">
            Best streak: <span className="font-medium text-foreground">{bestStreak} days</span>
          </div>
        )}

        {/* Weekly Progress Chart */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-base">Weekly Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyProgressChart activityHistory={data.activityHistory} />
          </CardContent>
        </Card>

        {/* Mastery & Stage Distribution - 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Mastery Chart */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading text-base">Mastery</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {masteryPercentage}% complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MasteryChart 
                completed={completed} 
                inProgress={inProgress} 
                masteryPercentage={masteryPercentage} 
              />
            </CardContent>
          </Card>

          {/* Difficulty Breakdown */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading text-base">Difficulty</CardTitle>
              </div>
              <CardDescription className="text-xs">
                By difficulty level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DifficultyBreakdown lessons={data.lessons} />
            </CardContent>
          </Card>
        </div>

        {/* Stage Distribution */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-base">Learning Pipeline</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Lessons at each review stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StageDistributionChart 
              lessons={data.lessons} 
              intervals={data.settings.intervals} 
            />
          </CardContent>
        </Card>

        {/* Category Performance */}
        {data.categories.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading text-base">Categories</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Progress by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPerformance 
                lessons={data.lessons}
                categories={data.categories}
                getDaysUntilExam={getDaysUntilExam}
              />
            </CardContent>
          </Card>
        )}

        {/* Activity Heatmap */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-base">Activity {new Date().getFullYear()}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Your review activity this year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap activityHistory={data.activityHistory} />
          </CardContent>
        </Card>

      </main>
    </div>
  );
};
