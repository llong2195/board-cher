/**
 * T187 [US4] OrganizationRepository Implementation (TypeORM)
 * User Story 4: Team Organization and Access Control
 *
 * Concrete implementation of OrganizationRepository using TypeORM.
 * Maps between domain models and TypeORM entities.
 *
 * Note: Domain models include createdBy/invitedBy fields that don't exist
 * in current DB schema. Using empty string as default until schema updated.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationRepository } from '../../../domain/organization/organization.repository';
import { Organization } from '../../../domain/organization/organization.model';
import {
  OrganizationMember,
  OrganizationRole,
} from '../../../domain/organization/organization-member.model';
import { OrganizationEntity } from '../entities/organization.entity';
import { OrganizationMemberEntity } from '../entities/organization-member.entity';

@Injectable()
export class OrganizationRepositoryImpl implements OrganizationRepository {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private readonly memberRepository: Repository<OrganizationMemberEntity>,
  ) {}

  async save(organization: Organization): Promise<Organization> {
    const entity = this.organizationToEntity(organization);
    const saved = await this.organizationRepository.save(entity);
    return this.entityToOrganization(saved);
  }

  async findById(id: string): Promise<Organization | null> {
    const entity = await this.organizationRepository.findOne({
      where: { id },
    });
    return entity ? this.entityToOrganization(entity) : null;
  }

  async findByUserId(userId: string): Promise<Organization[]> {
    const memberEntities = await this.memberRepository.find({
      where: { userId },
      relations: ['organization'],
    });

    return memberEntities.map((member) =>
      this.entityToOrganization(member.organization),
    );
  }

  async delete(id: string): Promise<void> {
    await this.organizationRepository.delete(id);
  }

  async addMember(member: OrganizationMember): Promise<OrganizationMember> {
    const entity = this.memberToEntity(member);
    const saved = await this.memberRepository.save(entity);
    return this.entityToMember(saved);
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    await this.memberRepository.delete({
      organizationId,
      userId,
    });
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<void> {
    await this.memberRepository.update(
      { organizationId, userId },
      { role: role as any }, // TypeORM enum type
    );
  }

  async findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const entity = await this.memberRepository.findOne({
      where: { organizationId, userId },
    });
    return entity ? this.entityToMember(entity) : null;
  }

  async findMembers(organizationId: string): Promise<OrganizationMember[]> {
    const entities = await this.memberRepository.find({
      where: { organizationId },
      order: { joinedAt: 'ASC' },
    });
    return entities.map((entity) => this.entityToMember(entity));
  }

  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepository.count({
      where: { organizationId, userId },
    });
    return count > 0;
  }

  /**
   * Convert Organization domain model to entity
   */
  private organizationToEntity(org: Organization): OrganizationEntity {
    const entity = new OrganizationEntity();
    entity.id = org.id;
    entity.name = org.name;
    entity.description = org.description;
    // Generate slug from name (simple implementation)
    entity.slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    entity.logoUrl = null;
    entity.createdAt = org.createdAt;
    entity.updatedAt = org.updatedAt;
    return entity;
  }

  /**
   * Convert OrganizationEntity to domain model
   * Note: createdBy field doesn't exist in entity, using empty string
   */
  private entityToOrganization(entity: OrganizationEntity): Organization {
    return Organization.fromPersistence(
      entity.id,
      entity.name,
      entity.description,
      '', // createdBy not in schema
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert OrganizationMember domain model to entity
   */
  private memberToEntity(member: OrganizationMember): OrganizationMemberEntity {
    const entity = new OrganizationMemberEntity();
    entity.id = member.id;
    entity.organizationId = member.organizationId;
    entity.userId = member.userId;
    entity.role = member.role as any; // TypeORM enum type
    entity.joinedAt = member.joinedAt;
    return entity;
  }

  /**
   * Convert OrganizationMemberEntity to domain model
   * Note: invitedBy and updatedAt fields don't exist in entity
   */
  private entityToMember(entity: OrganizationMemberEntity): OrganizationMember {
    return OrganizationMember.fromPersistence(
      entity.id,
      entity.organizationId,
      entity.userId,
      entity.role as OrganizationRole,
      '', // invitedBy not in schema
      entity.joinedAt,
      entity.joinedAt, // using joinedAt as updatedAt fallback
    );
  }
}
