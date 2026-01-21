import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { LessonCard } from '@/components/LessonCard';
import { AddLessonDialog } from '@/components/AddLessonDialog';
import { EmptyState } from '@/components/EmptyState';
import { ExamCountdown } from '@/components/ExamCountdown';
import { CategoryActionsDialog } from '@/components/CategoryActionsDialog';
import { FolderOpen, ChevronRight, ChevronDown, BookOpen, Calendar, X, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const CategoriesPage = () => {
  const { 
    data, 
    addLesson, 
    markLessonDone, 
    deleteLesson,
    updateCategoryExamDate,
    getCategoryStats,
    renameCategory,
    deleteCategory,
  } = useLocalStorage();

  const { isTabletMode, containerClass, gridClass } = useDisplayMode(data.settings.displayMode);
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingExamDate, setEditingExamDate] = useState<string | null>(null);
  const [examDateInput, setExamDateInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleSetExamDate = (category: string) => {
    if (examDateInput) {
      updateCategoryExamDate(category, examDateInput);
    }
    setEditingExamDate(null);
    setExamDateInput('');
  };

  const handleClearExamDate = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateCategoryExamDate(category, undefined);
  };

  // Group lessons by category
  const lessonsByCategory = data.lessons.reduce((acc, lesson) => {
    if (!acc[lesson.category]) {
      acc[lesson.category] = [];
    }
    acc[lesson.category].push(lesson);
    return acc;
  }, {} as Record<string, typeof data.lessons>);

  const categories = Object.keys(lessonsByCategory);

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-8 pb-4">
        <div className={cn(containerClass, 'mx-auto')}>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground text-xs font-medium">
              Exams & Categories
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Categories
          </h1>
          <p className="text-muted-foreground text-sm">
            {data.lessons.length} lesson{data.lessons.length !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className={cn(containerClass, 'mx-auto px-4 py-6')}>
        {/* Add Lesson Button */}
        <div className="flex justify-end mb-6">
          <AddLessonDialog categories={data.categories} onAdd={addLesson} />
        </div>

        {categories.length === 0 ? (
          <EmptyState type="no-lessons" />
        ) : (
          <div className="space-y-3">
            {categories.map((category) => {
              const lessons = lessonsByCategory[category];
              const isExpanded = expandedCategories.has(category);
              const { completed, pending, daysUntilExam, showWarning } = getCategoryStats(category);

              return (
                <div key={category} className="animate-fade-in">
                  <div className="flex items-stretch gap-2">
                    <button
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'flex-1 flex items-center justify-between p-4 bg-card rounded-lg border transition-all duration-200',
                        showWarning ? 'border-warning/50 bg-warning/5' : 'border-border hover:border-primary/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          showWarning ? 'bg-warning/20' : 'bg-primary/10'
                        )}>
                          <BookOpen className={cn('w-5 h-5', showWarning ? 'text-warning' : 'text-primary')} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-heading font-semibold text-foreground">
                            {category}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} • {completed} done • {pending} pending
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {daysUntilExam !== null && (
                          <ExamCountdown 
                            daysUntilExam={daysUntilExam} 
                            showWarning={showWarning}
                            compact 
                          />
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Category Edit Button */}
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="flex items-center justify-center w-12 rounded-lg border border-border bg-card hover:border-primary/30 transition-all"
                    >
                      <Settings2 className="w-5 h-5 text-muted-foreground" />
                    </button>
                    
                    {/* Exam Date Button */}
                    <Dialog open={editingExamDate === category} onOpenChange={(open) => {
                      if (!open) {
                        setEditingExamDate(null);
                        setExamDateInput('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => {
                            const existingDate = data.categoryData.find(c => c.name === category)?.examDate;
                            setExamDateInput(existingDate || '');
                            setEditingExamDate(category);
                          }}
                          className={cn(
                            'flex items-center justify-center w-12 rounded-lg border transition-all',
                            daysUntilExam !== null 
                              ? 'bg-primary/10 border-primary/30 hover:bg-primary/20' 
                              : 'bg-card border-border hover:border-primary/30'
                          )}
                        >
                          <Calendar className={cn(
                            'w-5 h-5',
                            daysUntilExam !== null ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="font-heading">Set Exam Date</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">
                            Set the exam date for <strong>{category}</strong>
                          </p>
                          <Input
                            type="date"
                            value={examDateInput}
                            onChange={(e) => setExamDateInput(e.target.value)}
                          />
                          <div className="flex gap-2">
                            {daysUntilExam !== null && (
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={(e) => {
                                  handleClearExamDate(category, e);
                                  setEditingExamDate(null);
                                }}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear
                              </Button>
                            )}
                            <Button 
                              className="flex-1"
                              onClick={() => handleSetExamDate(category)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300',
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className={cn('pt-3 grid', gridClass)}>
                      {lessons.map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          intervals={data.settings.intervals}
                          onMarkDone={markLessonDone}
                          onDelete={deleteLesson}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Category Actions Dialog */}
        {editingCategory && (
          <CategoryActionsDialog
            open={!!editingCategory}
            onOpenChange={(open) => !open && setEditingCategory(null)}
            categoryName={editingCategory}
            lessonCount={lessonsByCategory[editingCategory]?.length || 0}
            onRename={renameCategory}
            onDelete={deleteCategory}
          />
        )}
      </main>
    </div>
  );
};
