import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface FilterChip {
  id: string;
  label: string;
  type: 'label' | 'assignee' | 'dueDate';
  color?: string;
}

export interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chipId: string, type: FilterChip['type']) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ chips, onRemove, onClearAll }) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="region" aria-label="Active filters">
      <span className="text-sm font-medium text-muted-foreground">Filters:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className="gap-1 pl-3 pr-1"
          style={
            chip.color
              ? {
                  borderLeft: `3px solid ${chip.color}`,
                }
              : undefined
          }
        >
          <span className="text-xs">{chip.label}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(chip.id, chip.type)}
            aria-label={`Remove ${chip.label} filter`}
            className="h-4 w-4 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
};
