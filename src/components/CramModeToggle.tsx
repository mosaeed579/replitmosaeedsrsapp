import { Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface CramModeToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export const CramModeToggle = ({ isActive, onToggle }: CramModeToggleProps) => {
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'flex items-center gap-3 w-full p-4 rounded-xl border transition-all duration-300 cursor-pointer',
        isActive 
          ? 'bg-warning/10 border-warning text-warning shadow-lg shadow-warning/20' 
          : 'bg-card border-border hover:border-primary/30'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
        isActive ? 'bg-warning/20' : 'bg-muted'
      )}>
        <Zap className={cn('w-5 h-5', isActive ? 'text-warning fill-warning' : 'text-muted-foreground')} />
      </div>
      
      <div className="flex-1 text-left">
        <h3 className={cn('font-heading font-semibold', isActive ? 'text-warning' : 'text-foreground')}>
          Cram Mode
        </h3>
        <p className="text-xs text-muted-foreground">
          50% faster intervals for intensive review
        </p>
      </div>
      
      <div onClick={(e) => e.stopPropagation()}>
        <Switch 
          checked={isActive} 
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-warning"
        />
      </div>
    </div>
  );
};
