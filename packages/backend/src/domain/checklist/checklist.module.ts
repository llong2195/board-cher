import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ChecklistEntity } from '../../infrastructure/persistence/entities/checklist.entity';
import { ChecklistItemEntity } from '../../infrastructure/persistence/entities/checklist-item.entity';
import { ChecklistRepositoryImpl } from '../../infrastructure/persistence/repositories/checklist.repository.impl';
import { ChecklistController } from '../../presentation/controllers/checklist.controller';
import { CreateChecklistHandler } from '../../application/commands/checklist/create-checklist.handler';
import { ToggleChecklistItemHandler } from '../../application/commands/checklist/toggle-item.handler';
import { SharedModule } from '../shared/shared.module';
import { CardModule } from '../card/card.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChecklistEntity, ChecklistItemEntity]),
    CqrsModule,
    SharedModule,
    CardModule,
  ],
  controllers: [ChecklistController],
  providers: [
    {
      provide: 'IChecklistRepository',
      useClass: ChecklistRepositoryImpl,
    },
    CreateChecklistHandler,
    ToggleChecklistItemHandler,
  ],
  exports: ['IChecklistRepository'],
})
export class ChecklistModule {}
