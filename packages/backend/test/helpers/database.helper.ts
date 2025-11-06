import { DataSource, EntityManager, QueryRunner } from 'typeorm';

/**
 * Database helper for managing test database transactions.
 *
 * This helper provides utilities for isolating database tests using transactions
 * that are rolled back after each test, ensuring test independence and fast execution.
 *
 * @example
 * ```typescript
 * describe('BoardRepository', () => {
 *   let helper: DatabaseHelper;
 *   let manager: EntityManager;
 *
 *   beforeAll(async () => {
 *     helper = new DatabaseHelper(dataSource);
 *     await helper.connect();
 *   });
 *
 *   beforeEach(async () => {
 *     manager = await helper.startTransaction();
 *   });
 *
 *   afterEach(async () => {
 *     await helper.rollbackTransaction();
 *   });
 *
 *   afterAll(async () => {
 *     await helper.disconnect();
 *   });
 *
 *   it('should save board', async () => {
 *     const board = manager.create(Board, { title: 'Test' });
 *     await manager.save(board);
 *     // ... assertions
 *   });
 * });
 * ```
 */
export class DatabaseHelper {
  private queryRunner: QueryRunner | null = null;

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Connects to the database (if not already connected).
   */
  async connect(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

  /**
   * Disconnects from the database.
   */
  async disconnect(): Promise<void> {
    if (this.queryRunner) {
      await this.rollbackTransaction();
    }
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  /**
   * Starts a new database transaction.
   *
   * @returns EntityManager for the transaction
   */
  async startTransaction(): Promise<EntityManager> {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    return this.queryRunner.manager;
  }

  /**
   * Rolls back the current transaction.
   *
   * This should be called in afterEach() to clean up test data.
   */
  async rollbackTransaction(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.rollbackTransaction();
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  /**
   * Commits the current transaction.
   *
   * Only use this if you need to persist test data across tests.
   * Generally, prefer rollbackTransaction() for test isolation.
   */
  async commitTransaction(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.commitTransaction();
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  /**
   * Clears all data from specified tables.
   *
   * Use with caution - this permanently deletes data.
   *
   * @param tableNames - Array of table names to truncate
   */
  async clearTables(tableNames: string[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      for (const tableName of tableNames) {
        await queryRunner.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Gets the current EntityManager (within or outside transaction).
   */
  getManager(): EntityManager {
    if (this.queryRunner) {
      return this.queryRunner.manager;
    }
    return this.dataSource.manager;
  }
}
