import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAttachmentRepository } from '../../../domain/attachment/attachment.repository';
import { Attachment } from '../../../domain/attachment/attachment.model';
import { AttachmentEntity } from '../entities/attachment.entity';

@Injectable()
export class AttachmentRepositoryImpl implements IAttachmentRepository {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  async findById(id: string): Promise<Attachment | null> {
    const entity = await this.attachmentRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCardId(cardId: string): Promise<Attachment[]> {
    const entities = await this.attachmentRepository.find({
      where: { cardId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByUserId(userId: string): Promise<Attachment[]> {
    const entities = await this.attachmentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(attachment: Attachment): Promise<Attachment> {
    const entity = this.toEntity(attachment);
    const saved = await this.attachmentRepository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.attachmentRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.attachmentRepository.count({ where: { id } });
    return count > 0;
  }

  async countByCardId(cardId: string): Promise<number> {
    return this.attachmentRepository.count({ where: { cardId } });
  }

  async getTotalSizeByCardId(cardId: string): Promise<number> {
    const result = await this.attachmentRepository
      .createQueryBuilder('attachment')
      .select('SUM(attachment.size)', 'total')
      .where('attachment.cardId = :cardId', { cardId })
      .getRawOne();
    return parseInt(result?.total || '0', 10);
  }

  private toDomain(entity: AttachmentEntity): Attachment {
    return new Attachment(
      entity.id,
      entity.cardId,
      entity.userId,
      entity.name,
      entity.filename,
      entity.mimeType,
      entity.size,
      entity.storagePath,
      entity.url,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(attachment: Attachment): AttachmentEntity {
    const entity = new AttachmentEntity();
    entity.id = attachment.id;
    entity.cardId = attachment.cardId;
    entity.userId = attachment.userId;
    entity.name = attachment.name;
    entity.filename = attachment.filename;
    entity.mimeType = attachment.mimeType;
    entity.size = attachment.size;
    entity.storagePath = attachment.storagePath;
    entity.url = attachment.url;
    entity.createdAt = attachment.createdAt;
    entity.updatedAt = attachment.updatedAt;
    return entity;
  }
}
