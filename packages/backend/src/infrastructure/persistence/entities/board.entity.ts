/**
 * T066 - Board Entity (TypeORM)
 *
 * Represents a project workspace containing lists and cards.
 * Implements the Board aggregate root from the data model.
 *
 * Relationships:
 * - Belongs to Organization
 * - Has many BoardMembers (access permissions)
 * - Has many Lists (columns on board)
 * - Has many Labels (board-specific labels)
 * - Created by User
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { BoardMemberEntity } from './board-member.entity';
import { ListEntity } from './list.entity';

@Entity('boards')
@Index('IDX_board_organization', ['organizationId'])
@Index('IDX_board_org_archived', ['organizationId', 'isArchived'])
@Index('IDX_board_created_by', ['createdBy'])
@Index('IDX_board_created_at', ['createdAt'])
export class BoardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color!: string | null;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => OrganizationEntity, (org) => org.boards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator!: UserEntity;

  @OneToMany(() => BoardMemberEntity, (member) => member.board, {
    cascade: true,
  })
  members!: BoardMemberEntity[];

  @OneToMany(() => ListEntity, (list) => list.board, { cascade: true })
  lists!: ListEntity[];
}
