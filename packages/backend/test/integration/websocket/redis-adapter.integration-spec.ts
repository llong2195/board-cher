import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

describe('Redis Adapter Scaling (integration)', () => {
  let app1: INestApplication;
  let app2: INestApplication;
  let jwtService: JwtService;
  let redisClient: Redis;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let validToken1: string;
  let validToken2: string;
  const mockUserId1 = 'user-123';
  const mockUserId2 = 'user-456';
  const mockBoardId = 'board-789';

  beforeAll(async () => {
    // Create first server instance
    const moduleFixture1: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app1 = moduleFixture1.createNestApplication();
    await app1.listen(0);

    // Create second server instance (simulating horizontal scaling)
    const moduleFixture2: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app2 = moduleFixture2.createNestApplication();
    await app2.listen(0);

    jwtService = moduleFixture1.get<JwtService>(JwtService);

    // Setup Redis client for testing
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    validToken1 = jwtService.sign({
      sub: mockUserId1,
      email: 'user1@example.com',
    });

    validToken2 = jwtService.sign({
      sub: mockUserId2,
      email: 'user2@example.com',
    });
  });

  afterAll(async () => {
    await app1.close();
    await app2.close();
    await redisClient.quit();
  });

  afterEach(() => {
    if (clientSocket1 && clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
  });

  it('should propagate events across multiple server instances', (done) => {
    const port1 = (app1.getHttpServer().address() as any).port;
    const port2 = (app2.getHttpServer().address() as any).port;

    // Client 1 connects to Server 1
    clientSocket1 = io(`http://localhost:${port1}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    // Client 2 connects to Server 2
    clientSocket2 = io(`http://localhost:${port2}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        // User 1 (on Server 1) creates a card
        clientSocket1.emit('card:create', {
          boardId: mockBoardId,
          id: 'card-123',
          title: 'New Card',
        });
      }
    };

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );

      // User 2 (on Server 2) should receive event from User 1 (on Server 1)
      clientSocket2.on('card:created', (data: any) => {
        expect(data.id).toBe('card-123');
        expect(data.title).toBe('New Card');
        done();
      });
    });
  }, 10000);

  it('should handle multiple server instances joining and leaving', (done) => {
    const port1 = (app1.getHttpServer().address() as any).port;
    const port2 = (app2.getHttpServer().address() as any).port;

    clientSocket1 = io(`http://localhost:${port1}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port2}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        // Wait a bit then check if both are still connected
        setTimeout(() => {
          expect(clientSocket1.connected).toBe(true);
          expect(clientSocket2.connected).toBe(true);
          done();
        }, 1000);
      }
    };

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );
    });
  }, 5000);

  it('should broadcast to correct rooms across instances', (done) => {
    const port1 = (app1.getHttpServer().address() as any).port;
    const port2 = (app2.getHttpServer().address() as any).port;
    const board1 = 'board-1';
    const board2 = 'board-2';
    let receivedUnwantedEvent = false;

    clientSocket1 = io(`http://localhost:${port1}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port2}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        setTimeout(() => {
          clientSocket1.emit('card:create', {
            boardId: board1,
            id: 'card-123',
            title: 'Card in Board 1',
          });
        }, 100);

        setTimeout(() => {
          expect(receivedUnwantedEvent).toBe(false);
          done();
        }, 1000);
      }
    };

    clientSocket1.on('connect', () => {
      clientSocket1.emit('board:join', { boardId: board1 }, checkBothJoined);
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit('board:join', { boardId: board2 }, checkBothJoined);

      clientSocket2.on('card:created', () => {
        receivedUnwantedEvent = true;
      });
    });
  }, 5000);

  it('should verify Redis pub/sub channels are created', async () => {
    const channels = await redisClient.pubsub('channels', 'socket.io-*');
    expect(channels.length).toBeGreaterThan(0);
  });

  it('should handle high load across multiple instances', (done) => {
    const port1 = (app1.getHttpServer().address() as any).port;
    const port2 = (app2.getHttpServer().address() as any).port;
    const messageCount = 50;
    const receivedMessages: any[] = [];

    clientSocket1 = io(`http://localhost:${port1}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port2}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        // Rapidly send messages from server 1
        for (let i = 0; i < messageCount; i++) {
          clientSocket1.emit('card:update', {
            boardId: mockBoardId,
            cardId: 'card-123',
            updateNumber: i,
          });
        }
      }
    };

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );

      clientSocket2.on('card:updated', (data: any) => {
        receivedMessages.push(data);

        if (receivedMessages.length === messageCount) {
          expect(receivedMessages).toHaveLength(messageCount);
          done();
        }
      });
    });
  }, 15000);

  it('should maintain room state across instance failures', (done) => {
    const port1 = (app1.getHttpServer().address() as any).port;
    const port2 = (app2.getHttpServer().address() as any).port;

    clientSocket1 = io(`http://localhost:${port1}`, {
      auth: { token: `Bearer ${validToken1}` },
      reconnection: true,
      reconnectionDelay: 100,
    });

    clientSocket2 = io(`http://localhost:${port2}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;
    let reconnected = false;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2 && !reconnected) {
        // Simulate instance failure by disconnecting client 1
        clientSocket1.disconnect();
        setTimeout(() => {
          clientSocket1.connect();
          reconnected = true;
        }, 500);
      } else if (reconnected) {
        // After reconnection, verify communication still works
        clientSocket1.emit('card:create', {
          boardId: mockBoardId,
          id: 'card-after-reconnect',
          title: 'Card after reconnect',
        });
      }
    };

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );

      clientSocket2.on('card:created', (data: any) => {
        if (data.id === 'card-after-reconnect') {
          expect(data.title).toBe('Card after reconnect');
          done();
        }
      });
    });
  }, 10000);

  it('should handle concurrent updates from multiple instances', (done) => {
    const port1 = (app1.getHttpServer().address() as any).port;
    const port2 = (app2.getHttpServer().address() as any).port;
    const receivedMessages1: any[] = [];
    const receivedMessages2: any[] = [];

    clientSocket1 = io(`http://localhost:${port1}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port2}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        // Both clients send updates simultaneously
        clientSocket1.emit('card:update', {
          boardId: mockBoardId,
          cardId: 'card-1',
          source: 'client1',
        });

        clientSocket2.emit('card:update', {
          boardId: mockBoardId,
          cardId: 'card-2',
          source: 'client2',
        });
      }
    };

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );

      clientSocket1.on('card:updated', (data: any) => {
        receivedMessages1.push(data);
        if (receivedMessages1.length === 2 && receivedMessages2.length === 2) {
          // Both clients should receive both updates
          expect(receivedMessages1).toHaveLength(2);
          expect(receivedMessages2).toHaveLength(2);
          done();
        }
      });
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit(
        'board:join',
        { boardId: mockBoardId },
        checkBothJoined,
      );

      clientSocket2.on('card:updated', (data: any) => {
        receivedMessages2.push(data);
        if (receivedMessages1.length === 2 && receivedMessages2.length === 2) {
          done();
        }
      });
    });
  }, 10000);
});
