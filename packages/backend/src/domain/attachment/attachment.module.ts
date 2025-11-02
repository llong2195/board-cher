import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { AttachmentEntity } from '../../infrastructure/persistence/entities/attachment.entity';
import { AttachmentRepositoryImpl } from '../../infrastructure/persistence/repositories/attachment.repository.impl';
import { AttachmentController } from '../../presentation/controllers/attachment.controller';
import { UploadAttachmentHandler } from '../../application/commands/attachment/upload-attachment.handler';
import { FileStorageService } from '../../infrastructure/file-storage/file-storage.service';
import { SharedModule } from '../shared/shared.module';
import { CardModule } from '../card/card.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttachmentEntity]),
    CqrsModule,
    SharedModule,
    CardModule,
  ],
  controllers: [AttachmentController],
  providers: [
    {
      provide: 'IAttachmentRepository',
      useClass: AttachmentRepositoryImpl,
    },
    UploadAttachmentHandler,
    FileStorageService,
  ],
  exports: ['IAttachmentRepository', FileStorageService],
})
export class AttachmentModule {}
