/**
 * T182 [US4] InviteMember Command and Handler
 * User Story 4: Team Organization and Access Control
 *
 * CQRS Command for inviting a member to an organization.
 * Only owners and admins can invite members.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizationMember,
  OrganizationRole,
} from '../../../domain/organization/organization-member.model';
import { OrganizationRepository } from '../../../domain/organization/organization.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { MemberInvitedEvent } from '../../../domain/organization/events';

export class InviteMemberCommand {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly role: OrganizationRole,
    public readonly invitedBy: string,
  ) {}
}

@Injectable()
@CommandHandler(InviteMemberCommand)
export class InviteMemberHandler
  implements ICommandHandler<InviteMemberCommand>
{
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: InviteMemberCommand): Promise<OrganizationMember> {
    // Verify organization exists
    const organization = await this.organizationRepository.findById(
      command.organizationId,
    );
    if (!organization) {
      throw new NotFoundException(
        `Organization ${command.organizationId} not found`,
      );
    }

    // Verify inviter has permission
    const inviter = await this.organizationRepository.findMember(
      command.organizationId,
      command.invitedBy,
    );
    if (!inviter || !inviter.canManageMembers()) {
      throw new ForbiddenException('Only owners and admins can invite members');
    }

    // Check if user is already a member
    const existingMember = await this.organizationRepository.findMember(
      command.organizationId,
      command.userId,
    );
    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    // Create and add member
    const member = OrganizationMember.create(
      command.organizationId,
      command.userId,
      command.role,
      command.invitedBy,
    );
    const savedMember = await this.organizationRepository.addMember(member);

    // Emit domain event
    const event: MemberInvitedEvent = {
      eventName: 'organization.member.invited',
      occurredAt: new Date(),
      aggregateId: command.organizationId,
      userId: command.userId,
      organizationId: command.organizationId,
      role: command.role,
      invitedBy: command.invitedBy,
    };
    this.eventEmitter.emit(event.eventName, event);

    return savedMember;
  }
}
