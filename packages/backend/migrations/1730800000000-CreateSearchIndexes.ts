import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSearchIndexes1730800000000 implements MigrationInterface {
  name = 'CreateSearchIndexes1730800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL: Create full-text search indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_title_search" 
      ON "cards" USING GIN (to_tsvector('english', "title"))
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_description_search" 
      ON "cards" USING GIN (to_tsvector('english', COALESCE("description", '')))
    `);

    // Composite index for title + description search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_combined_search" 
      ON "cards" USING GIN (
        to_tsvector('english', "title" || ' ' || COALESCE("description", ''))
      )
    `);

    // Standard B-tree indexes for LIKE queries (fallback for SQLite)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_title_text" 
      ON "cards" ("title")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_card_description_text" 
      ON "cards" ("description")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_combined_search"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_card_description_search"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_title_search"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_description_text"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_card_title_text"`);
  }
}
