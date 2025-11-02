import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from '../../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../../infrastructure/persistence/entities/board-member.entity';
import { OrganizationMemberEntity } from '../../infrastructure/persistence/entities/organization-member.entity';
import { PermissionService } from './permission.service';
import { DomainEventEmitter } from './domain-event.emitter';
import { PositionCalculatorService } from './position-calculator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardEntity,
      BoardMemberEntity,
      OrganizationMemberEntity,
    ]),
  ],
  providers: [PermissionService, DomainEventEmitter, PositionCalculatorService],
  exports: [PermissionService, DomainEventEmitter, PositionCalculatorService],
})
export class SharedModule {}
