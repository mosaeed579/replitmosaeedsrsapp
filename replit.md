# Spaced Repetition Learning App

## Overview
A React-based spaced repetition learning application imported from Lovable. The app helps users learn through spaced repetition techniques with features for lessons, exams, library management, and statistics tracking.

## Project Architecture
- **Frontend**: React 18 with TypeScript, Vite bundler
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: TanStack React Query
- **Routing**: React Router DOM v6
- **Mobile**: Capacitor integration for mobile app capabilities

## Directory Structure
```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── pages/          # Page components
└── types/          # TypeScript type definitions
```

## Running the Project
- Development: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Preview: `npm run preview`

## Recent Changes
- 2026-01-21: Added Android home screen widgets
  - Due Lessons Widget: Shows count of lessons due for review today
  - Study Stats Widget: Shows total lessons, completed count, and study streak
  - Widget resources in `android-resources/` folder (layouts, Kotlin classes, metadata)
  - GitHub workflow updated to inject widgets during APK build
  - Widget data syncs to SharedPreferences via `src/lib/widgetSync.ts`
- 2026-01-21: Upgraded Capacitor packages to v8.x for file-opener compatibility
- 2026-01-21: Bug fixes and optimizations
  - Fixed nested button warning in CramModeToggle (changed button to div with role="button")
  - Added React Router v7 future flags to eliminate deprecation warnings
  - Optimized storage operations to reduce duplicate saves/loads
  - Fixed mixed language in Cram Mode description (now English only)
  - Removed duplicate theme initialization on mount
- 2026-01-21: Imported from Lovable and configured for Replit environment
  - Updated vite.config.ts to use port 5000 and allow all hosts
  - Installed dependencies with --legacy-peer-deps due to Capacitor version conflicts

## Android Widgets
The app includes two home screen widgets for Android:

1. **Due Lessons Widget** (2x2 cells)
   - Shows total count of lessons due today + missed lessons
   - Tapping opens the app

2. **Study Stats Widget** (3x2 cells)
   - Shows: Total lessons | Completed | Study streak
   - Tapping opens the app

Widget files are in `android-resources/` and are injected during the GitHub Actions build.

## Notes
- The app uses local storage for data persistence (web) / Capacitor Preferences (native)
- Capacitor packages v8.x are used for mobile deployment
- GitHub workflow builds Android APK automatically on push to main
