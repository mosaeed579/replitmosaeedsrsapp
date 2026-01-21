import { Capacitor } from '@capacitor/core';
import { AppData, DEFAULT_SETTINGS, Lesson, LessonAttachment } from '@/types/lesson';

const STORAGE_KEY = 'spaced-repetition-data';

// Check if running on native platform
const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Strip Base64 data from attachments before saving (native only)
 * This dramatically reduces storage size
 */
const stripAttachmentsFromLessons = (lessons: Lesson[]): Lesson[] => {
  if (!isNative()) {
    // On web, we need to keep URL since there's no filesystem
    return lessons;
  }

  return lessons.map(lesson => {
    if (!lesson.attachments || lesson.attachments.length === 0) {
      return lesson;
    }

    // Strip url field from attachments to save space
    const strippedAttachments: LessonAttachment[] = lesson.attachments.map(att => ({
      id: att.id,
      name: att.name,
      type: att.type,
      size: att.size,
      localPath: att.localPath,
      // Explicitly omit url to reduce storage size
    }));

    return { ...lesson, attachments: strippedAttachments };
  });
};

/**
 * Get data from storage (Preferences on native, localStorage on web)
 */
export const getData = async (): Promise<AppData> => {
  const defaultData: AppData = {
    lessons: [],
    settings: DEFAULT_SETTINGS,
    categories: [],
    categoryData: [],
    activityHistory: [],
  };

  try {
    if (isNative()) {
      // Use Capacitor Preferences for native Android/iOS
      const { Preferences } = await import('@capacitor/preferences');
      const result = await Preferences.get({ key: STORAGE_KEY });
      
      if (result.value) {
        const parsed = JSON.parse(result.value);
        return {
          ...parsed,
          categoryData: parsed.categoryData || [],
          activityHistory: parsed.activityHistory || [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...parsed.settings,
          },
        };
      }
    } else {
      // Use localStorage for web
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          categoryData: parsed.categoryData || [],
          activityHistory: parsed.activityHistory || [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...parsed.settings,
          },
        };
      }
    }
  } catch (error) {
    console.error('Error reading from storage:', error);
  }

  return defaultData;
};

/**
 * Save data to storage (Preferences on native, localStorage on web)
 * OPTIMIZED: Strips Base64 from attachments before saving on native
 */
export const saveData = async (data: AppData): Promise<void> => {
  try {
    // Create optimized data for storage
    const optimizedData: AppData = {
      ...data,
      lessons: stripAttachmentsFromLessons(data.lessons),
    };

    const jsonData = JSON.stringify(optimizedData);
    
    if (isNative()) {
      // Use Capacitor Preferences for native Android/iOS
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({
        key: STORAGE_KEY,
        value: jsonData,
      });
    } else {
      // Use localStorage for web
      localStorage.setItem(STORAGE_KEY, jsonData);
    }
  } catch (error) {
    console.error('Error writing to storage:', error);
    throw error;
  }
};

/**
 * Get data synchronously (for initial load - web only, native uses async)
 * This is used for the initial useState call
 */
export const getInitialDataSync = (): AppData => {
  const defaultData: AppData = {
    lessons: [],
    settings: DEFAULT_SETTINGS,
    categories: [],
    categoryData: [],
    activityHistory: [],
  };

  // For initial sync load, only try localStorage (web)
  // Native will be loaded async and trigger a state update
  if (typeof window === 'undefined') {
    return defaultData;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        categoryData: parsed.categoryData || [],
        activityHistory: parsed.activityHistory || [],
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
        },
      };
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }

  return defaultData;
};

/**
 * List all files in Directory.Data for debugging
 */
export const listDataDirectoryFiles = async (): Promise<{name: string; size?: number}[]> => {
  if (!isNative()) {
    return [{ name: '(Web platform - no file system access)' }];
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    
    // List root directory
    const result = await Filesystem.readdir({
      path: '',
      directory: Directory.Data,
    });

    const files: {name: string; size?: number}[] = [];
    
    for (const file of result.files) {
      if (file.type === 'directory' && file.name === 'attachments') {
        // List attachments subdirectory
        try {
          const attachments = await Filesystem.readdir({
            path: 'attachments',
            directory: Directory.Data,
          });
          for (const att of attachments.files) {
            files.push({ 
              name: `attachments/${att.name}`, 
              size: att.size 
            });
          }
        } catch {
          files.push({ name: 'attachments/ (error reading)' });
        }
      } else {
        files.push({ name: file.name, size: file.size });
      }
    }

    return files;
  } catch (error) {
    console.error('Error listing Directory.Data:', error);
    return [{ name: `Error: ${error}` }];
  }
};

/**
 * Get storage debug info
 */
export const getStorageDebugInfo = async (): Promise<{
  platform: string;
  storageType: string;
  dataSize: string;
  files: {name: string; size?: number}[];
  preferencesData: string | null;
  attachmentCount: number;
  totalAttachmentSize: string;
}> => {
  const files = await listDataDirectoryFiles();
  const platform = Capacitor.getPlatform();
  const storageType = isNative() ? 'Capacitor Preferences' : 'localStorage';
  
  let dataSize = '0 bytes';
  let preferencesData: string | null = null;

  // Calculate attachment stats
  const attachmentFiles = files.filter(f => f.name.startsWith('attachments/'));
  const attachmentCount = attachmentFiles.length;
  const totalAttachmentBytes = attachmentFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  const totalAttachmentSize = totalAttachmentBytes > 1024 * 1024 
    ? `${(totalAttachmentBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(totalAttachmentBytes / 1024).toFixed(2)} KB`;

  try {
    if (isNative()) {
      const { Preferences } = await import('@capacitor/preferences');
      const result = await Preferences.get({ key: STORAGE_KEY });
      preferencesData = result.value ? `${(result.value.length / 1024).toFixed(2)} KB` : 'No data';
      dataSize = preferencesData;
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      dataSize = stored ? `${(stored.length / 1024).toFixed(2)} KB` : '0 bytes';
      preferencesData = dataSize;
    }
  } catch (error) {
    console.error('Error getting storage debug info:', error);
  }

  return {
    platform,
    storageType,
    dataSize,
    files,
    preferencesData,
    attachmentCount,
    totalAttachmentSize,
  };
};

/**
 * Migrate existing data to remove Base64 from attachments
 * Call this once to clean up old data
 */
export const migrateStorageToOptimized = async (): Promise<boolean> => {
  if (!isNative()) return false;

  try {
    const data = await getData();
    
    // Check if any attachments still have url field with large Base64
    let needsMigration = false;
    for (const lesson of data.lessons) {
      for (const att of lesson.attachments || []) {
        if (att.url && att.url.length > 1000 && att.localPath) {
          needsMigration = true;
          break;
        }
      }
      if (needsMigration) break;
    }

    if (needsMigration) {
      console.log('[Storage] Migrating to optimized storage (removing Base64)...');
      await saveData(data); // This will strip Base64 automatically
      console.log('[Storage] Migration complete!');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Storage] Migration failed:', error);
    return false;
  }
};
