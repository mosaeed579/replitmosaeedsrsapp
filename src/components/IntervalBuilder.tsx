import { useState } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface IntervalBuilderProps {
  intervals: number[];
  onChange: (intervals: number[]) => void;
  compact?: boolean;
}

export const IntervalBuilder = ({ intervals, onChange, compact = false }: IntervalBuilderProps) => {
  const [newInterval, setNewInterval] = useState('');

  const handleAddInterval = () => {
    const value = parseInt(newInterval, 10);
    if (value > 0 && !isNaN(value)) {
      onChange([...intervals, value].sort((a, b) => a - b));
      setNewInterval('');
    }
  };

  const handleRemoveInterval = (index: number) => {
    if (intervals.length <= 1) return;
    onChange(intervals.filter((_, i) => i !== index));
  };

  const handleUpdateInterval = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (numValue > 0 && !isNaN(numValue)) {
      const newIntervals = [...intervals];
      newIntervals[index] = numValue;
      onChange(newIntervals.sort((a, b) => a - b));
    }
  };

  // Calculate cumulative days
  const cumulativeDays = intervals.reduce((acc: number[], curr, idx) => {
    const prev = idx > 0 ? acc[idx - 1] : 0;
    acc.push(prev + curr);
    return acc;
  }, []);

  const totalDays = cumulativeDays[cumulativeDays.length - 1] || 0;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact Visual Timeline */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">Start</span>
          {intervals.map((interval, index) => (
            <div key={index} className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <div className="relative group">
                <Input
                  type="number"
                  value={interval}
                  onChange={(e) => handleUpdateInterval(index, e.target.value)}
                  className="w-10 h-6 text-center text-xs px-1"
                  min="1"
                />
                {intervals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInterval(index)}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="px-1.5 py-0.5 rounded bg-success/20 text-success text-[10px] font-medium">Done</span>
        </div>

        {/* Compact Add New */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={newInterval}
            onChange={(e) => setNewInterval(e.target.value)}
            placeholder="Days"
            className="w-16 h-7 text-xs"
            min="1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInterval();
              }
            }}
          />
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            className="h-7 text-xs px-2"
            onClick={handleAddInterval}
            disabled={!newInterval || parseInt(newInterval) <= 0}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        {/* Compact Preview */}
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground">
            {intervals.length} reviews → {totalDays} days to mastery
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual Timeline */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground">
          Start
        </div>
        {intervals.map((interval, index) => (
          <div key={index} className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="relative group">
              <Input
                type="number"
                value={interval}
                onChange={(e) => handleUpdateInterval(index, e.target.value)}
                className="w-16 h-8 text-center text-sm px-2"
                min="1"
              />
              {intervals.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveInterval(index)}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                Day {cumulativeDays[index]}
              </span>
            </div>
          </div>
        ))}
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className="px-2 py-1 rounded bg-success/20 text-success text-xs font-medium">
          Mastered
        </div>
      </div>

      {/* Add New Interval */}
      <div className="flex gap-2 pt-4">
        <Input
          type="number"
          value={newInterval}
          onChange={(e) => setNewInterval(e.target.value)}
          placeholder="Days"
          className="w-20"
          min="1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddInterval();
            }
          }}
        />
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={handleAddInterval}
          disabled={!newInterval || parseInt(newInterval) <= 0}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Stage
        </Button>
      </div>

      {/* Preview Timeline */}
      <div className="p-3 rounded-lg bg-muted/50 space-y-2">
        <p className="text-xs font-medium text-foreground">Review Schedule Preview</p>
        <div className="text-xs text-muted-foreground">
          {intervals.map((interval, idx) => (
            <span key={idx}>
              Review {idx + 1} (Day {cumulativeDays[idx]})
              {idx < intervals.length - 1 && ' → '}
            </span>
          ))}
          <span className="text-success font-medium"> → Mastered!</span>
        </div>
        <p className="text-xs text-primary font-medium">
          Total: {totalDays} days to mastery ({intervals.length} reviews)
        </p>
      </div>
    </div>
  );
};
