import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Board Room Management (e2e)', () => {
  let app: INestApplication<App>;
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
      imports: [
        AppModule,
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
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

  it('should allow user to join a board room', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        (response: any) => {
          expect(response.success).toBe(true);
          expect(response.boardId).toBe(mockBoardId);
          done();
        },
      );
    });

    clientSocket1.on('error', (error: any) => {
      done(error);
    });
  });

  it('should notify existing users when new user joins board', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    let user1Joined = false;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit('board:join', { boardId: mockBoardId }, () => {
        user1Joined = true;
      });

      clientSocket1.on('board:user:joined', (data: any) => {
        expect(data.userId).toBe(mockUserId2);
        expect(data.boardId).toBe(mockBoardId);
        done();
      });
    });

    clientSocket2.on('connect', () => {
      if (user1Joined) {
        clientSocket2.emit('board:join', { boardId: mockBoardId });
      } else {
        setTimeout(() => {
          clientSocket2.emit('board:join', { boardId: mockBoardId });
        }, 500);
      }
    });
  }, 5000);

  it('should provide list of active members when joining board', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        (response: any) => {
          expect(response.success).toBe(true);
          expect(Array.isArray(response.activeMembers)).toBe(true);
          expect(response.activeMembers).toContain(mockUserId1);
          done();
        },
      );
    });
  });

  it('should handle user leaving board room', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit('board:join', { boardId: mockBoardId });

      clientSocket1.on('board:user:left', (data: any) => {
        expect(data.userId).toBe(mockUserId2);
        expect(data.boardId).toBe(mockBoardId);
        done();
      });
    });

    clientSocket2.on('connect', () => {
      setTimeout(() => {
        clientSocket2.emit('board:join', { boardId: mockBoardId }, () => {
          clientSocket2.emit('board:leave', { boardId: mockBoardId });
        });
      }, 500);
    });
  }, 5000);

  it('should reject joining board without permission', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const unauthorizedBoardId = 'unauthorized-board';

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: unauthorizedBoardId },
        (response: any) => {
          expect(response.success).toBe(false);
          expect(response.error).toBeDefined();
          done();
        },
      );
    });
  });

  it('should automatically leave room on disconnection', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket2 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken2}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit('board:join', { boardId: mockBoardId });

      clientSocket1.on('board:user:left', (data: any) => {
        expect(data.userId).toBe(mockUserId2);
        done();
      });
    });

    clientSocket2.on('connect', () => {
      setTimeout(() => {
        clientSocket2.emit('board:join', { boardId: mockBoardId }, () => {
          clientSocket2.disconnect();
        });
      }, 500);
    });
  }, 5000);

  it('should allow user to join multiple board rooms', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;
    const board1 = 'board-1';
    const board2 = 'board-2';
    let joinedCount = 0;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit('board:join', { boardId: board1 }, (response: any) => {
        expect(response.success).toBe(true);
        joinedCount++;

        if (joinedCount === 2) {
          done();
        }
      });

      clientSocket1.emit('board:join', { boardId: board2 }, (response: any) => {
        expect(response.success).toBe(true);
        joinedCount++;

        if (joinedCount === 2) {
          done();
        }
      });
    });
  });

  it('should not allow joining same board room twice', (done) => {
    const port = (app.getHttpServer().address() as import('net').AddressInfo)
      .port;

    clientSocket1 = io(`http://localhost:${port}`, {
      auth: { token: `Bearer ${validToken1}` },
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit(
        'board:join',
        { boardId: mockBoardId },
        (response1: any) => {
          expect(response1.success).toBe(true);

          clientSocket1.emit(
            'board:join',
            { boardId: mockBoardId },
            (response2: any) => {
              expect(response2.success).toBe(false);
              expect(response2.error).toContain('already');
              done();
            },
          );
        },
      );
    });
  });
});
