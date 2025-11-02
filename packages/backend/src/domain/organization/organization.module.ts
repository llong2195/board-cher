import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { OrganizationEntity } from '../../infrastructure/persistence/entities/organization.entity';
import { OrganizationMemberEntity } from '../../infrastructure/persistence/entities/organization-member.entity';
import { OrganizationRepositoryImpl } from '../../infrastructure/persistence/repositories/organization.repository.impl';
import { OrganizationController } from '../../presentation/controllers/organization.controller';
import { CreateOrganizationHandler } from '../../application/commands/organization/create-organization.handler';
import { InviteMemberHandler } from '../../application/commands/organization/invite-member.handler';
import { RemoveMemberHandler } from '../../application/commands/organization/remove-member.handler';
import { ChangeMemberRoleHandler } from '../../application/commands/organization/change-member-role.handler';
import { GetOrganizationHandler } from '../../application/queries/organization/get-organization.handler';
import { SharedModule } from '../shared/shared.module';

const CommandHandlers = [
  CreateOrganizationHandler,
  InviteMemberHandler,
  RemoveMemberHandler,
  ChangeMemberRoleHandler,
];

const QueryHandlers = [GetOrganizationHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity, OrganizationMemberEntity]),
    CqrsModule,
    SharedModule,
  ],
  controllers: [OrganizationController],
  providers: [
    {
      provide: 'IOrganizationRepository',
      useClass: OrganizationRepositoryImpl,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: ['IOrganizationRepository'],
})
export class OrganizationModule {}
