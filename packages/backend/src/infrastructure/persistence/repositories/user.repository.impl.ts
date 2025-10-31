import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../../domain/user/user.repository';
import { User } from '../../../domain/user/user.model';
import { UserEntity } from '../entities/user.entity';

/**
 * TypeORM implementation of UserRepository
 */
@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.userRepository.save(entity);
    return this.toDomain(saved);
  }

  async update(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const updated = await this.userRepository.save(entity);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
  }

  /**
   * Convert domain model to entity
   */
  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.passwordHash = user.passwordHash;
    entity.name = user.name;
    entity.avatarUrl = user.avatarUrl || undefined;
    entity.lastLoginAt = user.lastLoginAt || undefined;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }

  /**
   * Convert entity to domain model
   */
  private toDomain(entity: UserEntity): User {
    return User.fromPersistence({
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      name: entity.name,
      avatarUrl: entity.avatarUrl || null,
      lastLoginAt: entity.lastLoginAt || null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
