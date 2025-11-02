import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { OrganizationMemberEntity } from './organization-member.entity';
import { BoardMemberEntity } from './board-member.entity';

/**
 * User entity representing an authenticated person using the application
 * @aggregate-root Yes
 */
@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true, length: 255 })
  @Index()
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'avatar_url', nullable: true, length: 500 })
  avatarUrl?: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  // Relationships
  @OneToMany(() => OrganizationMemberEntity, (member) => member.user)
  organizationMemberships!: OrganizationMemberEntity[];

  @OneToMany(() => BoardMemberEntity, (member) => member.user)
  boardMemberships!: BoardMemberEntity[];

  // Future relationships (User Story 2+):
  // @OneToMany(() => CommentEntity, comment => comment.user)
  // comments: CommentEntity[];

  // @OneToMany(() => ActivityEntity, activity => activity.user)
  // activities: ActivityEntity[];
}
