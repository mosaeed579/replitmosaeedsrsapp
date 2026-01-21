import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { LessonCard } from '@/components/LessonCard';
import { AddLessonDialog } from '@/components/AddLessonDialog';
import { EmptyState } from '@/components/EmptyState';
import { CramModeToggle } from '@/components/CramModeToggle';
import { DailyQuote } from '@/components/DailyQuote';
import { AlertTriangle, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const HomePage = () => {
  const {
    data,
    addLesson,
    markLessonDone,
    reviewLesson,
    deleteLesson,
    getDueTodayLessons,
    getMissedLessons,
    getCramModeLessons,
    toggleCramMode,
  } = useLocalStorage();

  const { isTabletMode, containerClass, gridClass } = useDisplayMode(data.settings.displayMode);

  const isCramMode = data.settings.cramMode;
  const useFSRS = data.settings.useFSRS;
  const desiredRetention = data.settings.desiredRetention || 0.9;
  const todayLessons = isCramMode ? getCramModeLessons() : getDueTodayLessons();
  const missedLessons = isCramMode ? [] : getMissedLessons();
  const totalDue = todayLessons.length + missedLessons.length;

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      {/* Header */}
      <header className={cn(
        'px-4 pt-8 pb-5 transition-colors duration-300',
        isCramMode ? 'bg-gradient-to-br from-warning/20 to-warning/5' : 'gradient-primary'
      )}>
        <div className={cn(containerClass, 'mx-auto')}>
          <div className="flex items-center gap-2 mb-1">
            {isCramMode ? (
              <Zap className="w-4 h-4 text-warning fill-warning" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary-foreground/80" />
            )}
            <span className={cn(
              'text-xs font-medium',
              isCramMode ? 'text-warning' : 'text-primary-foreground/80'
            )}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className={cn(
            'font-heading text-xl font-bold',
            isCramMode ? 'text-foreground' : 'text-primary-foreground'
          )}>
            {isCramMode ? 'Cram Mode Active' : "Today's Reviews"}
          </h1>
          <p className={cn('text-sm', isCramMode ? 'text-muted-foreground' : 'text-primary-foreground/80')}>
            {isCramMode 
              ? `${totalDue} lesson${totalDue !== 1 ? 's' : ''} due in next 48h`
              : totalDue === 0 
                ? "You're all caught up!" 
                : `${totalDue} lesson${totalDue !== 1 ? 's' : ''} to review`
            }
          </p>
        </div>
      </header>

      {/* Content */}
      <main className={cn(containerClass, 'mx-auto px-4 -mt-4')}>
        {/* Daily Quote */}
        <DailyQuote />

        {/* Cram Mode Toggle */}
        <div className="mb-4">
          <CramModeToggle isActive={isCramMode} onToggle={toggleCramMode} />
        </div>

        {/* Add Lesson Button */}
        <div className="flex justify-end mb-6">
          <AddLessonDialog categories={data.categories} onAdd={addLesson} />
        </div>

        {/* Lessons */}
        {data.lessons.length === 0 ? (
          <EmptyState type="no-lessons" />
        ) : totalDue === 0 ? (
          <EmptyState type="all-done" />
        ) : (
          <div className="space-y-6">
            {/* Due Lessons */}
            {todayLessons.length > 0 && (
              <section>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                  {isCramMode ? 'Priority Lessons' : 'Due Today'}
                </h2>
                <div className={cn('grid', gridClass)}>
                  {todayLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      intervals={data.settings.intervals}
                      onMarkDone={markLessonDone}
                      onReview={reviewLesson}
                      onDelete={deleteLesson}
                      useFSRS={useFSRS}
                      desiredRetention={desiredRetention}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Missed Lessons - hidden in cram mode */}
            {!isCramMode && missedLessons.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <h2 className="font-heading text-lg font-semibold text-danger">
                    Missed Lessons
                  </h2>
                </div>
                <div className={cn('grid', gridClass)}>
                  {missedLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      intervals={data.settings.intervals}
                      onMarkDone={markLessonDone}
                      onReview={reviewLesson}
                      onDelete={deleteLesson}
                      useFSRS={useFSRS}
                      desiredRetention={desiredRetention}
                      isMissed
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
