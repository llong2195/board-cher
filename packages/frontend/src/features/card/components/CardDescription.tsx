import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Save, X } from 'lucide-react';

/**
 * CardDescription Component (T161)
 * User Story 2: Enrich Cards with Details
 *
 * Editable card description with Markdown preview support.
 * TODO: Add actual Markdown rendering library for preview mode.
 */

interface CardDescriptionProps {
  description?: string;
  onSave: (description: string) => Promise<void>;
  readOnly?: boolean;
}

export function CardDescription({
  description = '',
  onSave,
  readOnly = false,
}: CardDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(value);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save description:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(description);
    setIsEditing(false);
  };

  if (!isEditing && !description && !readOnly) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Description</h3>
        <Button
          variant="outline"
          className="w-full justify-start text-left h-20"
          onClick={() => setIsEditing(true)}
        >
          Add a more detailed description...
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Description</h3>
        {!isEditing && !readOnly && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a more detailed description..."
            className="min-h-[120px] resize-y"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving} size="sm">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          {/* TODO: Add Markdown rendering library (e.g., react-markdown) */}
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border">
            {description || 'No description provided.'}
          </div>
        </div>
      )}
    </div>
  );
}
