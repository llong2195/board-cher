import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Card, Attachment, Comment, Label, Checklist } from '@/services/api/card.api';
import { cardApi } from '@/services/api/card.api';
import { CardDescription } from './CardDescription';
import { DueDatePicker } from './DueDatePicker';
import { AttachmentList } from './AttachmentList';
import { CommentList } from './CommentList';
import { LabelSelector } from './LabelSelector';
import { ChecklistSection } from './ChecklistSection';
import { useWebSocket } from '@/hooks/useWebSocket';

/**
 * CardModal Component (T160 + T167 + T168)
 * User Story 2: Enrich Cards with Details
 *
 * Main modal dialog for viewing and editing card details with real-time updates.
 * Uses shadcn/ui Dialog component with all card detail sections integrated.
 */

interface CardModalProps {
  cardId: string;
  boardId: string; // Required for label management
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (card: Card) => void;
  wsToken?: string | null; // WebSocket auth token for real-time updates
}

export function CardModal({ cardId, boardId, isOpen, onClose, onUpdate, wsToken }: CardModalProps) {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // T168: WebSocket real-time updates
  const ws = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
    token: wsToken || null,
    autoConnect: !!wsToken,
  });

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

  // T168: Subscribe to real-time card updates via WebSocket
  useEffect(() => {
    if (!isOpen || !cardId || !ws.isConnected) {
      return;
    }

    // Handle card detail updates
    const handleCardUpdated = (data: { cardId: string; card: Partial<Card> }) => {
      if (data.cardId === cardId && card) {
        setCard({ ...card, ...data.card });
      }
    };

    // Handle comment added
    const handleCommentAdded = (data: { cardId: string; comment: Comment }) => {
      if (data.cardId === cardId && card) {
        const comments = [...(card.comments || []), data.comment];
        setCard({ ...card, comments });
      }
    };

    // Handle comment deleted
    const handleCommentDeleted = (data: { cardId: string; commentId: string }) => {
      if (data.cardId === cardId && card) {
        const comments = (card.comments || []).filter((c) => c.id !== data.commentId);
        setCard({ ...card, comments });
      }
    };

    // Handle attachment uploaded
    const handleAttachmentUploaded = (data: { cardId: string; attachment: Attachment }) => {
      if (data.cardId === cardId && card) {
        const attachments = [...(card.attachments || []), data.attachment];
        setCard({ ...card, attachments });
      }
    };

    // Handle attachment deleted
    const handleAttachmentDeleted = (data: { cardId: string; attachmentId: string }) => {
      if (data.cardId === cardId && card) {
        const attachments = (card.attachments || []).filter((a) => a.id !== data.attachmentId);
        setCard({ ...card, attachments });
      }
    };

    // Handle label applied
    const handleLabelApplied = (data: { cardId: string; label: Label }) => {
      if (data.cardId === cardId && card) {
        const labels = [...(card.labels || []), data.label];
        setCard({ ...card, labels });
      }
    };

    // Handle label removed
    const handleLabelRemoved = (data: { cardId: string; labelId: string }) => {
      if (data.cardId === cardId && card) {
        const labels = (card.labels || []).filter((l) => l.id !== data.labelId);
        setCard({ ...card, labels });
      }
    };

    // Handle checklist updated
    const handleChecklistUpdated = (data: { cardId: string; checklist: Checklist }) => {
      if (data.cardId === cardId && card) {
        const checklists = (card.checklists || []).map((cl) =>
          cl.id === data.checklist.id ? data.checklist : cl,
        );
        setCard({ ...card, checklists });
      }
    };

    // Register event handlers
    ws.on('card:updated', handleCardUpdated);
    ws.on('card:comment:added', handleCommentAdded);
    ws.on('card:comment:deleted', handleCommentDeleted);
    ws.on('card:attachment:uploaded', handleAttachmentUploaded);
    ws.on('card:attachment:deleted', handleAttachmentDeleted);
    ws.on('card:label:applied', handleLabelApplied);
    ws.on('card:label:removed', handleLabelRemoved);
    ws.on('card:checklist:updated', handleChecklistUpdated);

    // Cleanup: unregister handlers on unmount or when dependencies change
    return () => {
      ws.off('card:updated', handleCardUpdated);
      ws.off('card:comment:added', handleCommentAdded);
      ws.off('card:comment:deleted', handleCommentDeleted);
      ws.off('card:attachment:uploaded', handleAttachmentUploaded);
      ws.off('card:attachment:deleted', handleAttachmentDeleted);
      ws.off('card:label:applied', handleLabelApplied);
      ws.off('card:label:removed', handleLabelRemoved);
      ws.off('card:checklist:updated', handleChecklistUpdated);
    };
  }, [isOpen, cardId, card, ws]);

  const handleUpdate = (updatedCard: Card) => {
    setCard(updatedCard);
    onUpdate?.(updatedCard);
  };

  const handleUpdateDescription = async (description: string) => {
    if (!card) return;
    const updated = await cardApi.updateDetails(cardId, { description });
    handleUpdate(updated);
  };

  const handleUpdateDueDate = async (dueDate: Date | null) => {
    if (!card) return;
    const updated = await cardApi.updateDetails(cardId, { dueDate });
    handleUpdate(updated);
  };

  const handleUploadAttachment = (attachment: Attachment) => {
    if (!card) return;
    const updated = { ...card, attachments: [...(card.attachments || []), attachment] };
    handleUpdate(updated);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!card) return;
    const updated = {
      ...card,
      attachments: (card.attachments || []).filter((a) => a.id !== attachmentId),
    };
    handleUpdate(updated);
  };

  const handleAddComment = (comment: Comment) => {
    if (!card) return;
    const updated = { ...card, comments: [...(card.comments || []), comment] };
    handleUpdate(updated);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!card) return;
    const updated = {
      ...card,
      comments: (card.comments || []).filter((c) => c.id !== commentId),
    };
    handleUpdate(updated);
  };

  const handleApplyLabel = (label: Label) => {
    if (!card) return;
    const updated = { ...card, labels: [...(card.labels || []), label] };
    handleUpdate(updated);
  };

  const handleRemoveLabel = (labelId: string) => {
    if (!card) return;
    const updated = {
      ...card,
      labels: (card.labels || []).filter((l) => l.id !== labelId),
    };
    handleUpdate(updated);
  };

  const handleUpdateChecklists = (checklists: Checklist[]) => {
    if (!card) return;
    const updated = { ...card, checklists };
    handleUpdate(updated);
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
          <div className="grid grid-cols-3 gap-6">
            {/* Main content area (2/3 width) */}
            <div className="col-span-2 space-y-6">
              {/* Card Description */}
              <CardDescription description={card.description} onSave={handleUpdateDescription} />

              {/* Attachments */}
              <AttachmentList
                cardId={cardId}
                attachments={card.attachments || []}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
              />

              {/* Checklists */}
              <ChecklistSection
                cardId={cardId}
                checklists={card.checklists || []}
                onUpdate={handleUpdateChecklists}
              />

              {/* Comments */}
              <CommentList
                cardId={cardId}
                comments={card.comments || []}
                onAdd={handleAddComment}
                onDelete={handleDeleteComment}
              />
            </div>

            {/* Sidebar (1/3 width) */}
            <div className="space-y-4">
              {/* Labels */}
              <LabelSelector
                boardId={boardId}
                cardId={cardId}
                selectedLabels={card.labels || []}
                onApply={handleApplyLabel}
                onRemove={handleRemoveLabel}
              />

              {/* Due Date */}
              <DueDatePicker
                dueDate={card.dueDate ? new Date(card.dueDate) : null}
                onSave={handleUpdateDueDate}
              />

              {/* Card Metadata */}
              <div className="pt-4 border-t">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created: {new Date(card.createdAt).toLocaleString()}</div>
                  {card.updatedAt && card.updatedAt !== card.createdAt && (
                    <div>Updated: {new Date(card.updatedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
