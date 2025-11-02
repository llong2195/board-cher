import { Comment } from '../comment.model';

/**
 * Base class for Comment domain events
 */
export abstract class CommentEvent {
  constructor(
    public readonly commentId: string,
    public readonly cardId: string,
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when a comment is added to a card
 */
export class CommentAddedEvent extends CommentEvent {
  constructor(public readonly comment: Comment) {
    super(comment.id, comment.cardId, comment.userId);
  }
}

/**
 * Event emitted when a comment is edited
 */
export class CommentEditedEvent extends CommentEvent {
  constructor(
    public readonly comment: Comment,
    public readonly oldContent: string,
  ) {
    super(comment.id, comment.cardId, comment.userId);
  }
}

/**
 * Event emitted when a comment is deleted
 */
export class CommentDeletedEvent extends CommentEvent {
  constructor(commentId: string, cardId: string, userId: string) {
    super(commentId, cardId, userId);
  }
}
