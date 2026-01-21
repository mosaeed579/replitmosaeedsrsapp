export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type FSRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface FSRSState {
  stability: number;      // Days until 90% forgetting probability
  difficulty: number;     // 1-10 scale
  elapsedDays: number;    // Days since last review
  scheduledDays: number;  // Interval calculated at last review
  reps: number;           // Total successful reviews
  lapses: number;         // Times forgotten (Again pressed)
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReview?: string;    // ISO timestamp
}

export interface LessonAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number; // File size in bytes
  localPath?: string; // Capacitor file path for persistence on native
  // url is now ONLY used for web platform or as temporary cache
  // On native, we load content on-demand from localPath
  url?: string;  // Optional - Data URL for web fallback only
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  subject: string;
  difficulty: Difficulty;
  dateAdded: string;
  nextReviewDate: string;
  currentStage: number;
  completed: boolean;
  reviewHistory?: string[]; // Track dates when lessons were reviewed
  customIntervals?: number[]; // Optional custom intervals for this lesson
  attachments?: LessonAttachment[]; // Optional file attachments
  fsrs?: FSRSState; // Optional FSRS state for adaptive scheduling
}

export interface CategoryData {
  name: string;
  examDate?: string; // Optional exam date for countdown
}

export type ColorTheme = 
  | 'zinc'      // Default
  | 'glacier'   // Cool blue
  | 'harvest'   // Warm amber
  | 'lavender'  // Purple
  | 'brutalist' // High contrast
  | 'obsidian'  // Deep dark
  | 'orchid'    // Pink/magenta
  | 'solar'     // Yellow/gold
  | 'tide'      // Ocean blue (replaces medical)
  | 'verdant';  // Forest green

export type DisplayMode = 'mobile' | 'tablet' | 'auto';

export interface Settings {
  intervals: number[];
  theme: 'light' | 'dark' | 'system';
  colorTheme: ColorTheme;
  cramMode: boolean;
  displayMode: DisplayMode;
  useFSRS: boolean; // Enable FSRS algorithm
  desiredRetention: number; // 0.7 to 0.97, default 0.9
}

export interface ActivityRecord {
  date: string; // YYYY-MM-DD format
  count: number;
}

export interface AppData {
  lessons: Lesson[];
  settings: Settings;
  categories: string[];
  categoryData: CategoryData[]; // Enhanced category data with exam dates
  activityHistory: ActivityRecord[]; // For heatmap
}

export const DEFAULT_INTERVALS = [1, 1, 4, 7, 14, 30];

export const DEFAULT_SETTINGS: Settings = {
  intervals: DEFAULT_INTERVALS,
  theme: 'light',
  colorTheme: 'tide',
  cramMode: false,
  displayMode: 'auto',
  useFSRS: true,
  desiredRetention: 0.9,
};
