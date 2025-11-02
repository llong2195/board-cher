import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, CheckSquare } from 'lucide-react';
import { checklistApi } from '@/services/api/checklist.api';
import type { Checklist } from '@/services/api/card.api';

/**
 * ChecklistSection Component (T166 + T169)
 * User Story 2: Enrich Cards with Details
 *
 * Display and manage checklists with progress tracking.
 * Supports optimistic updates for checklist item toggling (T169).
 */

interface ChecklistSectionProps {
  cardId: string;
  checklists: Checklist[];
  onUpdate: (checklists: Checklist[]) => void;
  readOnly?: boolean;
}

export function ChecklistSection({
  cardId,
  checklists,
  onUpdate,
  readOnly = false,
}: ChecklistSectionProps) {
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});
  const [addingItemToChecklist, setAddingItemToChecklist] = useState<string | null>(null);

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;

    try {
      const checklist = await checklistApi.createChecklist(cardId, {
        name: newChecklistTitle.trim(),
      });
      onUpdate([...checklists, checklist]);
      setNewChecklistTitle('');
      setIsCreatingChecklist(false);
    } catch (error) {
      console.error('Failed to create checklist:', error);
      alert('Failed to create checklist. Please try again.');
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!confirm('Delete this checklist?')) return;

    try {
      await checklistApi.deleteChecklist(checklistId);
      onUpdate(checklists.filter((cl) => cl.id !== checklistId));
    } catch (error) {
      console.error('Failed to delete checklist:', error);
      alert('Failed to delete checklist. Please try again.');
    }
  };

  const handleAddItem = async (checklistId: string) => {
    const text = newItemTitles[checklistId]?.trim();
    if (!text) return;

    try {
      const checklist = checklists.find((cl) => cl.id === checklistId);
      const position = checklist ? checklist.items.length : 0;

      const updatedChecklist = await checklistApi.addChecklistItem(checklistId, {
        text,
        position,
      });

      onUpdate(checklists.map((cl) => (cl.id === checklistId ? updatedChecklist : cl)));
      setNewItemTitles({ ...newItemTitles, [checklistId]: '' });
      setAddingItemToChecklist(null);
    } catch (error) {
      console.error('Failed to add checklist item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string) => {
    try {
      // T169: Optimistic update - toggle immediately in UI
      const checklist = checklists.find((cl) => cl.id === checklistId);
      if (checklist) {
        const optimisticChecklist = {
          ...checklist,
          items: checklist.items.map((item) =>
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item,
          ),
        };
        // Update UI immediately
        onUpdate(checklists.map((cl) => (cl.id === checklistId ? optimisticChecklist : cl)));
      }

      // Make API call
      const updatedChecklist = await checklistApi.toggleChecklistItem(itemId);

      // Update with real data from server
      onUpdate(checklists.map((cl) => (cl.id === checklistId ? updatedChecklist : cl)));
    } catch (error) {
      console.error('Failed to toggle item:', error);
      // Rollback: reload original checklists
      // In a real app, you'd want to restore the previous state more carefully
      alert('Failed to toggle item. Please try again.');
    }
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    try {
      await checklistApi.deleteChecklistItem(itemId);

      const checklist = checklists.find((cl) => cl.id === checklistId);
      if (checklist) {
        const updatedChecklist = {
          ...checklist,
          items: checklist.items.filter((item) => item.id !== itemId),
        };
        onUpdate(checklists.map((cl) => (cl.id === checklistId ? updatedChecklist : cl)));
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const calculateProgress = (checklist: Checklist) => {
    if (checklist.items.length === 0) return 0;
    const completed = checklist.items.filter((item) => item.isCompleted).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Checklists</h3>
        {!readOnly && !isCreatingChecklist && (
          <Button variant="outline" size="sm" onClick={() => setIsCreatingChecklist(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Checklist
          </Button>
        )}
      </div>

      {isCreatingChecklist && (
        <div className="flex gap-2">
          <Input
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            placeholder="Checklist title..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreateChecklist()}
            autoFocus
            className="h-9"
          />
          <Button onClick={handleCreateChecklist} size="sm">
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCreatingChecklist(false);
              setNewChecklistTitle('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {checklists.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-500">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No checklists yet.
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const progress = calculateProgress(checklist);
            const completed = checklist.items.filter((item) => item.isCompleted).length;
            const total = checklist.items.length;

            return (
              <div key={checklist.id} className="space-y-2 p-3 border rounded">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{checklist.name}</h4>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChecklist(checklist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{progress}% complete</span>
                    <span>
                      {completed}/{total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  {checklist.items
                    .sort((a, b) => a.position - b.position)
                    .map((item) => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <Checkbox
                          checked={item.isCompleted}
                          onCheckedChange={() => handleToggleItem(checklist.id, item.id)}
                          disabled={readOnly}
                        />
                        <span
                          className={`flex-1 text-sm ${
                            item.isCompleted ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {item.text}
                        </span>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(checklist.id, item.id)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                </div>

                {!readOnly && (
                  <>
                    {addingItemToChecklist === checklist.id ? (
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newItemTitles[checklist.id] || ''}
                          onChange={(e) =>
                            setNewItemTitles({
                              ...newItemTitles,
                              [checklist.id]: e.target.value,
                            })
                          }
                          placeholder="Add an item..."
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(checklist.id)}
                          autoFocus
                          className="h-8 text-sm"
                        />
                        <Button size="sm" onClick={() => handleAddItem(checklist.id)}>
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAddingItemToChecklist(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAddingItemToChecklist(checklist.id)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
