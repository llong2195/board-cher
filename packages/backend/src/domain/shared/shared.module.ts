import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from '../../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../../infrastructure/persistence/entities/board-member.entity';
import { OrganizationMemberEntity } from '../../infrastructure/persistence/entities/organization-member.entity';
import { ListEntity } from '../../infrastructure/persistence/entities/list.entity';
import { CardEntity } from '../../infrastructure/persistence/entities/card.entity';
import { PermissionService } from './permission.service';
import { DomainEventEmitter } from './domain-event.emitter';
import { PositionCalculatorService } from './position-calculator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardEntity,
      BoardMemberEntity,
      OrganizationMemberEntity,
      ListEntity,
      CardEntity,
    ]),
  ],
  providers: [PermissionService, DomainEventEmitter, PositionCalculatorService],
  exports: [
    PermissionService,
    DomainEventEmitter,
    PositionCalculatorService,
    TypeOrmModule, // Export TypeORM repositories for guards
  ],
})
export class SharedModule {}
