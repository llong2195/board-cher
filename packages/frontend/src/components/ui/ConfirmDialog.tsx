import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

/**
 * ConfirmDialog Component (T084)
 *
 * Reusable confirmation dialog that replaces native confirm() calls.
 * Uses shadcn/ui Dialog for consistent styling and accessibility.
 *
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   onConfirm={handleDelete}
 *   title="Delete comment?"
 *   description="This action cannot be undone."
 *   variant="destructive"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
