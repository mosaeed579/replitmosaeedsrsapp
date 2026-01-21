import { Capacitor } from '@capacitor/core';
import { AppData } from '@/types/lesson';

const WIDGET_PREFS_GROUP = 'MedStudyWidget';

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

export const syncWidgetData = async (data: AppData): Promise<void> => {
  if (!isNativePlatform()) return;

  try {
    const { Preferences } = await import('@capacitor/preferences');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueCount = 0;
    let missedCount = 0;
    let completedCount = 0;

    for (const lesson of data.lessons) {
      if (lesson.completed) {
        completedCount++;
        continue;
      }
      
      const reviewDate = new Date(lesson.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      
      if (reviewDate.getTime() === today.getTime()) {
        dueCount++;
      } else if (reviewDate < today) {
        missedCount++;
      }
    }

    const totalLessons = data.lessons.length;
    
    const studyStreak = calculateStudyStreak(data.activityHistory);

    await Preferences.set({
      key: `${WIDGET_PREFS_GROUP}_due_lessons_count`,
      value: dueCount.toString(),
    });

    await Preferences.set({
      key: `${WIDGET_PREFS_GROUP}_missed_lessons_count`,
      value: missedCount.toString(),
    });

    await Preferences.set({
      key: `${WIDGET_PREFS_GROUP}_total_lessons`,
      value: totalLessons.toString(),
    });

    await Preferences.set({
      key: `${WIDGET_PREFS_GROUP}_completed_lessons`,
      value: completedCount.toString(),
    });

    await Preferences.set({
      key: `${WIDGET_PREFS_GROUP}_study_streak`,
      value: studyStreak.toString(),
    });

    triggerWidgetUpdate();
  } catch (error) {
    console.error('[WidgetSync] Error syncing widget data:', error);
  }
};

const calculateStudyStreak = (activityHistory: { date: string; count: number }[]): number => {
  if (!activityHistory || activityHistory.length === 0) return 0;

  const sortedHistory = [...activityHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const hasActivityToday = sortedHistory.some(r => r.date === todayStr);
  const hasActivityYesterday = sortedHistory.some(r => r.date === yesterdayStr);

  if (!hasActivityToday && !hasActivityYesterday) {
    return 0;
  }

  let streak = 0;
  let currentDate = hasActivityToday ? today : yesterday;

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const hasActivity = sortedHistory.some(r => r.date === dateStr);
    
    if (hasActivity) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const triggerWidgetUpdate = async (): Promise<void> => {
  console.log('[WidgetSync] Widget data updated. Native widgets will refresh on next interval.');
};
