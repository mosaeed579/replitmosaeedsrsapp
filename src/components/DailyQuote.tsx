import { useState, useEffect } from 'react';
import { Quote as QuoteIcon } from 'lucide-react';
import { getCurrentQuote } from '@/lib/quoteStorage';
import type { Quote } from '@/lib/quotes';
import { cn } from '@/lib/utils';

export const DailyQuote = () => {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      const currentQuote = await getCurrentQuote();
      setQuote(currentQuote);
    };
    loadQuote();
  }, []);

  if (!quote) return null;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 mb-4">
      <div className={cn(
        'flex gap-3',
        quote.isArabic && 'flex-row-reverse'
      )}>
        <QuoteIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className={cn(
          'space-y-2',
          quote.isArabic && 'text-right'
        )}>
          <p 
            className="text-sm italic text-foreground leading-relaxed"
            dir={quote.isArabic ? 'rtl' : 'ltr'}
          >
            "{quote.text}"
          </p>
          <p 
            className="text-xs text-muted-foreground font-medium"
            dir={quote.isArabic ? 'rtl' : 'ltr'}
          >
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
};
