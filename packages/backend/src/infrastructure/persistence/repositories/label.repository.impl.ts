import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILabelRepository } from '../../../domain/label/label.repository';
import { Label } from '../../../domain/label/label.model';
import { LabelEntity } from '../entities/label.entity';

@Injectable()
export class LabelRepositoryImpl implements ILabelRepository {
  constructor(
    @InjectRepository(LabelEntity)
    private readonly labelRepository: Repository<LabelEntity>,
  ) {}

  async findById(id: string): Promise<Label | null> {
    const entity = await this.labelRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBoardId(boardId: string): Promise<Label[]> {
    const entities = await this.labelRepository.find({
      where: { boardId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCardId(cardId: string): Promise<Label[]> {
    const entities = await this.labelRepository
      .createQueryBuilder('label')
      .innerJoin('label.cards', 'card')
      .where('card.id = :cardId', { cardId })
      .orderBy('label.createdAt', 'ASC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByBoardIdAndName(
    boardId: string,
    name: string,
  ): Promise<Label | null> {
    const entity = await this.labelRepository.findOne({
      where: { boardId, name },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(label: Label): Promise<Label> {
    const entity = this.toEntity(label);
    const saved = await this.labelRepository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.labelRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.labelRepository.count({ where: { id } });
    return count > 0;
  }

  async applyToCard(labelId: string, cardId: string): Promise<void> {
    await this.labelRepository
      .createQueryBuilder()
      .relation(LabelEntity, 'cards')
      .of(labelId)
      .add(cardId);
  }

  async removeFromCard(labelId: string, cardId: string): Promise<void> {
    await this.labelRepository
      .createQueryBuilder()
      .relation(LabelEntity, 'cards')
      .of(labelId)
      .remove(cardId);
  }

  async isAppliedToCard(labelId: string, cardId: string): Promise<boolean> {
    const count = await this.labelRepository
      .createQueryBuilder('label')
      .innerJoin('label.cards', 'card')
      .where('label.id = :labelId', { labelId })
      .andWhere('card.id = :cardId', { cardId })
      .getCount();
    return count > 0;
  }

  private toDomain(entity: LabelEntity): Label {
    return new Label(
      entity.id,
      entity.boardId,
      entity.name,
      entity.color,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(label: Label): LabelEntity {
    const entity = new LabelEntity();
    entity.id = label.id;
    entity.boardId = label.boardId;
    entity.name = label.name;
    entity.color = label.color;
    entity.createdAt = label.createdAt;
    entity.updatedAt = label.updatedAt;
    return entity;
  }
}
