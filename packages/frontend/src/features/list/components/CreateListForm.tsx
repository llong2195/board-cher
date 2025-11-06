import { useState, useRef, useEffect } from 'react';
import { useBoardStore } from '@/stores/board.store';

/**
 * CreateListForm Component
 * Form for adding a new list to the board
 */

interface CreateListFormProps {
  boardId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateListForm({ boardId, onSuccess, onCancel }: CreateListFormProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createList = useBoardStore((state) => state.createList);
  const error = useBoardStore((state) => state.error);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createList(boardId, name.trim());
      setName('');
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create list:', err);
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
    <div className="bg-gray-100 rounded-lg p-3">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter list name..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
          maxLength={100}
        />

        {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

        <div className="flex items-center gap-2 mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add list'}
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
