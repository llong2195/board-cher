/**
 * T181 [US4] CreateOrganization Command and Handler
 * User Story 4: Team Organization and Access Control
 *
 * CQRS Command for creating a new organization.
 * The creator automatically becomes the owner.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Organization } from '../../../domain/organization/organization.model';
import {
  OrganizationMember,
  OrganizationRole,
} from '../../../domain/organization/organization-member.model';
import { OrganizationRepository } from '../../../domain/organization/organization.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { OrganizationCreatedEvent } from '../../../domain/organization/events';

export class CreateOrganizationCommand {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly userId: string,
  ) {}
}

@Injectable()
@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationHandler
  implements ICommandHandler<CreateOrganizationCommand>
{
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: CreateOrganizationCommand): Promise<Organization> {
    // Create organization domain model
    const organization = Organization.create(
      command.name,
      command.description,
      command.userId,
    );

    // Save organization
    const savedOrganization =
      await this.organizationRepository.save(organization);

    // Add creator as owner
    const ownerMember = OrganizationMember.create(
      savedOrganization.id,
      command.userId,
      OrganizationRole.OWNER,
      command.userId, // Self-invited
    );
    await this.organizationRepository.addMember(ownerMember);

    // Emit domain event
    const event: OrganizationCreatedEvent = {
      eventName: 'organization.created',
      occurredAt: new Date(),
      aggregateId: savedOrganization.id,
      userId: command.userId,
      organizationId: savedOrganization.id,
      name: savedOrganization.name,
      createdBy: command.userId,
    };
    this.eventEmitter.emit(event.eventName, event);

    return savedOrganization;
  }
}
