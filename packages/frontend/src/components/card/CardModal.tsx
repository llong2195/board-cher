import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Card } from '@/services/api/card.api';
import { cardApi } from '@/services/api/card.api';

/**
 * CardModal Component (T160)
 * User Story 2: Enrich Cards with Details
 *
 * Main modal dialog for viewing and editing card details.
 * Uses shadcn/ui Dialog component.
 */

interface CardModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (card: Card) => void;
}

export function CardModal({ cardId, isOpen, onClose, onUpdate }: CardModalProps) {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCardDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await cardApi.getDetails(cardId);
        setCard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load card details');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && cardId) {
      loadCardDetails();
    }
  }, [isOpen, cardId]);

  const handleUpdate = (updatedCard: Card) => {
    setCard(updatedCard);
    onUpdate?.(updatedCard);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-semibold pr-8">
              {loading ? 'Loading...' : card?.title || 'Card Details'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}

        {!loading && card && (
          <div className="space-y-6">
            {/* TODO: T167 - Integrate all card detail sections here */}
            <div className="text-sm text-gray-500">Card ID: {card.id}</div>
            <div className="text-sm text-gray-500">
              Created: {new Date(card.createdAt).toLocaleString()}
            </div>
            {card.description && (
              <div className="text-sm">
                <p className="font-medium mb-2">Description:</p>
                <p className="text-gray-700">{card.description}</p>
              </div>
            )}
            {/* Sections will be added in T167 */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
