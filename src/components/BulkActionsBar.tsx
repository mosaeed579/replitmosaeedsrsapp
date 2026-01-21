import { Check, Trash2, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Difficulty } from '@/types/lesson';

interface BulkActionsBarProps {
  selectedCount: number;
  onMarkDone: () => void;
  onDelete: () => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onMarkDone,
  onDelete,
  onChangeDifficulty,
  onClearSelection,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-2 bg-card border border-border shadow-lg rounded-full px-4 py-2">
        <span className="text-sm font-medium text-foreground mr-2">
          {selectedCount} selected
        </span>
        
        <Button
          size="sm"
          variant="ghost"
          className="text-success hover:bg-success/10"
          onClick={onMarkDone}
        >
          <Check className="w-4 h-4 mr-1" />
          Done
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              Difficulty
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onChangeDifficulty('Easy')}>
              <span className="w-2 h-2 rounded-full bg-success mr-2" />
              Easy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeDifficulty('Medium')}>
              <span className="w-2 h-2 rounded-full bg-warning mr-2" />
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeDifficulty('Hard')}>
              <span className="w-2 h-2 rounded-full bg-danger mr-2" />
              Hard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="ghost"
          className="text-danger hover:bg-danger/10"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 ml-1"
          onClick={onClearSelection}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
