/**
 * T179 [US4] Organization Domain Events
 * User Story 4: Team Organization and Access Control
 *
 * Domain events emitted by the Organization aggregate.
 * These events drive WebSocket notifications and activity logging.
 */

import { DomainEvent } from '../../shared/domain-event.emitter';
import { OrganizationRole } from '../organization-member.model';

/**
 * Event emitted when an organization is created
 */
export interface OrganizationCreatedEvent extends DomainEvent {
  eventName: 'organization.created';
  organizationId: string;
  name: string;
  createdBy: string;
}

/**
 * Event emitted when a member is invited to an organization
 */
export interface MemberInvitedEvent extends DomainEvent {
  eventName: 'organization.member.invited';
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  invitedBy: string;
}

/**
 * Event emitted when a member is removed from an organization
 */
export interface MemberRemovedEvent extends DomainEvent {
  eventName: 'organization.member.removed';
  organizationId: string;
  userId: string;
  removedBy: string;
}

/**
 * Event emitted when a member's role is changed
 */
export interface MemberRoleChangedEvent extends DomainEvent {
  eventName: 'organization.member.roleChanged';
  organizationId: string;
  userId: string;
  oldRole: OrganizationRole;
  newRole: OrganizationRole;
  changedBy: string;
}
