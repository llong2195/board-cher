import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { LabelEntity } from '../../infrastructure/persistence/entities/label.entity';
import { LabelRepositoryImpl } from '../../infrastructure/persistence/repositories/label.repository.impl';
import { LabelController } from '../../presentation/controllers/label.controller';
import { CreateLabelHandler } from '../../application/commands/label/create-label.handler';
import { SharedModule } from '../shared/shared.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabelEntity]),
    CqrsModule,
    SharedModule,
    BoardModule,
  ],
  controllers: [LabelController],
  providers: [
    {
      provide: 'ILabelRepository',
      useClass: LabelRepositoryImpl,
    },
    CreateLabelHandler,
  ],
  exports: ['ILabelRepository'],
})
export class LabelModule {}
