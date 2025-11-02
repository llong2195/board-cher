/**
 * T067 - BoardMember Entity (TypeORM)
 *
 * Join table representing user access to a specific board with role.
 * Enforces role-based access control at the board level.
 *
 * Relationships:
 * - Belongs to Board
 * - Belongs to User
 *
 * Roles:
 * - admin: Full control of board (edit, delete, manage members)
 * - member: Create/edit/delete lists and cards
 * - guest: View only (read-only access)
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
import { BoardEntity } from './board.entity';
import { UserEntity } from './user.entity';

export enum BoardRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

@Entity('board_members')
@Unique('UQ_board_user', ['boardId', 'userId'])
@Index('IDX_board_member_board', ['boardId'])
@Index('IDX_board_member_user', ['userId'])
export class BoardMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  boardId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: BoardRole,
    default: BoardRole.MEMBER,
  })
  role!: BoardRole;

  @CreateDateColumn()
  joinedAt!: Date;

  // Relationships
  @ManyToOne(() => BoardEntity, (board) => board.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'boardId' })
  board!: BoardEntity;

  @ManyToOne(() => UserEntity, (user) => user.boardMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
