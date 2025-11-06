import { useState, useRef, useEffect } from 'react';
import { useBoardStore } from '@/stores/board.store';

/**
 * CreateCardForm Component
 * Form for adding a new card to a list
 */

interface CreateCardFormProps {
  listId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateCardForm({ listId, onSuccess, onCancel }: CreateCardFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createCard = useBoardStore((state) => state.createCard);
  const error = useBoardStore((state) => state.error);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createCard(listId, title.trim(), description.trim() || undefined);
      setTitle('');
      setDescription('');
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create card:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter card title..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isSubmitting}
          rows={3}
          maxLength={200}
        />

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 mt-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
          maxLength={500}
        />

        {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

        <div className="flex items-center gap-2 mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add card'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
