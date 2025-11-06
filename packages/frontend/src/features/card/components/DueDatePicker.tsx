import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * DueDatePicker Component (T162)
 * User Story 2: Enrich Cards with Details
 *
 * Date picker for setting card due dates using shadcn/ui calendar.
 */

interface DueDatePickerProps {
  dueDate?: Date | null;
  onSave: (date: Date | null) => Promise<void>;
  readOnly?: boolean;
}

export function DueDatePicker({ dueDate, onSave, readOnly = false }: DueDatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(dueDate ? new Date(dueDate) : undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (selectedDate: Date | undefined) => {
    if (readOnly) return;

    try {
      setIsSaving(true);
      setDate(selectedDate);
      await onSave(selectedDate || null);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save due date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;

    try {
      setIsSaving(true);
      setDate(undefined);
      await onSave(null);
    } catch (error) {
      console.error('Failed to remove due date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isOverdue = date && new Date(date) < new Date();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Due Date</h3>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={readOnly || isSaving}
              className={cn(
                'justify-start text-left font-normal',
                !date && 'text-muted-foreground',
                isOverdue && 'text-red-600 border-red-300',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              disabled={isSaving}
            />
          </PopoverContent>
        </Popover>

        {date && !readOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isSaving}
            className="h-9 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOverdue && <p className="text-xs text-red-600 font-medium">This card is overdue</p>}
    </div>
  );
}
