import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T248 - Create Activity Table Migration
 *
 * Creates the activities table for audit log functionality.
 * This table stores all actions performed in the system for activity feeds.
 *
 * Indexes:
 * - (boardId, createdAt) for board activity feed queries
 * - (cardId, createdAt) for card activity feed queries
 * - (userId) for user action history
 * - (entityType, entityId, createdAt) for entity-specific activity queries
 * - (createdAt) for recent activity queries
 */
export class CreateActivity1730900000000 implements MigrationInterface {
  name = 'CreateActivity1730900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create activities table
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "boardId" uuid,
        "cardId" uuid,
        "actionType" character varying(100) NOT NULL,
        "entityType" character varying(50) NOT NULL,
        "entityId" uuid NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD CONSTRAINT "FK_activities_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD CONSTRAINT "FK_activities_boardId"
      FOREIGN KEY ("boardId") REFERENCES "boards"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD CONSTRAINT "FK_activities_cardId"
      FOREIGN KEY ("cardId") REFERENCES "cards"("id")
      ON DELETE CASCADE
    `);

    // Create indexes for efficient queries
    await queryRunner.query(`
      CREATE INDEX "IDX_activity_board_created"
      ON "activities" ("boardId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_card_created"
      ON "activities" ("cardId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_user"
      ON "activities" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_entity"
      ON "activities" ("entityType", "entityId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_created_at"
      ON "activities" ("createdAt" DESC)
    `);

    // Add check constraint to ensure either boardId or cardId exists
    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD CONSTRAINT "CHK_activities_board_or_card"
      CHECK ("boardId" IS NOT NULL OR "cardId" IS NOT NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraint
    await queryRunner.query(`
      ALTER TABLE "activities"
      DROP CONSTRAINT IF EXISTS "CHK_activities_board_or_card"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_card_created"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_activity_board_created"`,
    );

    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "activities"
      DROP CONSTRAINT IF EXISTS "FK_activities_cardId"
    `);

    await queryRunner.query(`
      ALTER TABLE "activities"
      DROP CONSTRAINT IF EXISTS "FK_activities_boardId"
    `);

    await queryRunner.query(`
      ALTER TABLE "activities"
      DROP CONSTRAINT IF EXISTS "FK_activities_userId"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "activities"`);
  }
}
