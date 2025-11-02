/**
 * T130 - User Story 2 Database Schema Migration
 *
 * Creates all tables for User Story 2 (Card Enrichment):
 * - comments
 * - attachments
 * - labels
 * - card_labels (many-to-many join table)
 * - checklists
 * - checklist_items
 *
 * Note: description and dueDate fields already exist in cards table from initial migration
 *
 * Includes all foreign keys, indexes, and constraints from the data model.
 */

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCardDetails1730505700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create comments table
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
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
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'isEdited',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comment_card',
        columnNames: ['cardId'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comment_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comment_created_at',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['cardId'],
        referencedTableName: 'cards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 2. Create attachments table
    await queryRunner.createTable(
      new Table({
        name: 'attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
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
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'size',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'storagePath',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_attachment_card',
        columnNames: ['cardId'],
      }),
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_attachment_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'attachments',
      new TableIndex({
        name: 'IDX_attachment_created_at',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createForeignKey(
      'attachments',
      new TableForeignKey({
        columnNames: ['cardId'],
        referencedTableName: 'cards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'attachments',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 3. Create labels table
    await queryRunner.createTable(
      new Table({
        name: 'labels',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'boardId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'labels',
      new TableIndex({
        name: 'IDX_label_board',
        columnNames: ['boardId'],
      }),
    );

    await queryRunner.createIndex(
      'labels',
      new TableIndex({
        name: 'UQ_label_board_name',
        columnNames: ['boardId', 'name'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'labels',
      new TableForeignKey({
        columnNames: ['boardId'],
        referencedTableName: 'boards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 4. Create card_labels join table (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: 'card_labels',
        columns: [
          {
            name: 'cardId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'labelId',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'card_labels',
      new TableIndex({
        name: 'IDX_card_labels_card',
        columnNames: ['cardId'],
      }),
    );

    await queryRunner.createIndex(
      'card_labels',
      new TableIndex({
        name: 'IDX_card_labels_label',
        columnNames: ['labelId'],
      }),
    );

    await queryRunner.createForeignKey(
      'card_labels',
      new TableForeignKey({
        columnNames: ['cardId'],
        referencedTableName: 'cards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'card_labels',
      new TableForeignKey({
        columnNames: ['labelId'],
        referencedTableName: 'labels',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 5. Create checklists table
    await queryRunner.createTable(
      new Table({
        name: 'checklists',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cardId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'checklists',
      new TableIndex({
        name: 'IDX_checklist_card',
        columnNames: ['cardId'],
      }),
    );

    await queryRunner.createIndex(
      'checklists',
      new TableIndex({
        name: 'IDX_checklist_card_position',
        columnNames: ['cardId', 'position'],
      }),
    );

    await queryRunner.createForeignKey(
      'checklists',
      new TableForeignKey({
        columnNames: ['cardId'],
        referencedTableName: 'cards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 6. Create checklist_items table
    await queryRunner.createTable(
      new Table({
        name: 'checklist_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'checklistId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'text',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'isCompleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'position',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'checklist_items',
      new TableIndex({
        name: 'IDX_checklist_item_checklist',
        columnNames: ['checklistId'],
      }),
    );

    await queryRunner.createIndex(
      'checklist_items',
      new TableIndex({
        name: 'IDX_checklist_item_checklist_position',
        columnNames: ['checklistId', 'position'],
      }),
    );

    await queryRunner.createForeignKey(
      'checklist_items',
      new TableForeignKey({
        columnNames: ['checklistId'],
        referencedTableName: 'checklists',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.dropTable('checklist_items', true);
    await queryRunner.dropTable('checklists', true);
    await queryRunner.dropTable('card_labels', true);
    await queryRunner.dropTable('labels', true);
    await queryRunner.dropTable('attachments', true);
    await queryRunner.dropTable('comments', true);
  }
}
