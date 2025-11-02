/**
 * T064 - Organization Entity (TypeORM)
 *
 * Represents a team or company that owns boards.
 * Implements the Organization aggregate root from the data model.
 *
 * Relationships:
 * - Has many OrganizationMembers (members with roles)
 * - Has many Boards (owned boards)
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { OrganizationMemberEntity } from './organization-member.entity';
import { BoardEntity } from './board.entity';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('IDX_organization_slug')
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl!: string | null;

  @CreateDateColumn()
  @Index('IDX_organization_created_at')
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => OrganizationMemberEntity, (member) => member.organization, {
    cascade: true,
  })
  members!: OrganizationMemberEntity[];

  @OneToMany(() => BoardEntity, (board) => board.organization, {
    cascade: true,
  })
  boards!: BoardEntity[];
}
