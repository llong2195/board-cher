import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICommentRepository } from '../../../domain/comment/comment.repository';
import { Comment } from '../../../domain/comment/comment.model';
import { CommentEntity } from '../entities/comment.entity';

@Injectable()
export class CommentRepositoryImpl implements ICommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  async findById(id: string): Promise<Comment | null> {
    const entity = await this.commentRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCardId(cardId: string): Promise<Comment[]> {
    const entities = await this.commentRepository.find({
      where: { cardId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByUserId(userId: string): Promise<Comment[]> {
    const entities = await this.commentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(comment: Comment): Promise<Comment> {
    const entity = this.toEntity(comment);
    const saved = await this.commentRepository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.commentRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.commentRepository.count({ where: { id } });
    return count > 0;
  }

  async countByCardId(cardId: string): Promise<number> {
    return this.commentRepository.count({ where: { cardId } });
  }

  private toDomain(entity: CommentEntity): Comment {
    return new Comment(
      entity.id,
      entity.cardId,
      entity.userId,
      entity.content,
      entity.isEdited,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(comment: Comment): CommentEntity {
    const entity = new CommentEntity();
    entity.id = comment.id;
    entity.cardId = comment.cardId;
    entity.userId = comment.userId;
    entity.content = comment.content;
    entity.isEdited = comment.isEdited;
    entity.createdAt = comment.createdAt;
    entity.updatedAt = comment.updatedAt;
    return entity;
  }
}
