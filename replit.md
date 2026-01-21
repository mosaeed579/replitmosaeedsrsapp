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
- 2026-01-21: Bug fixes and optimizations
  - Fixed nested button warning in CramModeToggle (changed button to div with role="button")
  - Added React Router v7 future flags to eliminate deprecation warnings
  - Optimized storage operations to reduce duplicate saves/loads
  - Fixed mixed language in Cram Mode description (now English only)
  - Removed duplicate theme initialization on mount
- 2026-01-21: Imported from Lovable and configured for Replit environment
  - Updated vite.config.ts to use port 5000 and allow all hosts
  - Installed dependencies with --legacy-peer-deps due to Capacitor version conflicts

## Notes
- The app uses local storage for data persistence
- Capacitor packages are included for potential mobile deployment
