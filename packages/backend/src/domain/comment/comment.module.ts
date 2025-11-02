import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { CommentEntity } from '../../infrastructure/persistence/entities/comment.entity';
import { CommentController } from '../../presentation/controllers/comment.controller';
import { AddCommentHandler } from '../../application/commands/comment/add-comment.handler';
import { CommentRepositoryImpl } from '../../infrastructure/persistence/repositories/comment.repository.impl';
import { SharedModule } from '../shared/shared.module';
import { CardModule } from '../card/card.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity]),
    CqrsModule,
    SharedModule,
    CardModule,
  ],
  controllers: [CommentController],
  providers: [
    {
      provide: 'ICommentRepository',
      useClass: CommentRepositoryImpl,
    },
    AddCommentHandler,
  ],
  exports: ['ICommentRepository'],
})
export class CommentModule {}
