import { Lesson } from '@/types/lesson';
import { AlertTriangle, Trophy, BookOpen } from 'lucide-react';

interface CategoryPerformanceProps {
  lessons: Lesson[];
  categories: string[];
  getDaysUntilExam: (category: string) => number | null;
}

export const CategoryPerformance = ({ 
  lessons, 
  categories,
  getDaysUntilExam 
}: CategoryPerformanceProps) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No categories yet
      </div>
    );
  }

  const getCategoryData = (category: string) => {
    const categoryLessons = lessons.filter(l => l.category === category);
    const total = categoryLessons.length;
    const completed = categoryLessons.filter(l => l.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const daysUntilExam = getDaysUntilExam(category);
    const pending = total - completed;
    const showWarning = daysUntilExam !== null && daysUntilExam > 0 && pending > 0 && (pending / daysUntilExam) > 3;
    
    return { total, completed, percentage, daysUntilExam, showWarning, pending };
  };

  return (
    <div className="grid gap-3">
      {categories.map(category => {
        const data = getCategoryData(category);
        
        return (
          <div 
            key={category} 
            className={`p-3 rounded-lg border transition-all ${
              data.showWarning 
                ? 'border-danger/50 bg-danger/5' 
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground text-sm truncate max-w-32">
                  {category}
                </span>
              </div>
              {data.showWarning && (
                <AlertTriangle className="w-4 h-4 text-danger" />
              )}
              {data.percentage === 100 && (
                <Trophy className="w-4 h-4 text-success" />
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-10 text-right">
                {data.percentage}%
              </span>
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{data.completed}/{data.total} mastered</span>
              {data.daysUntilExam !== null && (
                <span className={data.showWarning ? 'text-danger font-medium' : ''}>
                  {data.daysUntilExam > 0 ? `${data.daysUntilExam}d to exam` : 'Exam today!'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
