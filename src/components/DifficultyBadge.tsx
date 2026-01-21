import { cn } from '@/lib/utils';
import { Difficulty } from '@/types/lesson';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export const DifficultyBadge = ({ difficulty, className }: DifficultyBadgeProps) => {
  const variants = {
    Easy: 'bg-success/15 text-success border-success/30',
    Medium: 'bg-warning/15 text-warning border-warning/30',
    Hard: 'bg-danger/15 text-danger border-danger/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
};
