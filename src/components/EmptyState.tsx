import { BookOpen, CheckCircle2 } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-lessons' | 'all-done';
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  if (type === 'all-done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
          All caught up!
        </h3>
        <p className="text-muted-foreground max-w-xs">
          You've reviewed all your lessons for today. Great job keeping up with your studies!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <BookOpen className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
        No lessons yet
      </h3>
      <p className="text-muted-foreground max-w-xs">
        Start by adding your first lesson. Your spaced repetition journey begins here!
      </p>
    </div>
  );
};
