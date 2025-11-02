import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ListEntity } from '../../infrastructure/persistence/entities/list.entity';
import { BoardEntity } from '../../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../../infrastructure/persistence/entities/board-member.entity';
import { OrganizationMemberEntity } from '../../infrastructure/persistence/entities/organization-member.entity';
import { CardEntity } from '../../infrastructure/persistence/entities/card.entity';
import { ListRepositoryImpl } from '../../infrastructure/persistence/repositories/list.repository.impl';
import { ListController } from '../../presentation/controllers/list.controller';
import { CreateListHandler } from '../../application/commands/list/create-list.handler';
import { MoveListHandler } from '../../application/commands/list/move-list.handler';
import { SharedModule } from '../shared/shared.module';
import { BoardModule } from '../board/board.module';

const CommandHandlers = [CreateListHandler, MoveListHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListEntity,
      BoardEntity,
      BoardMemberEntity,
      OrganizationMemberEntity,
      CardEntity,
    ]),
    CqrsModule,
    SharedModule,
    BoardModule,
  ],
  controllers: [ListController],
  providers: [
    {
      provide: 'IListRepository',
      useClass: ListRepositoryImpl,
    },
    ...CommandHandlers,
  ],
  exports: ['IListRepository'],
})
export class ListModule {}
