import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilterIndexes1730800100000 implements MigrationInterface {
  name = 'CreateFilterIndexes1730800100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for label filtering on join table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_labels_labelId" 
      ON "card_labels" ("labelId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_labels_cardId" 
      ON "card_labels" ("cardId")
    `);

    // Composite index for efficient label + card lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_labels_composite" 
      ON "card_labels" ("labelId", "cardId")
    `);

    // Index for assignee filtering on assignments table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_assignments_userId" 
      ON "card_assignments" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_assignments_cardId" 
      ON "card_assignments" ("cardId")
    `);

    // Composite index for efficient assignee + card lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_assignments_composite" 
      ON "card_assignments" ("userId", "cardId")
    `);

    // Index for due date filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_dueDate" 
      ON "cards" ("dueDate")
    `);

    // Composite index for due date + archived filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_dueDate_archived" 
      ON "cards" ("dueDate", "archivedAt")
    `);

    // Index for combined filtering with list (board) + archived + dueDate
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_listId_archived_dueDate" 
      ON "cards" ("listId", "archivedAt", "dueDate")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_card_listId_archived_dueDate"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_dueDate_archived"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_dueDate"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_card_assignments_composite"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_card_assignments_cardId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_card_assignments_userId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_labels_composite"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_labels_cardId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_labels_labelId"`);
  }
}
