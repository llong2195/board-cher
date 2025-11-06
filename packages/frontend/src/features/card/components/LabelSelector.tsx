import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as LabelUI } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Tag } from 'lucide-react';
import type { Label } from '@/services/api/card.api';
import { labelApi } from '@/services/api/label.api';

/**
 * LabelSelector Component (T165)
 * User Story 2: Enrich Cards with Details
 *
 * Label selector with color picker and label management.
 */

interface LabelSelectorProps {
  boardId: string;
  cardId: string;
  selectedLabels: Label[];
  onApply: (label: Label) => void;
  onRemove: (labelId: string) => void;
  readOnly?: boolean;
}

const LABEL_COLORS = [
  { name: 'red', hex: '#ef4444' },
  { name: 'orange', hex: '#f97316' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'green', hex: '#22c55e' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'gray', hex: '#6b7280' },
  { name: 'brown', hex: '#92400e' },
  { name: 'black', hex: '#1f2937' },
];

export function LabelSelector({
  boardId,
  cardId,
  selectedLabels,
  onApply,
  onRemove,
  readOnly = false,
}: LabelSelectorProps) {
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].name);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBoardLabels = async () => {
      try {
        setLoading(true);
        const labels = await labelApi.getBoardLabels(boardId);
        setBoardLabels(labels);
      } catch (error) {
        console.error('Failed to load labels:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadBoardLabels();
    }
  }, [isOpen, boardId]);

  const handleCreateLabel = async () => {
    try {
      const label = await labelApi.createLabel(boardId, {
        color: selectedColor,
        name: newLabelName.trim() || undefined,
      });
      setBoardLabels([...boardLabels, label]);
      setNewLabelName('');
      setIsCreating(false);
      await handleApplyLabel(label);
    } catch (error) {
      console.error('Failed to create label:', error);
      alert('Failed to create label. Please try again.');
    }
  };

  const handleApplyLabel = async (label: Label) => {
    try {
      await labelApi.applyLabelToCard(cardId, label.id);
      onApply(label);
    } catch (error) {
      console.error('Failed to apply label:', error);
      alert('Failed to apply label. Please try again.');
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await labelApi.removeLabelFromCard(cardId, labelId);
      onRemove(labelId);
    } catch (error) {
      console.error('Failed to remove label:', error);
      alert('Failed to remove label. Please try again.');
    }
  };

  const isLabelSelected = (labelId: string) => {
    return selectedLabels.some((l) => l.id === labelId);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Labels</h3>

      <div className="flex flex-wrap gap-2">
        {selectedLabels.map((label) => (
          <div
            key={label.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: label.hexColor }}
          >
            {label.displayText}
            {!readOnly && (
              <button
                onClick={() => handleRemoveLabel(label.id)}
                className="hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7">
                <Plus className="h-4 w-4 mr-1" />
                Add Label
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Labels</h4>
                  <Button variant="ghost" size="sm" onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {isCreating && (
                  <div className="space-y-2 p-2 border rounded">
                    <LabelUI htmlFor="label-name" className="text-xs">
                      Label Name (optional)
                    </LabelUI>
                    <Input
                      id="label-name"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Enter label name..."
                      className="h-8"
                    />

                    <LabelUI className="text-xs">Color</LabelUI>
                    <div className="grid grid-cols-5 gap-2">
                      {LABEL_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={`h-8 rounded ${
                            selectedColor === color.name ? 'ring-2 ring-offset-2 ring-black' : ''
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>

                    <Button onClick={handleCreateLabel} size="sm" className="w-full">
                      Create Label
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-4 text-sm text-gray-500">Loading labels...</div>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {boardLabels.length === 0 ? (
                      <div className="text-center py-4 text-sm text-gray-500">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No labels yet. Create one above.
                      </div>
                    ) : (
                      boardLabels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => handleApplyLabel(label)}
                          disabled={isLabelSelected(label.id)}
                          className="w-full text-left px-3 py-2 rounded text-xs font-medium text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: label.hexColor }}
                        >
                          {label.displayText}
                          {isLabelSelected(label.id) && ' ✓'}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {selectedLabels.length === 0 && readOnly && (
        <p className="text-sm text-gray-500">No labels</p>
      )}
    </div>
  );
}
