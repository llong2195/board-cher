import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IChecklistRepository } from '../../../domain/checklist/checklist.repository';
import {
  Checklist,
  ChecklistItem,
} from '../../../domain/checklist/checklist.model';
import { ChecklistEntity } from '../entities/checklist.entity';
import { ChecklistItemEntity } from '../entities/checklist-item.entity';

@Injectable()
export class ChecklistRepositoryImpl implements IChecklistRepository {
  constructor(
    @InjectRepository(ChecklistEntity)
    private readonly checklistRepository: Repository<ChecklistEntity>,
    @InjectRepository(ChecklistItemEntity)
    private readonly itemRepository: Repository<ChecklistItemEntity>,
  ) {}

  async findById(id: string): Promise<Checklist | null> {
    const entity = await this.checklistRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCardId(cardId: string): Promise<Checklist[]> {
    const entities = await this.checklistRepository.find({
      where: { cardId },
      relations: ['items'],
      order: { position: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(checklist: Checklist): Promise<Checklist> {
    const entity = this.toEntity(checklist);

    // Save the checklist first
    const savedChecklist = await this.checklistRepository.save(entity);

    // Save all items
    const items = checklist.getItems();
    if (items.length > 0) {
      const itemEntities = items.map((item) =>
        this.toItemEntity(item, savedChecklist.id),
      );
      await this.itemRepository.save(itemEntities);
    }

    // Reload with items
    return this.findById(savedChecklist.id) as Promise<Checklist>;
  }

  async delete(id: string): Promise<void> {
    // Items will be cascade deleted
    await this.checklistRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.checklistRepository.count({ where: { id } });
    return count > 0;
  }

  async countByCardId(cardId: string): Promise<number> {
    return this.checklistRepository.count({ where: { cardId } });
  }

  async saveItem(
    checklistId: string,
    item: ChecklistItem,
  ): Promise<ChecklistItem> {
    const entity = this.toItemEntity(item, checklistId);
    const saved = await this.itemRepository.save(entity);
    return this.toItemDomain(saved);
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.itemRepository.delete(itemId);
  }

  async findItemById(itemId: string): Promise<ChecklistItem | null> {
    const entity = await this.itemRepository.findOne({ where: { id: itemId } });
    return entity ? this.toItemDomain(entity) : null;
  }

  private toDomain(entity: ChecklistEntity): Checklist {
    const checklist = new Checklist(
      entity.id,
      entity.cardId,
      entity.name,
      entity.position,
      entity.createdAt,
      entity.updatedAt,
    );

    // Add items if loaded
    if (entity.items) {
      const items = entity.items
        .map((item) => this.toItemDomain(item))
        .sort((a, b) => a.position - b.position);
      checklist.setItems(items);
    }

    return checklist;
  }

  private toEntity(checklist: Checklist): ChecklistEntity {
    const entity = new ChecklistEntity();
    entity.id = checklist.id;
    entity.cardId = checklist.cardId;
    entity.name = checklist.name;
    entity.position = checklist.position;
    entity.createdAt = checklist.createdAt;
    entity.updatedAt = checklist.updatedAt;
    return entity;
  }

  private toItemDomain(entity: ChecklistItemEntity): ChecklistItem {
    return new ChecklistItem(
      entity.id,
      entity.text,
      entity.isCompleted,
      entity.position,
    );
  }

  private toItemEntity(
    item: ChecklistItem,
    checklistId: string,
  ): ChecklistItemEntity {
    const entity = new ChecklistItemEntity();
    entity.id = item.id;
    entity.checklistId = checklistId;
    entity.text = item.text;
    entity.isCompleted = item.isCompleted;
    entity.position = item.position;
    return entity;
  }
}
