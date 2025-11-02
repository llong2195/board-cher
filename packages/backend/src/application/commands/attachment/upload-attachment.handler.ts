/**
 * Upload Attachment Command Handler (T138)
 * User Story 2: Enrich Cards with Details
 *
 * Handles file upload to card attachments.
 * Uses FileStorageService for persistent storage.
 * Emits AttachmentUploadedEvent for real-time updates.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UploadAttachmentCommand } from './upload-attachment.command';
import { Attachment } from '../../../domain/attachment/attachment.model';
import { IAttachmentRepository } from '../../../domain/attachment/attachment.repository';
import { ICardRepository } from '../../../domain/card/card.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { AttachmentUploadedEvent } from '../../../domain/attachment/events/attachment.events';
import { FileStorageService } from '../../../infrastructure/file-storage/file-storage.service';

@Injectable()
@CommandHandler(UploadAttachmentCommand)
export class UploadAttachmentHandler
  implements ICommandHandler<UploadAttachmentCommand>
{
  constructor(
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly cardRepository: ICardRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: UploadAttachmentCommand): Promise<Attachment> {
    // Verify card exists
    const card = await this.cardRepository.findById(command.cardId);
    if (!card) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // TODO: Add permission check - verify user has access to card

    // Store file using FileStorageService
    const { storagePath, url } = await this.fileStorageService.store(
      command.file.buffer,
      command.file.filename,
      command.file.mimeType,
    );

    // Create attachment domain model
    const attachmentId = uuidv4();
    const attachment = Attachment.create(
      attachmentId,
      command.cardId,
      command.userId,
      command.file.name,
      command.file.filename,
      command.file.mimeType,
      command.file.size,
      storagePath,
      url,
    );

    // Persist to database
    const savedAttachment = await this.attachmentRepository.save(attachment);

    // Update card with attachment reference
    card.addAttachment(savedAttachment.id);
    await this.cardRepository.save(card);

    // Emit domain event for real-time updates
    const event = new AttachmentUploadedEvent(savedAttachment);
    this.eventEmitter.emit('attachment.uploaded', event);

    return savedAttachment;
  }
}
