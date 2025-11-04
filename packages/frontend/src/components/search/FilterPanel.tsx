import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';

export interface FilterOption {
  id: string;
  name: string;
  color?: string;
}

export interface FilterPanelProps {
  labels: FilterOption[];
  assignees: FilterOption[];
  selectedLabelIds: string[];
  selectedAssigneeIds: string[];
  dueDateFilter: 'all' | 'today' | 'overdue' | 'none';
  onLabelToggle: (labelId: string) => void;
  onAssigneeToggle: (assigneeId: string) => void;
  onDueDateFilterChange: (filter: 'all' | 'today' | 'overdue' | 'none') => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  labels,
  assignees,
  selectedLabelIds,
  selectedAssigneeIds,
  dueDateFilter,
  onLabelToggle,
  onAssigneeToggle,
  onDueDateFilterChange,
  onClearFilters,
  activeFilterCount,
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Cards</SheetTitle>
          <SheetDescription>Filter cards by labels, assignees, and due dates</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-6 py-6">
            {/* Labels Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Labels</h3>
                {selectedLabelIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedLabelIds.forEach((id) => onLabelToggle(id))}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {labels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No labels available</p>
              ) : (
                <div className="space-y-2">
                  {labels.map((label) => (
                    <div key={label.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`label-${label.id}`}
                        checked={selectedLabelIds.includes(label.id)}
                        onCheckedChange={() => onLabelToggle(label.id)}
                      />
                      <Label
                        htmlFor={`label-${label.id}`}
                        className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-normal"
                      >
                        {label.color && (
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                        )}
                        {label.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignees Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Assignees</h3>
                {selectedAssigneeIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedAssigneeIds.forEach((id) => onAssigneeToggle(id))}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {assignees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignees available</p>
              ) : (
                <div className="space-y-2">
                  {assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assignee-${assignee.id}`}
                        checked={selectedAssigneeIds.includes(assignee.id)}
                        onCheckedChange={() => onAssigneeToggle(assignee.id)}
                      />
                      <Label
                        htmlFor={`assignee-${assignee.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {assignee.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Due Date Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Due Date</h3>
              <RadioGroup
                value={dueDateFilter}
                onValueChange={(value) =>
                  onDueDateFilterChange(value as 'all' | 'today' | 'overdue' | 'none')
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="due-all" />
                  <Label htmlFor="due-all" className="font-normal">
                    All cards
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="today" id="due-today" />
                  <Label htmlFor="due-today" className="font-normal">
                    Due today
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overdue" id="due-overdue" />
                  <Label htmlFor="due-overdue" className="font-normal">
                    Overdue
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="due-none" />
                  <Label htmlFor="due-none" className="font-normal">
                    No due date
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>

        {/* Footer with Clear All button */}
        {activeFilterCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
            <Button variant="outline" className="w-full gap-2" onClick={onClearFilters}>
              <X className="h-4 w-4" />
              Clear all filters
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
