/**
 * T206 - Migration: Create Card Assignment
 * User Story 6: Card Assignment and Notifications
 *
 * Creates card_assignments table for many-to-many relationship between cards and users
 * Tracks who assigned whom and when
 */

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCardAssignment1730505800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create card_assignments table
    await queryRunner.createTable(
      new Table({
        name: 'card_assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cardId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'assignedBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'assignedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create composite unique index - can't assign same user twice to same card
    await queryRunner.createIndex(
      'card_assignments',
      new TableIndex({
        name: 'IDX_card_assignment_unique',
        columnNames: ['cardId', 'userId'],
        isUnique: true,
      }),
    );

    // Create index for looking up card's assignees
    await queryRunner.createIndex(
      'card_assignments',
      new TableIndex({
        name: 'IDX_card_assignment_card',
        columnNames: ['cardId'],
      }),
    );

    // Create index for looking up user's assigned cards ("assigned to me" view)
    await queryRunner.createIndex(
      'card_assignments',
      new TableIndex({
        name: 'IDX_card_assignment_user',
        columnNames: ['userId'],
      }),
    );

    // Create index for ordering by assignment date
    await queryRunner.createIndex(
      'card_assignments',
      new TableIndex({
        name: 'IDX_card_assignment_date',
        columnNames: ['assignedAt'],
      }),
    );

    // Add foreign key to cards table
    await queryRunner.createForeignKey(
      'card_assignments',
      new TableForeignKey({
        columnNames: ['cardId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cards',
        onDelete: 'CASCADE', // Delete assignments when card deleted
        name: 'FK_card_assignment_card',
      }),
    );

    // Add foreign key to users table (assignee)
    await queryRunner.createForeignKey(
      'card_assignments',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE', // Delete assignments when user deleted
        name: 'FK_card_assignment_user',
      }),
    );

    // Add foreign key to users table (who performed the assignment)
    await queryRunner.createForeignKey(
      'card_assignments',
      new TableForeignKey({
        columnNames: ['assignedBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE', // Delete if assigner user deleted
        name: 'FK_card_assignment_assigner',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'card_assignments',
      'FK_card_assignment_assigner',
    );
    await queryRunner.dropForeignKey(
      'card_assignments',
      'FK_card_assignment_user',
    );
    await queryRunner.dropForeignKey(
      'card_assignments',
      'FK_card_assignment_card',
    );

    // Drop indexes
    await queryRunner.dropIndex('card_assignments', 'IDX_card_assignment_date');
    await queryRunner.dropIndex('card_assignments', 'IDX_card_assignment_user');
    await queryRunner.dropIndex('card_assignments', 'IDX_card_assignment_card');
    await queryRunner.dropIndex(
      'card_assignments',
      'IDX_card_assignment_unique',
    );

    // Drop table
    await queryRunner.dropTable('card_assignments');
  }
}
