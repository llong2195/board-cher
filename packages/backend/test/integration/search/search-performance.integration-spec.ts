/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SearchCardsQuery } from '../../../src/application/queries/search-cards/search-cards.query';
import { SearchCardsQueryHandler } from '../../../src/application/queries/search-cards/search-cards.query-handler';
import { BoardEntity } from '../../../src/infrastructure/persistence/entities/board.entity';
import { CardEntity } from '../../../src/infrastructure/persistence/entities/card.entity';
import { ListEntity } from '../../../src/infrastructure/persistence/entities/list.entity';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';
import { WorkspaceEntity } from '../../../src/infrastructure/persistence/entities/workspace.entity';
import { MembershipEntity } from '../../../src/infrastructure/persistence/entities/membership.entity';
import { Role } from '../../../src/domain/membership/role.enum';
import * as bcrypt from 'bcrypt';

describe('Search Performance Integration Test', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let queryHandler: SearchCardsQueryHandler;
  let testUser: UserEntity;
  let testBoard: BoardEntity;
  let testList: ListEntity;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            UserEntity,
            WorkspaceEntity,
            BoardEntity,
            ListEntity,
            CardEntity,
            MembershipEntity,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          UserEntity,
          WorkspaceEntity,
          BoardEntity,
          ListEntity,
          CardEntity,
          MembershipEntity,
        ]),
      ],
      providers: [SearchCardsQueryHandler],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    queryHandler = module.get<SearchCardsQueryHandler>(SearchCardsQueryHandler);

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await dataSource.getRepository(UserEntity).save({
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: hashedPassword,
    });

    // Create workspace and board
    const workspace = await dataSource.getRepository(WorkspaceEntity).save({
      name: 'Test Workspace',
      slug: 'test-workspace',
      ownerId: testUser.id,
    });

    await dataSource.getRepository(MembershipEntity).save({
      userId: testUser.id,
      workspaceId: workspace.id,
      role: Role.OWNER,
    });

    testBoard = await dataSource.getRepository(BoardEntity).save({
      name: 'Test Board',
      workspaceId: workspace.id,
      createdBy: testUser.id,
    });

    testList = await dataSource.getRepository(ListEntity).save({
      name: 'Test List',
      boardId: testBoard.id,
      position: 0,
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  describe('Performance Requirements', () => {
    it('should search through 10,000 cards in less than 2 seconds', async () => {
      // Arrange: Create 10,000 cards with varied content
      const batchSize = 1000;
      const totalCards = 10000;
      const keywords = [
        'feature',
        'bug',
        'refactor',
        'documentation',
        'test',
        'urgent',
        'backend',
        'frontend',
        'database',
        'api',
      ];

      console.log('Creating 10,000 test cards...');
      const startSetup = Date.now();

      for (let batch = 0; batch < totalCards / batchSize; batch++) {
        const cards: Partial<CardEntity>[] = [];
        for (let i = 0; i < batchSize; i++) {
          const cardNumber = batch * batchSize + i;
          const keyword = keywords[cardNumber % keywords.length];
          cards.push({
            title: `Card ${cardNumber}: ${keyword} implementation`,
            description: `This is a detailed description for ${keyword} card number ${cardNumber}. It contains multiple sentences and search terms.`,
            listId: testList.id,
            position: cardNumber,
            createdBy: testUser.id,
          });
        }
        await dataSource.getRepository(CardEntity).insert(cards);
      }

      const setupTime = Date.now() - startSetup;
      console.log(`Setup completed in ${setupTime}ms`);

      // Act: Perform search
      const searchTerm = 'feature';
      const startSearch = Date.now();

      const query = new SearchCardsQuery(
        testBoard.id,
        testUser.id,
        searchTerm,
        100,
        0,
      );
      const result = await queryHandler.execute(query);

      const searchTime = Date.now() - startSearch;

      // Assert: Performance requirement
      console.log(`Search completed in ${searchTime}ms`);
      expect(searchTime).toBeLessThan(2000); // Must complete in less than 2 seconds
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);

      // Verify result correctness
      result.data.forEach((card) => {
        const titleMatch = card.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = card.description
          ?.toLowerCase()
          .includes(searchTerm);
        expect(titleMatch || descriptionMatch).toBe(true);
      });
    });

    it('should handle pagination efficiently with large result sets', async () => {
      // Arrange: Database already has 10k cards from previous test
      const pageSize = 50;
      const searchTerm = 'bug';

      // Act: Search multiple pages
      const startPagination = Date.now();

      const page1 = await queryHandler.execute(
        new SearchCardsQuery(
          testBoard.id,
          testUser.id,
          searchTerm,
          pageSize,
          0,
        ),
      );
      const page2 = await queryHandler.execute(
        new SearchCardsQuery(
          testBoard.id,
          testUser.id,
          searchTerm,
          pageSize,
          pageSize,
        ),
      );
      const page3 = await queryHandler.execute(
        new SearchCardsQuery(
          testBoard.id,
          testUser.id,
          searchTerm,
          pageSize,
          pageSize * 2,
        ),
      );

      const paginationTime = Date.now() - startPagination;

      // Assert: All three page queries complete quickly
      console.log(`Pagination completed in ${paginationTime}ms`);
      expect(paginationTime).toBeLessThan(1000); // 3 queries in less than 1 second

      // Verify pagination correctness
      expect(page1.data.length).toBe(pageSize);
      expect(page2.data.length).toBe(pageSize);
      expect(page3.data.length).toBe(pageSize);

      // Verify no duplicate results across pages
      const allCardIds = [
        ...page1.data.map((c) => c.id),
        ...page2.data.map((c) => c.id),
        ...page3.data.map((c) => c.id),
      ];
      const uniqueCardIds = new Set(allCardIds);
      expect(uniqueCardIds.size).toBe(allCardIds.length);
    });

    it('should maintain performance with complex search terms', async () => {
      // Arrange: Multiple word search
      const searchTerms = [
        'feature implementation',
        'bug fix urgent',
        'refactor database',
      ];

      // Act & Assert: Each search completes quickly
      for (const searchTerm of searchTerms) {
        const startSearch = Date.now();

        const result = await queryHandler.execute(
          new SearchCardsQuery(testBoard.id, testUser.id, searchTerm, 20, 0),
        );

        const searchTime = Date.now() - startSearch;

        console.log(
          `Search for "${searchTerm}" completed in ${searchTime}ms (found ${result.data.length} results)`,
        );
        expect(searchTime).toBeLessThan(500); // Each search < 500ms
        expect(result.data.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle edge cases efficiently', async () => {
      // Test 1: Empty search term
      const startEmpty = Date.now();
      const emptyResult = await queryHandler.execute(
        new SearchCardsQuery(testBoard.id, testUser.id, '', 10, 0),
      );
      const emptyTime = Date.now() - startEmpty;

      expect(emptyTime).toBeLessThan(200);
      expect(emptyResult.data.length).toBe(10); // Should return first 10 cards

      // Test 2: No matches
      const startNoMatch = Date.now();
      const noMatchResult = await queryHandler.execute(
        new SearchCardsQuery(
          testBoard.id,
          testUser.id,
          'xyznonexistentterm999',
          10,
          0,
        ),
      );
      const noMatchTime = Date.now() - startNoMatch;

      expect(noMatchTime).toBeLessThan(200);
      expect(noMatchResult.data.length).toBe(0);
      expect(noMatchResult.total).toBe(0);

      // Test 3: Single character search
      const startSingleChar = Date.now();
      const singleCharResult = await queryHandler.execute(
        new SearchCardsQuery(testBoard.id, testUser.id, 'a', 10, 0),
      );
      const singleCharTime = Date.now() - startSingleChar;

      expect(singleCharTime).toBeLessThan(500);
      expect(singleCharResult.data.length).toBeGreaterThanOrEqual(0);

      console.log(`Edge case tests completed successfully`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks with repeated searches', async () => {
      // Arrange: Get initial memory baseline
      const initialMemory = process.memoryUsage().heapUsed;
      const iterations = 100;

      // Act: Perform 100 consecutive searches
      const startRepeat = Date.now();

      for (let i = 0; i < iterations; i++) {
        await queryHandler.execute(
          new SearchCardsQuery(testBoard.id, testUser.id, 'test', 10, i * 10),
        );
      }

      const repeatTime = Date.now() - startRepeat;
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Assert: Memory increase should be reasonable
      console.log(
        `100 searches completed in ${repeatTime}ms, memory increase: ${memoryIncrease.toFixed(2)}MB`,
      );
      expect(repeatTime).toBeLessThan(5000); // 100 searches in < 5 seconds
      expect(memoryIncrease).toBeLessThan(50); // Memory increase < 50MB
    });

    it('should handle concurrent searches efficiently', async () => {
      // Arrange: Prepare multiple concurrent search queries
      const concurrentSearches = 10;
      const searchPromises: Promise<any>[] = [];

      // Act: Execute 10 searches concurrently
      const startConcurrent = Date.now();

      for (let i = 0; i < concurrentSearches; i++) {
        const searchTerm = ['feature', 'bug', 'refactor'][i % 3];
        searchPromises.push(
          queryHandler.execute(
            new SearchCardsQuery(testBoard.id, testUser.id, searchTerm, 20, 0),
          ),
        );
      }

      const results = await Promise.all(searchPromises);
      const concurrentTime = Date.now() - startConcurrent;

      // Assert: Concurrent searches complete efficiently
      console.log(
        `${concurrentSearches} concurrent searches completed in ${concurrentTime}ms`,
      );
      expect(concurrentTime).toBeLessThan(3000); // All 10 searches in < 3 seconds
      expect(results.length).toBe(concurrentSearches);
      results.forEach((result) => {
        expect(result.data).toBeDefined();
        expect(result.total).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
