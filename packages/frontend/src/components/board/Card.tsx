import { useDrag } from 'react-dnd';
import type { Card as CardType } from '../../services/api/card.api';

/**
 * Card Component
 * Displays a card with drag-and-drop functionality
 */

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

const ITEM_TYPE = 'CARD';

export function Card({ card, onClick }: CardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: card.id, listId: card.listId, position: card.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={`
        bg-white rounded-lg shadow-sm p-3 mb-2 cursor-pointer
        hover:bg-gray-50 hover:shadow-md transition-all
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-900">{card.title}</h3>

        {card.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>
        )}

        <div className="flex items-center gap-2 mt-1">
          {card.dueDate && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(card.dueDate).toLocaleDateString()}
            </span>
          )}

          {card.isArchived && (
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Archived</span>
          )}
        </div>
      </div>
    </div>
  );
}
