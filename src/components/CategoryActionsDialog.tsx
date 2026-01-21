import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Pencil, Trash2 } from 'lucide-react';


interface CategoryActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  lessonCount: number;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (categoryName: string, deleteAllLessons: boolean) => void;
}

export const CategoryActionsDialog = ({
  open,
  onOpenChange,
  categoryName,
  lessonCount,
  onRename,
  onDelete,
}: CategoryActionsDialogProps) => {
  const [newName, setNewName] = useState(categoryName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'move' | 'delete'>('move');

  const handleRename = () => {
    if (!newName.trim()) {
      return;
    }
    if (newName.trim() === categoryName) {
      onOpenChange(false);
      return;
    }
    onRename(categoryName, newName.trim());
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(categoryName, deleteOption === 'delete');
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Category</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Rename Section */}
            <div className="space-y-3">
              <Label htmlFor="category-name">Category Name</Label>
              <div className="flex gap-2">
                <Input
                  id="category-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name"
                />
                <Button onClick={handleRename} size="icon">
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Delete Section */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Category
              </Button>
              {lessonCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This category has {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{categoryName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {lessonCount > 0 ? (
                <div className="space-y-4">
                  <p>This category has {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}. What would you like to do with them?</p>
                  
                  <RadioGroup value={deleteOption} onValueChange={(v) => setDeleteOption(v as 'move' | 'delete')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="move" id="move" />
                      <Label htmlFor="move" className="font-normal cursor-pointer">
                        Move lessons to "Uncategorized"
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delete" id="delete-all" />
                      <Label htmlFor="delete-all" className="font-normal cursor-pointer text-danger">
                        Delete all lessons in this category
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ) : (
                <p>This action cannot be undone.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-danger hover:bg-danger/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
