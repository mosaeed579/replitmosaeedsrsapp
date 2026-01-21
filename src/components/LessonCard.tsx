import { memo, useState, useMemo, useCallback } from 'react';
import { Trash2, BookOpen, Paperclip, Copy } from 'lucide-react';
import { Lesson, FSRSRating } from '@/types/lesson';
import { DifficultyBadge } from './DifficultyBadge';
import { ProgressBar } from './ProgressBar';
import { EditLessonDialog } from './EditLessonDialog';
import { AttachmentDialog } from './AttachmentDialog';
import { ReviewActionSheet } from './ReviewActionSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatInterval } from '@/lib/fsrs';

interface LessonCardProps {
  lesson: Lesson;
  intervals: number[];
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, updates: Partial<Lesson>) => void;
  onReview?: (id: string, rating: FSRSRating) => void;
  onDuplicate?: (id: string) => void;
  onResetProgress?: (id: string) => void;
  categories?: string[];
  isMissed?: boolean;
  showEditButton?: boolean;
  showAttachments?: boolean;
  showDuplicate?: boolean;
  useFSRS?: boolean;
  desiredRetention?: number;
}

export const LessonCard = memo(({ 
  lesson, 
  intervals, 
  onMarkDone, 
  onDelete, 
  onEdit,
  onReview,
  onDuplicate,
  onResetProgress,
  categories = [],
  isMissed,
  showEditButton = false,
  showAttachments = false,
  showDuplicate = false,
  useFSRS = true,
  desiredRetention = 0.9,
}: LessonCardProps) => {
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  
  // Memoize computed values to prevent recalculation on every render
  const { isToday, isCompleted, attachmentCount, stabilityLabel } = useMemo(() => {
    const reviewDate = new Date(lesson.nextReviewDate);
    return {
      isToday: new Date().toDateString() === reviewDate.toDateString(),
      isCompleted: lesson.completed,
      attachmentCount: lesson.attachments?.length || 0,
      stabilityLabel: lesson.fsrs 
        ? formatInterval(Math.round(lesson.fsrs.stability))
        : null,
    };
  }, [lesson.nextReviewDate, lesson.completed, lesson.attachments?.length, lesson.fsrs]);
  
  // Memoize callbacks to prevent creating new function references
  const handleCardClick = useCallback(() => {
    if (!lesson.completed) {
      setReviewSheetOpen(true);
    }
  }, [lesson.completed]);
  
  const handleReview = useCallback((lessonId: string, rating: FSRSRating) => {
    if (onReview) {
      onReview(lessonId, rating);
    } else {
      // Fallback to legacy markDone for "good" rating
      if (rating === 'good' || rating === 'easy') {
        onMarkDone(lessonId);
      }
    }
  }, [onReview, onMarkDone]);
  
  const handleDelete = useCallback(() => {
    onDelete(lesson.id);
  }, [onDelete, lesson.id]);
  
  const handleDuplicate = useCallback(() => {
    onDuplicate?.(lesson.id);
  }, [onDuplicate, lesson.id]);
  
  return (
    <>
      <Card 
        className={cn(
          'animate-slide-up transition-all duration-300 hover:shadow-md',
          !isCompleted && 'cursor-pointer hover:border-primary/50 active:scale-[0.98]',
          isMissed && 'border-danger/30 bg-danger/5',
          isCompleted && 'opacity-60 bg-success/5 border-success/30'
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <h3 className="font-heading font-semibold text-foreground truncate text-sm">
                  {lesson.title}
                </h3>
                {attachmentCount > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1 shrink-0 h-5">
                    <Paperclip className="w-3 h-3" />
                    {attachmentCount}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="truncate">{lesson.category}</span>
                <span>•</span>
                <span className="truncate">{lesson.subject}</span>
                <DifficultyBadge difficulty={lesson.difficulty} />
                {stabilityLabel && useFSRS && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    S: {stabilityLabel}
                  </Badge>
                )}
                {isCompleted && (
                  <span className="text-success font-medium">✓</span>
                )}
                {isMissed && !isCompleted && (
                  <span className="text-danger font-medium">Missed</span>
                )}
                {isToday && !isMissed && !isCompleted && (
                  <span className="text-primary font-medium">Due</span>
                )}
              </div>
              
              <div className="mt-2">
                <ProgressBar 
                  current={lesson.currentStage} 
                  total={intervals.length} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1" onClick={(e) => e.stopPropagation()}>
              {showEditButton && onEdit && (
                <EditLessonDialog
                  lesson={lesson}
                  categories={categories}
                  onEdit={onEdit}
                  onResetProgress={onResetProgress}
                  showAttachments={false}
                  globalIntervals={intervals}
                />
              )}
              {showAttachments && onEdit && (
                <AttachmentDialog
                  lesson={lesson}
                  onEdit={onEdit}
                />
              )}
              {showDuplicate && onDuplicate && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  onClick={handleDuplicate}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <ReviewActionSheet
        lesson={lesson}
        open={reviewSheetOpen}
        onOpenChange={setReviewSheetOpen}
        onReview={handleReview}
        intervals={intervals}
        useFSRS={useFSRS}
        desiredRetention={desiredRetention}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization - only re-render when truly needed
  return (
    prevProps.lesson.id === nextProps.lesson.id &&
    prevProps.lesson.title === nextProps.lesson.title &&
    prevProps.lesson.category === nextProps.lesson.category &&
    prevProps.lesson.subject === nextProps.lesson.subject &&
    prevProps.lesson.difficulty === nextProps.lesson.difficulty &&
    prevProps.lesson.currentStage === nextProps.lesson.currentStage &&
    prevProps.lesson.completed === nextProps.lesson.completed &&
    prevProps.lesson.nextReviewDate === nextProps.lesson.nextReviewDate &&
    prevProps.lesson.attachments?.length === nextProps.lesson.attachments?.length &&
    prevProps.lesson.fsrs?.stability === nextProps.lesson.fsrs?.stability &&
    prevProps.isMissed === nextProps.isMissed &&
    prevProps.showEditButton === nextProps.showEditButton &&
    prevProps.showAttachments === nextProps.showAttachments &&
    prevProps.showDuplicate === nextProps.showDuplicate &&
    prevProps.useFSRS === nextProps.useFSRS &&
    prevProps.intervals.length === nextProps.intervals.length &&
    prevProps.categories?.length === nextProps.categories?.length
  );
});

LessonCard.displayName = 'LessonCard';
