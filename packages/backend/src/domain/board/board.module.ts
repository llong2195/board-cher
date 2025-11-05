import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { BoardEntity } from '../../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../../infrastructure/persistence/entities/board-member.entity';
import { OrganizationMemberEntity } from '../../infrastructure/persistence/entities/organization-member.entity';
import { ListEntity } from '../../infrastructure/persistence/entities/list.entity';
import { CardEntity } from '../../infrastructure/persistence/entities/card.entity';
import { BoardRepositoryImpl } from '../../infrastructure/persistence/repositories/board.repository.impl';
import { BoardAggregateRepositoryImpl } from '../../infrastructure/persistence/repositories/board-aggregate.repository.impl';
import { BoardController } from '../../presentation/controllers/board.controller';
import { CreateBoardHandler } from '../../application/commands/board/create-board.handler';
import { UpdateBoardHandler } from '../../application/commands/board/update-board.handler';
import { DeleteBoardHandler } from '../../application/commands/board/delete-board.handler';
import { GetBoardHandler } from '../../application/queries/board/get-board.handler';
import { ListBoardsHandler } from '../../application/queries/board/list-boards.handler';
import { OrganizationModule } from '../organization/organization.module';
import { SharedModule } from '../shared/shared.module';

const CommandHandlers = [
  CreateBoardHandler,
  UpdateBoardHandler,
  DeleteBoardHandler,
];

const QueryHandlers = [GetBoardHandler, ListBoardsHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardEntity,
      BoardMemberEntity,
      OrganizationMemberEntity,
      ListEntity,
      CardEntity,
    ]),
    CqrsModule,
    OrganizationModule,
    SharedModule,
  ],
  controllers: [BoardController],
  providers: [
    {
      provide: 'IBoardRepository',
      useClass: BoardRepositoryImpl,
    },
    {
      provide: 'IBoardAggregateRepository',
      useClass: BoardAggregateRepositoryImpl,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: ['IBoardRepository', 'IBoardAggregateRepository'],
})
export class BoardModule {}
