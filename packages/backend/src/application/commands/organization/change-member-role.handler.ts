/**
 * T184 [US4] ChangeMemberRole Command and Handler
 * User Story 4: Team Organization and Access Control
 *
 * CQRS Command for changing a member's role in an organization.
 * Only owners and admins can change roles.
 * Cannot demote the last owner.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrganizationRole } from '../../../domain/organization/organization-member.model';
import { OrganizationRepository } from '../../../domain/organization/organization.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { MemberRoleChangedEvent } from '../../../domain/organization/events';

export class ChangeMemberRoleCommand {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly newRole: OrganizationRole,
    public readonly changedBy: string,
  ) {}
}

@Injectable()
@CommandHandler(ChangeMemberRoleCommand)
export class ChangeMemberRoleHandler
  implements ICommandHandler<ChangeMemberRoleCommand>
{
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<void> {
    // Verify organization exists
    const organization = await this.organizationRepository.findById(
      command.organizationId,
    );
    if (!organization) {
      throw new NotFoundException(
        `Organization ${command.organizationId} not found`,
      );
    }

    // Verify changer has permission
    const changer = await this.organizationRepository.findMember(
      command.organizationId,
      command.changedBy,
    );
    if (!changer || !changer.canManageMembers()) {
      throw new ForbiddenException(
        'Only owners and admins can change member roles',
      );
    }

    // Verify member exists
    const member = await this.organizationRepository.findMember(
      command.organizationId,
      command.userId,
    );
    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    const oldRole = member.role;

    // Prevent demoting the last owner
    if (
      oldRole === OrganizationRole.OWNER &&
      command.newRole !== OrganizationRole.OWNER
    ) {
      const allMembers = await this.organizationRepository.findMembers(
        command.organizationId,
      );
      const ownerCount = allMembers.filter(
        (m) => m.role === OrganizationRole.OWNER,
      ).length;
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot demote the last owner');
      }
    }

    // Update role
    await this.organizationRepository.updateMemberRole(
      command.organizationId,
      command.userId,
      command.newRole,
    );

    // Emit domain event
    const event: MemberRoleChangedEvent = {
      eventName: 'organization.member.roleChanged',
      occurredAt: new Date(),
      aggregateId: command.organizationId,
      userId: command.userId,
      organizationId: command.organizationId,
      oldRole,
      newRole: command.newRole,
      changedBy: command.changedBy,
    };
    this.eventEmitter.emit(event.eventName, event);
  }
}
