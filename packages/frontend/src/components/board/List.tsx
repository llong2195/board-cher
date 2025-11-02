import { useDrop } from 'react-dnd';
import { Card } from './Card';
import { CreateCardForm } from './CreateCardForm';
import { CardSkeleton } from '../skeleton/CardSkeleton';
import { useBoardStore } from '../../stores/board.store';
import type { Card as CardType } from '../../services/api/card.api';
import { useState } from 'react';

/**
 * List Component
 * Displays a list with cards and handles card drops
 */

interface ListProps {
  listId: string;
  name: string;
  position: number;
  onAddCard?: () => void;
}

const CARD_TYPE = 'CARD';

interface DragItem {
  id: string;
  listId: string;
  position: number;
}

export function List({ listId, name, onAddCard }: ListProps) {
  const cards = useBoardStore((state) => state.cards[listId] || []);
  const moveCard = useBoardStore((state) => state.moveCard);
  const isLoading = useBoardStore((state) => state.isLoadingCards[listId]);
  const [showAddCard, setShowAddCard] = useState(false);

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>(() => ({
    accept: CARD_TYPE,
    drop: (item: DragItem) => {
      if (item.listId !== listId) {
        // Moving to a different list
        const newPosition = cards.length;
        moveCard(item.id, listId, newPosition);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleCardClick = (card: CardType) => {
    console.log('Card clicked:', card);
    // TODO: Open card detail modal
  };

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      className={`
        flex flex-col w-72 bg-gray-100 rounded-lg p-3 flex-shrink-0
        ${isOver ? 'bg-gray-200' : ''}
      `}
    >
      {/* List Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">{name}</h2>
        <button className="text-gray-500 hover:text-gray-700" aria-label="List menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto min-h-[100px] max-h-[calc(100vh-300px)]">
        {isLoading ? (
          <div className="space-y-2">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No cards yet</div>
        ) : (
          cards.map((card) => (
            <Card key={card.id} card={card} onClick={() => handleCardClick(card)} />
          ))
        )}
      </div>

      {/* Add Card Button */}
      {showAddCard ? (
        <CreateCardForm
          listId={listId}
          onSuccess={() => setShowAddCard(false)}
          onCancel={() => setShowAddCard(false)}
        />
      ) : (
        <button
          onClick={() => {
            setShowAddCard(true);
            onAddCard?.();
          }}
          className="mt-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
