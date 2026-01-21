import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Difficulty, DEFAULT_INTERVALS } from '@/types/lesson';
import { cn } from '@/lib/utils';
import { IntervalPresets } from './IntervalPresets';
import { IntervalBuilder } from './IntervalBuilder';

interface AddLessonDialogProps {
  categories: string[];
  onAdd: (lesson: {
    title: string;
    category: string;
    subject: string;
    difficulty: Difficulty;
    startDate?: Date;
    customIntervals?: number[];
  }) => void;
}

export const AddLessonDialog = ({ categories, onAdd }: AddLessonDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startDateOption, setStartDateOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  
  // Custom intervals state
  const [useCustomIntervals, setUseCustomIntervals] = useState(false);
  const [lessonIntervals, setLessonIntervals] = useState<number[]>(DEFAULT_INTERVALS);
  const [intervalsExpanded, setIntervalsExpanded] = useState(false);

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
    
    const finalCategory = category === 'new' ? newCategory : category;
    
    if (!title || !finalCategory || !subject) return;

    onAdd({
      title,
      category: finalCategory,
      subject,
      difficulty,
      startDate,
      customIntervals: useCustomIntervals ? lessonIntervals : undefined,
    });

    // Reset form
    setTitle('');
    setCategory('');
    setNewCategory('');
    setSubject('');
    setDifficulty('Medium');
    setStartDate(new Date());
    setStartDateOption('today');
    setUseCustomIntervals(false);
    setLessonIntervals(DEFAULT_INTERVALS);
    setIntervalsExpanded(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="w-5 h-5 mr-2" />
          Add Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Add New Lesson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              placeholder="e.g., Cardiac Anatomy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
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
                <SelectItem value="new">+ New Category</SelectItem>
              </SelectContent>
            </Select>
            {category === 'new' && (
              <Input
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Anatomy"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
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
              When should this lesson first appear for review?
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
                First review: {format(startDate, "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </div>

          {/* Review Schedule Section */}
          <Collapsible open={intervalsExpanded} onOpenChange={setIntervalsExpanded}>
            <div className="space-y-2 border rounded-lg p-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <Label className="cursor-pointer">Review Schedule</Label>
                    <p className="text-xs text-muted-foreground">
                      {useCustomIntervals 
                        ? `Custom: ${lessonIntervals.join(', ')} days` 
                        : 'Using default schedule from settings'}
                    </p>
                  </div>
                  {intervalsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-intervals" className="text-sm">
                    Use custom schedule
                  </Label>
                  <Switch
                    id="custom-intervals"
                    checked={useCustomIntervals}
                    onCheckedChange={setUseCustomIntervals}
                  />
                </div>

                {useCustomIntervals && (
                  <div className="space-y-4">
                    {/* Preset Templates */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Quick Presets</p>
                      <IntervalPresets
                        currentIntervals={lessonIntervals}
                        onSelectPreset={setLessonIntervals}
                        compact
                      />
                    </div>

                    {/* Custom Builder */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Custom Intervals</p>
                      <IntervalBuilder
                        intervals={lessonIntervals}
                        onChange={setLessonIntervals}
                        compact
                      />
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gradient-primary text-primary-foreground">
              Add Lesson
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
