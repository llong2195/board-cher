import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { CardEntity } from '../../infrastructure/persistence/entities/card.entity';
import { CommentEntity } from '../../infrastructure/persistence/entities/comment.entity';
import { ChecklistEntity } from '../../infrastructure/persistence/entities/checklist.entity';
import { ChecklistItemEntity } from '../../infrastructure/persistence/entities/checklist-item.entity';
import { AttachmentEntity } from '../../infrastructure/persistence/entities/attachment.entity';
import { CardAssignmentEntity } from '../../infrastructure/persistence/entities/card-assignment.entity';
import { BoardEntity } from '../../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../../infrastructure/persistence/entities/board-member.entity';
import { OrganizationMemberEntity } from '../../infrastructure/persistence/entities/organization-member.entity';
import { ListEntity } from '../../infrastructure/persistence/entities/list.entity';
import { CardRepositoryImpl } from '../../infrastructure/persistence/repositories/card.repository.impl';
import { CardAggregateRepositoryImpl } from '../../infrastructure/persistence/repositories/card-aggregate.repository.impl';
import { CardController } from '../../presentation/controllers/card.controller';
import { CreateCardHandler } from '../../application/commands/card/create-card.handler';
import { MoveCardHandler } from '../../application/commands/card/move-card.handler';
import { UpdateCardDetailsHandler } from '../../application/commands/card/update-card-details.handler';
import { ApplyLabelToCardHandler } from '../../application/commands/card/apply-label.handler';
import { SharedModule } from '../shared/shared.module';
import { ListModule } from '../list/list.module';
import { LabelModule } from '../label/label.module';

const CommandHandlers = [
  CreateCardHandler,
  MoveCardHandler,
  UpdateCardDetailsHandler,
  ApplyLabelToCardHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CardEntity,
      CommentEntity,
      ChecklistEntity,
      ChecklistItemEntity,
      AttachmentEntity,
      CardAssignmentEntity,
      BoardEntity,
      BoardMemberEntity,
      OrganizationMemberEntity,
      ListEntity,
    ]),
    CqrsModule,
    SharedModule,
    ListModule,
    LabelModule,
  ],
  controllers: [CardController],
  providers: [
    {
      provide: 'ICardRepository',
      useClass: CardRepositoryImpl,
    },
    {
      provide: 'ICardAggregateRepository',
      useClass: CardAggregateRepositoryImpl,
    },
    ...CommandHandlers,
  ],
  exports: ['ICardRepository', 'ICardAggregateRepository'],
})
export class CardModule {}
