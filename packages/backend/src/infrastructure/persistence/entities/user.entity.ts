import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';

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

  // Relationships will be added as we implement other entities
  // @OneToMany(() => OrganizationMemberEntity, member => member.user)
  // organizationMembers: OrganizationMemberEntity[];

  // @OneToMany(() => BoardMemberEntity, member => member.user)
  // boardMembers: BoardMemberEntity[];

  // @OneToMany(() => CommentEntity, comment => comment.user)
  // comments: CommentEntity[];

  // @OneToMany(() => ActivityEntity, activity => activity.user)
  // activities: ActivityEntity[];
}
