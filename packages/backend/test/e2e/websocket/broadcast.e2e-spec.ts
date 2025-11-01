import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../../src/app.module';

describe('Real-time Broadcast (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let validToken1: string;
  let validToken2: string;
  const mockUserId1 = 'user-123';
  const mockUserId2 = 'user-456';
  const mockBoardId = 'board-789';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);

    jwtService = moduleFixture.get<JwtService>(JwtService);

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
    await app.close();
  });

  afterEach(() => {
    if (clientSocket1 && clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
  });

  it('should broadcast card creation to all board members', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const mockCard = {
      id: 'card-123',
      title: 'New Card',
      listId: 'list-456',
    };

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        // User1 creates a card
        clientSocket1.emit('card:create', {
          boardId: mockBoardId,
          ...mockCard,
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

      // User2 should receive the broadcast
      clientSocket2.on('card:created', (data: any) => {
        expect(data.id).toBe(mockCard.id);
        expect(data.title).toBe(mockCard.title);
        expect(data.listId).toBe(mockCard.listId);
        expect(data.boardId).toBe(mockBoardId);
        done();
      });
    });
  }, 5000);

  it('should broadcast card movement to all board members', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const mockCardMove = {
      cardId: 'card-123',
      sourceListId: 'list-1',
      targetListId: 'list-2',
      position: 0,
    };

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        clientSocket1.emit('card:move', {
          boardId: mockBoardId,
          ...mockCardMove,
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

      clientSocket2.on('card:moved', (data: any) => {
        expect(data.cardId).toBe(mockCardMove.cardId);
        expect(data.targetListId).toBe(mockCardMove.targetListId);
        done();
      });
    });
  }, 5000);

  it('should broadcast list creation to all board members', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const mockList = {
      id: 'list-123',
      name: 'New List',
      position: 0,
    };

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        clientSocket1.emit('list:create', {
          boardId: mockBoardId,
          ...mockList,
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

      clientSocket2.on('list:created', (data: any) => {
        expect(data.id).toBe(mockList.id);
        expect(data.name).toBe(mockList.name);
        done();
      });
    });
  }, 5000);

  it('should not broadcast to users in different boards', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const board1 = 'board-1';
    const board2 = 'board-2';

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;
    let receivedUnwantedEvent = false;

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

  it('should broadcast card updates to all board members', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const mockCardUpdate = {
      cardId: 'card-123',
      title: 'Updated Title',
      description: 'Updated description',
    };

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        clientSocket1.emit('card:update', {
          boardId: mockBoardId,
          ...mockCardUpdate,
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

      clientSocket2.on('card:updated', (data: any) => {
        expect(data.cardId).toBe(mockCardUpdate.cardId);
        expect(data.title).toBe(mockCardUpdate.title);
        done();
      });
    });
  }, 5000);

  it('should include actor information in broadcasts', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
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

      clientSocket2.on('card:created', (data: any) => {
        expect(data.actor).toBeDefined();
        expect(data.actor.userId).toBe(mockUserId1);
        done();
      });
    });
  }, 5000);

  it('should handle high-frequency updates without message loss', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const messageCount = 10;
    const receivedMessages: any[] = [];

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    let joinCount = 0;

    const checkBothJoined = () => {
      joinCount++;
      if (joinCount === 2) {
        // Send multiple messages rapidly
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
  }, 10000);
});
