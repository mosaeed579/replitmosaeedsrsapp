import { useState, useEffect, useCallback, useRef } from 'react';
import { AppData, Lesson, Settings, DEFAULT_SETTINGS, CategoryData, ActivityRecord, FSRSRating } from '@/types/lesson';
import { isNativePlatform } from '@/lib/platform';
import { getData, saveData, getInitialDataSync } from '@/lib/storage';
import { deleteLessonAttachments } from '@/lib/fileCleanup';
import { processReview, migrateToFSRS } from '@/lib/fsrs';

const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const useLocalStorage = () => {
  // Initialize with sync data (from localStorage), then load async from Preferences on native
  const [data, setData] = useState<AppData>(getInitialDataSync);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const hasLoadedRef = useRef(false);

  // Load data from Preferences on native platform
  useEffect(() => {
    // Prevent multiple loads in strict mode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        const storedData = await getData();
        setData(storedData);
        lastSavedDataRef.current = JSON.stringify(storedData);
      } catch (error) {
        console.error('[useLocalStorage] Error loading data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Save data whenever it changes (debounced for performance)
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete

    // Serialize current data to compare with last saved
    const currentDataStr = JSON.stringify(data);
    
    // Skip save if data hasn't actually changed
    if (currentDataStr === lastSavedDataRef.current) {
      return;
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save to avoid excessive writes
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveData(data);
        lastSavedDataRef.current = currentDataStr;
      } catch (error) {
        console.error('[useLocalStorage] Error saving data:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, isLoaded]);

  const recordActivity = useCallback(() => {
    const today = getTodayString();
    setData(prev => {
      const existingIndex = prev.activityHistory.findIndex(a => a.date === today);
      let newHistory: ActivityRecord[];
      
      if (existingIndex >= 0) {
        newHistory = prev.activityHistory.map((record, idx) =>
          idx === existingIndex ? { ...record, count: record.count + 1 } : record
        );
      } else {
        newHistory = [...prev.activityHistory, { date: today, count: 1 }];
      }
      
      // Keep only last 365 days
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const cutoffDate = oneYearAgo.toISOString().split('T')[0];
      newHistory = newHistory.filter(r => r.date >= cutoffDate);
      
      return { ...prev, activityHistory: newHistory };
    });
  }, []);

  const addLesson = useCallback((lesson: Omit<Lesson, 'id' | 'dateAdded' | 'nextReviewDate' | 'currentStage' | 'completed' | 'reviewHistory'> & { startDate?: Date; customIntervals?: number[] }) => {
    const now = new Date();
    const startDate = lesson.startDate || now;
    
    // Use custom intervals if provided, otherwise use global settings
    const baseIntervals = lesson.customIntervals || data.settings.intervals;
    const intervals = data.settings.cramMode 
      ? baseIntervals.map(i => Math.ceil(i * 0.5))
      : baseIntervals;
    
    const nextReview = new Date(startDate);
    nextReview.setDate(nextReview.getDate() + intervals[0]);
    
    // Remove startDate from the lesson object before storing, keep customIntervals
    const { startDate: _, ...lessonWithoutStartDate } = lesson;
    
    const newLesson: Lesson = {
      ...lessonWithoutStartDate,
      id: crypto.randomUUID(),
      dateAdded: now.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      currentStage: 0,
      completed: false,
      reviewHistory: [],
    };

    setData(prev => {
      const categories = prev.categories.includes(lesson.category) 
        ? prev.categories 
        : [...prev.categories, lesson.category];
      
      // Ensure categoryData exists for new category
      const categoryData = prev.categoryData.some(c => c.name === lesson.category)
        ? prev.categoryData
        : [...prev.categoryData, { name: lesson.category }];
      
      return {
        ...prev,
        lessons: [...prev.lessons, newLesson],
        categories,
        categoryData,
      };
    });
  }, [data.settings.intervals, data.settings.cramMode]);

  const markLessonDone = useCallback((lessonId: string) => {
    recordActivity();
    
    setData(prev => {
      return {
        ...prev,
        lessons: prev.lessons.map(lesson => {
          if (lesson.id !== lessonId) return lesson;
          
          // Use lesson's custom intervals if available, otherwise use global settings
          const baseIntervals = lesson.customIntervals || prev.settings.intervals;
          const intervals = prev.settings.cramMode 
            ? baseIntervals.map(i => Math.ceil(i * 0.5))
            : baseIntervals;
          
          const nextStage = lesson.currentStage + 1;
          const reviewHistory = [...(lesson.reviewHistory || []), new Date().toISOString()];
          
          if (nextStage >= intervals.length) {
            return { ...lesson, completed: true, reviewHistory };
          }
          
          const nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + intervals[nextStage]);
          
          return {
            ...lesson,
            currentStage: nextStage,
            nextReviewDate: nextReview.toISOString(),
            reviewHistory,
          };
        }),
      };
    });
  }, [recordActivity]);

  // FSRS-based review function
  const reviewLesson = useCallback((lessonId: string, rating: FSRSRating) => {
    recordActivity();
    
    setData(prev => {
      const desiredRetention = prev.settings.desiredRetention || 0.9;
      
      return {
        ...prev,
        lessons: prev.lessons.map(lesson => {
          if (lesson.id !== lessonId) return lesson;
          
          // Process FSRS review
          const { fsrsState, nextReviewDate } = processReview(lesson, rating, desiredRetention);
          
          const reviewHistory = [...(lesson.reviewHistory || []), new Date().toISOString()];
          
          // Update stage based on rating
          const baseIntervals = lesson.customIntervals || prev.settings.intervals;
          let nextStage = lesson.currentStage;
          let completed = lesson.completed;
          
          if (rating === 'again') {
            // Reset to earlier stage (but not below 0)
            nextStage = Math.max(0, lesson.currentStage - 1);
          } else if (rating === 'hard') {
            // Stay at same stage or advance slowly
            nextStage = lesson.currentStage;
          } else if (rating === 'good') {
            // Normal progression
            nextStage = lesson.currentStage + 1;
            if (nextStage >= baseIntervals.length) {
              completed = true;
            }
          } else if (rating === 'easy') {
            // Faster progression
            nextStage = Math.min(lesson.currentStage + 2, baseIntervals.length - 1);
            if (nextStage >= baseIntervals.length - 1 && lesson.currentStage >= baseIntervals.length - 2) {
              completed = true;
            }
          }
          
          return {
            ...lesson,
            currentStage: nextStage,
            nextReviewDate: nextReviewDate.toISOString(),
            reviewHistory,
            completed,
            fsrs: fsrsState,
          };
        }),
      };
    });
  }, [recordActivity]);

  // Migrate all lessons to FSRS
  const migrateAllToFSRS = useCallback(() => {
    setData(prev => {
      const intervals = prev.settings.intervals;
      return {
        ...prev,
        lessons: prev.lessons.map(lesson => {
          if (lesson.fsrs) return lesson; // Already migrated
          return {
            ...lesson,
            fsrs: migrateToFSRS(lesson, intervals),
          };
        }),
      };
    });
  }, []);

  const deleteLesson = useCallback(async (lessonId: string) => {
    // Find the lesson to delete its attachments first
    const lessonToDelete = data.lessons.find(l => l.id === lessonId);
    
    // Delete physical files from storage (native only)
    if (lessonToDelete && isNativePlatform()) {
      await deleteLessonAttachments(lessonToDelete);
    }
    
    setData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(l => l.id !== lessonId),
    }));
  }, [data.lessons]);

  const editLesson = useCallback((lessonId: string, updates: Partial<Lesson>) => {
    setData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson =>
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      ),
    }));
  }, []);

  // Reset lesson progress (stage, completed, reviewHistory, fsrs)
  const resetLessonProgress = useCallback((lessonId: string) => {
    setData(prev => {
      const lesson = prev.lessons.find(l => l.id === lessonId);
      if (!lesson) return prev;

      const baseIntervals = lesson.customIntervals || prev.settings.intervals;
      const intervals = prev.settings.cramMode 
        ? baseIntervals.map(i => Math.ceil(i * 0.5))
        : baseIntervals;
      
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + intervals[0]);

      return {
        ...prev,
        lessons: prev.lessons.map(l =>
          l.id === lessonId 
            ? { 
                ...l, 
                currentStage: 0, 
                completed: false, 
                reviewHistory: [], 
                fsrs: undefined,
                nextReviewDate: nextReview.toISOString(),
              } 
            : l
        ),
      };
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<Settings>) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const toggleCramMode = useCallback(() => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, cramMode: !prev.settings.cramMode },
    }));
  }, []);

  const updateCategoryExamDate = useCallback((categoryName: string, examDate: string | undefined) => {
    setData(prev => {
      const existingIndex = prev.categoryData.findIndex(c => c.name === categoryName);
      let newCategoryData: CategoryData[];
      
      if (existingIndex >= 0) {
        newCategoryData = prev.categoryData.map((cat, idx) =>
          idx === existingIndex ? { ...cat, examDate } : cat
        );
      } else {
        newCategoryData = [...prev.categoryData, { name: categoryName, examDate }];
      }
      
      return { ...prev, categoryData: newCategoryData };
    });
  }, []);

  const getCategoryExamDate = useCallback((categoryName: string): string | undefined => {
    return data.categoryData.find(c => c.name === categoryName)?.examDate;
  }, [data.categoryData]);

  const getDaysUntilExam = useCallback((categoryName: string): number | null => {
    const examDate = getCategoryExamDate(categoryName);
    if (!examDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    
    const diffTime = exam.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [getCategoryExamDate]);

  const exportData = useCallback(async () => {
    const jsonContent = JSON.stringify(data, null, 2);
    const filename = `medstudy-srs-backup-${new Date().toISOString().split('T')[0]}.json`;

    if (isNativePlatform()) {
      try {
        // Dynamic imports for Capacitor plugins (only loaded on native)
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        // Write JSON to cache directory
        await Filesystem.writeFile({
          path: filename,
          data: jsonContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        // Get the file URI
        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Cache,
        });

        // Open Android Share Sheet
        await Share.share({
          title: 'MedStudy SRS Backup',
          text: 'Your study data backup',
          files: [fileUri.uri],
          dialogTitle: 'Save or Share Backup',
        });
      } catch (error) {
        console.error('Export failed:', error);
        throw error;
      }
    } else {
      // Web fallback
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [data]);

  const importData = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as AppData;
      // Ensure backwards compatibility
      const normalized: AppData = {
        lessons: imported.lessons || [],
        settings: { ...DEFAULT_SETTINGS, ...imported.settings },
        categories: imported.categories || [],
        categoryData: imported.categoryData || [],
        activityHistory: imported.activityHistory || [],
      };
      setData(normalized);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, []);

  const getTodayLessons = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return data.lessons.filter(lesson => {
      if (lesson.completed) return false;
      const reviewDate = new Date(lesson.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate <= today;
    });
  }, [data.lessons]);

  const getMissedLessons = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return data.lessons.filter(lesson => {
      if (lesson.completed) return false;
      const reviewDate = new Date(lesson.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate < today;
    });
  }, [data.lessons]);

  const getDueTodayLessons = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return data.lessons.filter(lesson => {
      if (lesson.completed) return false;
      const reviewDate = new Date(lesson.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate.getTime() === today.getTime();
    });
  }, [data.lessons]);

  // Cram mode: Get lessons due in next 48 hours, prioritize Hard/Medium
  const getCramModeLessons = useCallback(() => {
    if (!data.settings.cramMode) return [];
    
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    const dueLessons = data.lessons.filter(lesson => {
      if (lesson.completed) return false;
      const reviewDate = new Date(lesson.nextReviewDate);
      return reviewDate <= in48Hours;
    });
    
    // Sort: Hard first, then Medium, then Easy
    const difficultyOrder = { Hard: 0, Medium: 1, Easy: 2 };
    return dueLessons.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
  }, [data.lessons, data.settings.cramMode]);

  // Stats for mastery
  const getMasteryStats = useCallback(() => {
    const total = data.lessons.length;
    if (total === 0) return { completed: 0, inProgress: 0, total: 0, masteryPercentage: 0 };
    
    const completed = data.lessons.filter(l => l.completed).length;
    const inProgress = total - completed;
    const masteryPercentage = Math.round((completed / total) * 100);
    
    return { completed, inProgress, total, masteryPercentage };
  }, [data.lessons]);

  // Get category stats with exam warning logic
  const getCategoryStats = useCallback((categoryName: string) => {
    const categoryLessons = data.lessons.filter(l => l.category === categoryName);
    const total = categoryLessons.length;
    const completed = categoryLessons.filter(l => l.completed).length;
    const pending = total - completed;
    const daysUntilExam = getDaysUntilExam(categoryName);
    
    // Smart alert: Show warning if pending lessons / days until exam > 3
    const showWarning = daysUntilExam !== null && daysUntilExam > 0 && pending > 0 && (pending / daysUntilExam) > 3;
    
    return { total, completed, pending, daysUntilExam, showWarning };
  }, [data.lessons, getDaysUntilExam]);

  // Rename a category
  const renameCategory = useCallback((oldName: string, newName: string) => {
    setData(prev => {
      // Update categories array
      const categories = prev.categories.map(c => c === oldName ? newName : c);
      
      // Update categoryData
      const categoryData = prev.categoryData.map(c => 
        c.name === oldName ? { ...c, name: newName } : c
      );
      
      // Update all lessons with this category
      const lessons = prev.lessons.map(l => 
        l.category === oldName ? { ...l, category: newName } : l
      );
      
      return { ...prev, categories, categoryData, lessons };
    });
  }, []);

  // Delete a category
  const deleteCategory = useCallback((categoryName: string, deleteAllLessons: boolean = false) => {
    setData(prev => {
      // Remove from categories array
      let categories = prev.categories.filter(c => c !== categoryName);
      
      // If moving lessons to Uncategorized, ensure it exists
      if (!deleteAllLessons && !categories.includes('Uncategorized')) {
        categories = [...categories, 'Uncategorized'];
      }
      
      // Remove from categoryData
      let categoryData = prev.categoryData.filter(c => c.name !== categoryName);
      
      // Ensure Uncategorized exists in categoryData if needed
      if (!deleteAllLessons && !categoryData.some(c => c.name === 'Uncategorized')) {
        categoryData = [...categoryData, { name: 'Uncategorized' }];
      }
      
      // Handle lessons
      const lessons = deleteAllLessons 
        ? prev.lessons.filter(l => l.category !== categoryName)
        : prev.lessons.map(l => 
            l.category === categoryName ? { ...l, category: 'Uncategorized' } : l
          );
      
      return { ...prev, categories, categoryData, lessons };
    });
  }, []);

  // Duplicate a lesson
  const duplicateLesson = useCallback((lessonId: string) => {
    const lessonToDuplicate = data.lessons.find(l => l.id === lessonId);
    if (!lessonToDuplicate) return;

    const now = new Date();
    const baseIntervals = lessonToDuplicate.customIntervals || data.settings.intervals;
    const intervals = data.settings.cramMode 
      ? baseIntervals.map(i => Math.ceil(i * 0.5))
      : baseIntervals;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervals[0]);

    const duplicatedLesson: Lesson = {
      ...lessonToDuplicate,
      id: crypto.randomUUID(),
      title: `${lessonToDuplicate.title} (Copy)`,
      dateAdded: now.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      currentStage: 0,
      completed: false,
      reviewHistory: [],
      fsrs: undefined, // Reset FSRS state for fresh start
      attachments: undefined, // Don't copy attachments (files are lesson-specific)
    };

    setData(prev => ({
      ...prev,
      lessons: [...prev.lessons, duplicatedLesson],
    }));
  }, [data.lessons, data.settings.intervals, data.settings.cramMode]);

  return {
    data,
    isLoaded,
    addLesson,
    markLessonDone,
    reviewLesson,
    migrateAllToFSRS,
    deleteLesson,
    editLesson,
    resetLessonProgress,
    duplicateLesson,
    updateSettings,
    toggleCramMode,
    updateCategoryExamDate,
    getCategoryExamDate,
    getDaysUntilExam,
    exportData,
    importData,
    getTodayLessons,
    getMissedLessons,
    getDueTodayLessons,
    getCramModeLessons,
    getMasteryStats,
    getCategoryStats,
    renameCategory,
    deleteCategory,
  };
};
