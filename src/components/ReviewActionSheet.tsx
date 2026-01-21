import { useState, useEffect } from 'react';
import { Lesson, FSRSRating } from '@/types/lesson';
import { getReviewOptions, formatInterval } from '@/lib/fsrs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { ProgressBar } from './ProgressBar';
import { DifficultyBadge } from './DifficultyBadge';
import { BookOpen, RotateCcw, Brain, Zap, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewActionSheetProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: (lessonId: string, rating: FSRSRating) => void;
  intervals: number[];
  desiredRetention?: number;
  useFSRS?: boolean;
}

const ratingConfig: Record<FSRSRating, { 
  label: string; 
  icon: typeof RotateCcw; 
  className: string;
  description: string;
}> = {
  again: {
    label: 'Again',
    icon: RotateCcw,
    className: 'bg-danger/10 hover:bg-danger/20 text-danger border-danger/30',
    description: 'Forgot completely',
  },
  hard: {
    label: 'Hard',
    icon: Brain,
    className: 'bg-warning/10 hover:bg-warning/20 text-warning border-warning/30',
    description: 'Struggled to recall',
  },
  good: {
    label: 'Good',
    icon: Zap,
    className: 'bg-success/10 hover:bg-success/20 text-success border-success/30',
    description: 'Recalled with effort',
  },
  easy: {
    label: 'Easy',
    icon: Sparkles,
    className: 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30',
    description: 'Instant recall',
  },
};

export const ReviewActionSheet = ({
  lesson,
  open,
  onOpenChange,
  onReview,
  intervals,
  desiredRetention = 0.9,
  useFSRS = true,
}: ReviewActionSheetProps) => {
  const [reviewOptions, setReviewOptions] = useState<Record<FSRSRating, { interval: number; label: string }> | null>(null);

  useEffect(() => {
    if (lesson && useFSRS) {
      const options = getReviewOptions(lesson, desiredRetention);
      setReviewOptions(options);
    } else if (lesson && !useFSRS) {
      // Legacy mode: use fixed intervals
      const currentStage = lesson.currentStage;
      const nextInterval = intervals[Math.min(currentStage + 1, intervals.length - 1)] || 1;
      
      setReviewOptions({
        again: { interval: 1, label: '1d' },
        hard: { interval: Math.max(1, Math.floor(nextInterval * 0.6)), label: formatInterval(Math.max(1, Math.floor(nextInterval * 0.6))) },
        good: { interval: nextInterval, label: formatInterval(nextInterval) },
        easy: { interval: Math.ceil(nextInterval * 1.5), label: formatInterval(Math.ceil(nextInterval * 1.5)) },
      });
    }
  }, [lesson, useFSRS, desiredRetention, intervals]);

  if (!lesson) return null;

  const handleRating = (rating: FSRSRating) => {
    onReview(lesson.id, rating);
    onOpenChange(false);
  };

  const ratings: FSRSRating[] = ['again', 'hard', 'good', 'easy'];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <DrawerTitle className="font-heading text-lg truncate">
                  {lesson.title}
                </DrawerTitle>
              </div>
              <DrawerDescription className="flex items-center gap-2 flex-wrap">
                <span>{lesson.category}</span>
                <span>•</span>
                <span>{lesson.subject}</span>
                <DifficultyBadge difficulty={lesson.difficulty} />
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-2">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span>Stage {lesson.currentStage + 1} of {intervals.length}</span>
            </div>
            <ProgressBar current={lesson.currentStage} total={intervals.length} />
          </div>
          
          {/* FSRS Stats */}
          {lesson.fsrs && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Stability</div>
                <div className="font-semibold text-sm">{formatInterval(Math.round(lesson.fsrs.stability))}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Reviews</div>
                <div className="font-semibold text-sm">{lesson.fsrs.reps}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Lapses</div>
                <div className="font-semibold text-sm">{lesson.fsrs.lapses}</div>
              </div>
            </div>
          )}
        </DrawerHeader>
        
        <DrawerFooter className="pt-4">
          <div className="text-center text-sm text-muted-foreground mb-3">
            How well did you remember this?
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {ratings.map((rating) => {
              const config = ratingConfig[rating];
              const Icon = config.icon;
              const option = reviewOptions?.[rating];
              
              return (
                <Button
                  key={rating}
                  variant="outline"
                  className={cn(
                    'flex flex-col items-center gap-1 h-auto py-3 px-2 border-2 transition-all',
                    config.className
                  )}
                  onClick={() => handleRating(rating)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{config.label}</span>
                  {option && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {option.label}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-1">
            {ratings.map((rating) => (
              <div key={rating} className="text-[10px] text-center text-muted-foreground">
                {ratingConfig[rating].description}
              </div>
            ))}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
