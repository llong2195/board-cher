/**
 * T070 - Initial Database Schema Migration
 *
 * Creates all tables for User Story 1 (Kanban Board CRUD):
 * - users
 * - organizations
 * - organization_members
 * - boards
 * - board_members
 * - lists
 * - cards
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

export class CreateBoardStructure1730505600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Create users table (required for foreign keys)
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_user_email',
        columnNames: ['email'],
      }),
    );

    // 1. Create organizations table
    await queryRunner.createTable(
      new Table({
        name: 'organizations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'logoUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
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
      'organizations',
      new TableIndex({
        name: 'IDX_organization_slug',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'organizations',
      new TableIndex({
        name: 'IDX_organization_created_at',
        columnNames: ['createdAt'],
      }),
    );

    // 2. Create organization_members table
    await queryRunner.createTable(
      new Table({
        name: 'organization_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['owner', 'admin', 'member'],
            default: "'member'",
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'organization_members',
      new TableIndex({
        name: 'UQ_organization_user',
        columnNames: ['organizationId', 'userId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'organization_members',
      new TableIndex({
        name: 'IDX_organization_member_org',
        columnNames: ['organizationId'],
      }),
    );

    await queryRunner.createIndex(
      'organization_members',
      new TableIndex({
        name: 'IDX_organization_member_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createForeignKey(
      'organization_members',
      new TableForeignKey({
        columnNames: ['organizationId'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'organization_members',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 3. Create boards table
    await queryRunner.createTable(
      new Table({
        name: 'boards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organizationId',
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
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'isArchived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdBy',
            type: 'uuid',
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
      'boards',
      new TableIndex({
        name: 'IDX_board_organization',
        columnNames: ['organizationId'],
      }),
    );

    await queryRunner.createIndex(
      'boards',
      new TableIndex({
        name: 'IDX_board_org_archived',
        columnNames: ['organizationId', 'isArchived'],
      }),
    );

    await queryRunner.createIndex(
      'boards',
      new TableIndex({
        name: 'IDX_board_created_by',
        columnNames: ['createdBy'],
      }),
    );

    await queryRunner.createIndex(
      'boards',
      new TableIndex({
        name: 'IDX_board_created_at',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createForeignKey(
      'boards',
      new TableForeignKey({
        columnNames: ['organizationId'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'boards',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // 4. Create board_members table
    await queryRunner.createTable(
      new Table({
        name: 'board_members',
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
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'member', 'guest'],
            default: "'member'",
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'board_members',
      new TableIndex({
        name: 'UQ_board_user',
        columnNames: ['boardId', 'userId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'board_members',
      new TableIndex({
        name: 'IDX_board_member_board',
        columnNames: ['boardId'],
      }),
    );

    await queryRunner.createIndex(
      'board_members',
      new TableIndex({
        name: 'IDX_board_member_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createForeignKey(
      'board_members',
      new TableForeignKey({
        columnNames: ['boardId'],
        referencedTableName: 'boards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'board_members',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 5. Create lists table
    await queryRunner.createTable(
      new Table({
        name: 'lists',
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
            length: '100',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'isArchived',
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
      'lists',
      new TableIndex({
        name: 'IDX_list_board',
        columnNames: ['boardId'],
      }),
    );

    await queryRunner.createIndex(
      'lists',
      new TableIndex({
        name: 'IDX_list_board_position',
        columnNames: ['boardId', 'position'],
      }),
    );

    await queryRunner.createIndex(
      'lists',
      new TableIndex({
        name: 'IDX_list_board_archived',
        columnNames: ['boardId', 'isArchived'],
      }),
    );

    await queryRunner.createForeignKey(
      'lists',
      new TableForeignKey({
        columnNames: ['boardId'],
        referencedTableName: 'boards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 6. Create cards table
    await queryRunner.createTable(
      new Table({
        name: 'cards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'listId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'dueDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isArchived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdBy',
            type: 'uuid',
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
      'cards',
      new TableIndex({
        name: 'IDX_card_list',
        columnNames: ['listId'],
      }),
    );

    await queryRunner.createIndex(
      'cards',
      new TableIndex({
        name: 'IDX_card_list_position',
        columnNames: ['listId', 'position'],
      }),
    );

    await queryRunner.createIndex(
      'cards',
      new TableIndex({
        name: 'IDX_card_list_archived',
        columnNames: ['listId', 'isArchived'],
      }),
    );

    await queryRunner.createIndex(
      'cards',
      new TableIndex({
        name: 'IDX_card_created_by',
        columnNames: ['createdBy'],
      }),
    );

    await queryRunner.createIndex(
      'cards',
      new TableIndex({
        name: 'IDX_card_due_date',
        columnNames: ['dueDate'],
      }),
    );

    await queryRunner.createIndex(
      'cards',
      new TableIndex({
        name: 'IDX_card_updated_at',
        columnNames: ['updatedAt'],
      }),
    );

    await queryRunner.createForeignKey(
      'cards',
      new TableForeignKey({
        columnNames: ['listId'],
        referencedTableName: 'lists',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cards',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.dropTable('cards', true);
    await queryRunner.dropTable('lists', true);
    await queryRunner.dropTable('board_members', true);
    await queryRunner.dropTable('boards', true);
    await queryRunner.dropTable('organization_members', true);
    await queryRunner.dropTable('organizations', true);
    await queryRunner.dropTable('users', true);
  }
}
