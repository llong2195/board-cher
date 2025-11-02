/**
 * T183 [US4] RemoveMember Command and Handler
 * User Story 4: Team Organization and Access Control
 *
 * CQRS Command for removing a member from an organization.
 * Only owners and admins can remove members.
 * Cannot remove the last owner.
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
import { MemberRemovedEvent } from '../../../domain/organization/events';

export class RemoveMemberCommand {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly removedBy: string,
  ) {}
}

@Injectable()
@CommandHandler(RemoveMemberCommand)
export class RemoveMemberHandler
  implements ICommandHandler<RemoveMemberCommand>
{
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    // Verify organization exists
    const organization = await this.organizationRepository.findById(
      command.organizationId,
    );
    if (!organization) {
      throw new NotFoundException(
        `Organization ${command.organizationId} not found`,
      );
    }

    // Verify remover has permission
    const remover = await this.organizationRepository.findMember(
      command.organizationId,
      command.removedBy,
    );
    if (!remover || !remover.canManageMembers()) {
      throw new ForbiddenException('Only owners and admins can remove members');
    }

    // Verify member exists
    const member = await this.organizationRepository.findMember(
      command.organizationId,
      command.userId,
    );
    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Prevent removing the last owner
    if (member.role === OrganizationRole.OWNER) {
      const allMembers = await this.organizationRepository.findMembers(
        command.organizationId,
      );
      const ownerCount = allMembers.filter(
        (m) => m.role === OrganizationRole.OWNER,
      ).length;
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last owner from the organization',
        );
      }
    }

    // Remove member
    await this.organizationRepository.removeMember(
      command.organizationId,
      command.userId,
    );

    // Emit domain event
    const event: MemberRemovedEvent = {
      eventName: 'organization.member.removed',
      occurredAt: new Date(),
      aggregateId: command.organizationId,
      userId: command.userId,
      organizationId: command.organizationId,
      removedBy: command.removedBy,
    };
    this.eventEmitter.emit(event.eventName, event);
  }
}
