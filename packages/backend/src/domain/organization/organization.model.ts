/**
 * T176 [US4] Organization Domain Model
 * User Story 4: Team Organization and Access Control
 *
 * Represents an organization that contains boards and members.
 * Organizations provide workspace isolation and team collaboration.
 *
 * Domain Rules:
 * - Name must be between 1-100 characters
 * - Must have at least one owner
 * - Cannot be deleted if it has boards (archive instead)
 */

import { v4 as uuidv4 } from 'uuid';

export class Organization {
  private constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Factory method to create a new organization
   */
  static create(
    name: string,
    description: string | null,
    createdBy: string,
  ): Organization {
    const now = new Date();
    return new Organization(uuidv4(), name, description, createdBy, now, now);
  }

  /**
   * Factory method to reconstitute from persistence
   */
  static fromPersistence(
    id: string,
    name: string,
    description: string | null,
    createdBy: string,
    createdAt: Date,
    updatedAt: Date,
  ): Organization {
    return new Organization(
      id,
      name,
      description,
      createdBy,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Update organization details
   */
  updateDetails(name: string, description: string | null): void {
    this.name = name;
    this.description = description;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Validate organization invariants
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Organization name cannot be empty');
    }

    if (this.name.length > 100) {
      throw new Error('Organization name cannot exceed 100 characters');
    }

    if (this.description && this.description.length > 500) {
      throw new Error('Organization description cannot exceed 500 characters');
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
