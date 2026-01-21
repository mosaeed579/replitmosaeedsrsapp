import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { LessonCard } from '@/components/LessonCard';
import { AddLessonDialog } from '@/components/AddLessonDialog';
import { SearchFilters, StatusFilter } from '@/components/SearchFilters';
import { EmptyState } from '@/components/EmptyState';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { Library, BookOpen } from 'lucide-react';
import { Difficulty } from '@/types/lesson';
import { Checkbox } from '@/components/ui/checkbox';

import { cn } from '@/lib/utils';

export const LibraryPage = () => {
  const {
    data,
    addLesson,
    markLessonDone,
    reviewLesson,
    deleteLesson,
    editLesson,
    resetLessonProgress,
    duplicateLesson,
  } = useLocalStorage();

  const { isTabletMode, containerClass, gridClass } = useDisplayMode(data.settings.displayMode);
  const useFSRS = data.settings.useFSRS;
  const desiredRetention = data.settings.desiredRetention || 0.9;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());

  const hasActiveFilters = 
    searchQuery !== '' || 
    categoryFilter !== 'all' || 
    difficultyFilter !== 'all' || 
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setStatusFilter('all');
  };

  const toggleSelection = (id: string) => {
    setSelectedLessons(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedLessons(new Set());

  const handleBulkMarkDone = () => {
    selectedLessons.forEach(id => markLessonDone(id));
    clearSelection();
  };

  const handleBulkDelete = () => {
    selectedLessons.forEach(id => deleteLesson(id));
    clearSelection();
  };

  const handleBulkChangeDifficulty = (difficulty: Difficulty) => {
    selectedLessons.forEach(id => editLesson(id, { difficulty }));
    clearSelection();
  };

  const filteredLessons = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.lessons.filter((lesson) => {
      // Search filter
      if (searchQuery && !lesson.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && lesson.category !== categoryFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && lesson.difficulty !== difficultyFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const reviewDate = new Date(lesson.nextReviewDate);
        reviewDate.setHours(0, 0, 0, 0);

        switch (statusFilter) {
          case 'completed':
            if (!lesson.completed) return false;
            break;
          case 'due-today':
            if (lesson.completed || reviewDate.getTime() !== today.getTime()) return false;
            break;
          case 'missed':
            if (lesson.completed || reviewDate >= today) return false;
            break;
          case 'upcoming':
            if (lesson.completed || reviewDate <= today) return false;
            break;
        }
      }

      return true;
    });
  }, [data.lessons, searchQuery, categoryFilter, difficultyFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-8 pb-4">
        <div className={cn(containerClass, 'mx-auto')}>
          <div className="flex items-center gap-2 mb-1">
            <Library className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground text-xs font-medium">
              All Lessons
            </span>
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Library
          </h1>
          <p className="text-muted-foreground text-sm">
            {data.lessons.length} total lessons • {filteredLessons.length} showing
          </p>
        </div>
      </header>

      {/* Content */}
      <main className={cn(containerClass, 'mx-auto px-4 py-4')}>
        {/* Search & Filters + Add Button */}
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              difficultyFilter={difficultyFilter}
              onDifficultyChange={setDifficultyFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              categories={data.categories}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
          <AddLessonDialog categories={data.categories} onAdd={addLesson} />
        </div>

        {/* Lessons List */}
        {data.lessons.length === 0 ? (
          <EmptyState type="no-lessons" />
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
              No lessons found
            </h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className={cn('grid', gridClass)}>
            {filteredLessons.map((lesson) => {
              const reviewDate = new Date(lesson.nextReviewDate);
              reviewDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isMissed = !lesson.completed && reviewDate < today;
              const isSelected = selectedLessons.has(lesson.id);

              return (
                <div key={lesson.id} className="flex items-start gap-3">
                  <div className="pt-5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(lesson.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <LessonCard
                      lesson={lesson}
                      intervals={data.settings.intervals}
                      onMarkDone={markLessonDone}
                      onReview={reviewLesson}
                      onDelete={deleteLesson}
                      onEdit={editLesson}
                      onDuplicate={duplicateLesson}
                      onResetProgress={resetLessonProgress}
                      categories={data.categories}
                      isMissed={isMissed}
                      showEditButton
                      showAttachments
                      showDuplicate
                      useFSRS={useFSRS}
                      desiredRetention={desiredRetention}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedLessons.size}
          onMarkDone={handleBulkMarkDone}
          onDelete={handleBulkDelete}
          onChangeDifficulty={handleBulkChangeDifficulty}
          onClearSelection={clearSelection}
        />
      </main>
    </div>
  );
};
