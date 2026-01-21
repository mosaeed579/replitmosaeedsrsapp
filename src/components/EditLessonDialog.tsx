import { useState } from 'react';
import { format } from 'date-fns';
import { Lesson, Difficulty, DEFAULT_INTERVALS, LessonAttachment } from '@/types/lesson';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pencil, ChevronDown, ChevronUp, Calendar as CalendarIcon, Paperclip, RotateCcw } from 'lucide-react';
import { IntervalPresets } from './IntervalPresets';
import { IntervalBuilder } from './IntervalBuilder';
import { FileAttachment } from './FileAttachment';
import { cn } from '@/lib/utils';

interface EditLessonDialogProps {
  lesson: Lesson;
  categories: string[];
  onEdit: (id: string, updates: Partial<Lesson>) => void;
  onResetProgress?: (id: string) => void;
  showAttachments?: boolean;
  globalIntervals?: number[];
}

export const EditLessonDialog = ({ lesson, categories, onEdit, onResetProgress, showAttachments = false, globalIntervals = [1, 1, 4, 7, 14, 30] }: EditLessonDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [category, setCategory] = useState(lesson.category);
  const [subject, setSubject] = useState(lesson.subject);
  const [difficulty, setDifficulty] = useState<Difficulty>(lesson.difficulty);
  
  // Start Date state
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(lesson.nextReviewDate));
  const [startDateOption, setStartDateOption] = useState<'today' | 'tomorrow' | 'custom'>('custom');
  
  // Custom intervals state
  const [useCustomIntervals, setUseCustomIntervals] = useState(!!lesson.customIntervals);
  const [lessonIntervals, setLessonIntervals] = useState<number[]>(
    lesson.customIntervals || DEFAULT_INTERVALS
  );
  const [intervalsExpanded, setIntervalsExpanded] = useState(false);
  
  // Attachments state
  const [attachments, setAttachments] = useState<LessonAttachment[]>(
    lesson.attachments || []
  );
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false);

  const handleStartDateOptionChange = (option: 'today' | 'tomorrow' | 'custom') => {
    setStartDateOption(option);
    if (option === 'today') {
      setStartDate(new Date());
    } else if (option === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || !subject.trim()) return;

    onEdit(lesson.id, {
      title: title.trim(),
      category: category.trim(),
      subject: subject.trim(),
      difficulty,
      nextReviewDate: startDate ? startDate.toISOString() : lesson.nextReviewDate,
      customIntervals: useCustomIntervals ? lessonIntervals : undefined,
      attachments: showAttachments ? (attachments.length > 0 ? attachments : undefined) : lesson.attachments,
    });
    setOpen(false);
  };

  const handleResetProgress = () => {
    if (onResetProgress) {
      onResetProgress(lesson.id);
      setOpen(false);
    }
  };

  // Reset form state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(lesson.title);
      setCategory(lesson.category);
      setSubject(lesson.subject);
      setDifficulty(lesson.difficulty);
      setStartDate(new Date(lesson.nextReviewDate));
      setStartDateOption('custom');
      setUseCustomIntervals(!!lesson.customIntervals);
      setLessonIntervals(lesson.customIntervals || DEFAULT_INTERVALS);
      setAttachments(lesson.attachments || []);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Lesson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-subject">Subject</Label>
            <Input
              id="edit-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Section */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <p className="text-xs text-muted-foreground mb-2">
              When should this lesson appear for review?
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleStartDateOptionChange('today')}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg border transition-all",
                  startDateOption === 'today'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleStartDateOptionChange('tomorrow')}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg border transition-all",
                  startDateOption === 'tomorrow'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                )}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleStartDateOptionChange('custom')}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg border transition-all",
                  startDateOption === 'custom'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                )}
              >
                Custom
              </button>
            </div>
            
            {startDateOption === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
            
            {startDate && (
              <p className="text-xs text-primary">
                Review date: {format(startDate, "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </div>

          {/* Review Schedule Section */}
          <Collapsible open={intervalsExpanded} onOpenChange={setIntervalsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Review Schedule
                  <span className="text-xs text-muted-foreground">
                    ({useCustomIntervals ? 'Custom' : 'Default'})
                  </span>
                </span>
                {intervalsExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-intervals-toggle" className="text-sm">
                  Use custom schedule
                </Label>
                <Switch
                  id="custom-intervals-toggle"
                  checked={useCustomIntervals}
                  onCheckedChange={setUseCustomIntervals}
                />
              </div>

              {useCustomIntervals && (
                <div className="space-y-4">
                  <IntervalPresets
                    currentIntervals={lessonIntervals}
                    onSelectPreset={setLessonIntervals}
                    compact
                  />
                  <IntervalBuilder
                    intervals={lessonIntervals}
                    onChange={setLessonIntervals}
                    compact
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Attachments Section - Only in Library */}
          {showAttachments && (
            <Collapsible open={attachmentsExpanded} onOpenChange={setAttachmentsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                    {attachments.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {attachments.length}
                      </span>
                    )}
                  </span>
                  {attachmentsExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <FileAttachment
                  attachments={attachments}
                  onChange={setAttachments}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex gap-2">
            {onResetProgress && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleResetProgress}
                className="flex items-center gap-2 text-warning hover:bg-warning/10 hover:text-warning"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Progress
              </Button>
            )}
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};