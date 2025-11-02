import { Attachment } from '../attachment.model';

/**
 * Base class for Attachment domain events
 */
export abstract class AttachmentEvent {
  constructor(
    public readonly attachmentId: string,
    public readonly cardId: string,
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when a file is uploaded and attached to a card
 */
export class AttachmentUploadedEvent extends AttachmentEvent {
  constructor(public readonly attachment: Attachment) {
    super(attachment.id, attachment.cardId, attachment.userId);
  }
}

/**
 * Event emitted when an attachment is renamed
 */
export class AttachmentRenamedEvent extends AttachmentEvent {
  constructor(
    public readonly attachment: Attachment,
    public readonly oldName: string,
  ) {
    super(attachment.id, attachment.cardId, attachment.userId);
  }
}

/**
 * Event emitted when an attachment is deleted
 */
export class AttachmentDeletedEvent extends AttachmentEvent {
  constructor(
    attachmentId: string,
    cardId: string,
    userId: string,
    public readonly storagePath: string,
  ) {
    super(attachmentId, cardId, userId);
  }
}
