import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Lesson, LessonAttachment } from '@/types/lesson';
import { FileAttachment } from './FileAttachment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AttachmentDialogProps {
  lesson: Lesson;
  onEdit: (id: string, updates: Partial<Lesson>) => void;
}

export const AttachmentDialog = ({ lesson, onEdit }: AttachmentDialogProps) => {
  const [open, setOpen] = useState(false);
  // Initialize as empty - only populate when dialog opens (lazy loading)
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Load attachments only when dialog opens
      setAttachments(lesson.attachments || []);
    } else {
      // Clear attachments when dialog closes to free memory
      setAttachments([]);
    }
  };

  const handleAttachmentsChange = (newAttachments: LessonAttachment[]) => {
    setAttachments(newAttachments);
    onEdit(lesson.id, { attachments: newAttachments });
  };

  const attachmentCount = lesson.attachments?.length || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary relative"
        >
          <Paperclip className="w-4 h-4" />
          {attachmentCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {attachmentCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Attachments
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Attach files and record audio for: <strong>{lesson.title}</strong>
          </p>
          
          <FileAttachment
            attachments={attachments}
            onChange={handleAttachmentsChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
