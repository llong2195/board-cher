import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2 } from 'lucide-react';
import type { Comment } from '@/services/api/card.api';
import { commentApi } from '@/services/api/comment.api';

/**
 * CommentList Component (T164)
 * User Story 2: Enrich Cards with Details
 *
 * Displays comments with add comment form.
 * Supports optimistic updates (T169).
 */

interface CommentListProps {
  cardId: string;
  comments: Comment[];
  onAdd: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  readOnly?: boolean;
}

export function CommentList({
  cardId,
  comments,
  onAdd,
  onDelete,
  readOnly = false,
}: CommentListProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const comment = await commentApi.addComment(cardId, {
        content: newComment.trim(),
      });
      onAdd(comment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentApi.deleteComment(commentId);
      onDelete(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Comments</h3>

      {!readOnly && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[80px] resize-y"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={!newComment.trim() || isSubmitting} size="sm">
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {sortedComments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No comments yet</p>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                    {comment.isEdited && ' (edited)'}
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                    className="h-6 px-2"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
