/**
 * T065 - OrganizationMember Entity (TypeORM)
 *
 * Join table representing user membership in an organization with role.
 * Enforces role-based access control at the organization level.
 *
 * Relationships:
 * - Belongs to Organization
 * - Belongs to User
 *
 * Roles:
 * - owner: All permissions, can delete organization, manage all members
 * - admin: Manage members (except owners), manage boards, manage settings
 * - member: View organization, view boards, create boards (if allowed)
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('organization_members')
@Unique('UQ_organization_user', ['organizationId', 'userId'])
@Index('IDX_organization_member_org', ['organizationId'])
@Index('IDX_organization_member_user', ['userId'])
export class OrganizationMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  role!: OrganizationRole;

  @CreateDateColumn()
  joinedAt!: Date;

  // Relationships
  @ManyToOne(() => OrganizationEntity, (org) => org.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @ManyToOne(() => UserEntity, (user) => user.organizationMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
