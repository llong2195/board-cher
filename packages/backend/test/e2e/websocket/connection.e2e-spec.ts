import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('WebSocket Connection (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let clientSocket: Socket;
  let validToken: string;
  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0); // Random port

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate valid JWT token for testing
    validToken = jwtService.sign({
      sub: mockUserId,
      email: mockUserEmail,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('should establish WebSocket connection with valid JWT token', (done) => {
    const port = (app.getHttpServer().address() as any).port;

    clientSocket = io(`http://localhost:${port}`, {
      auth: {
        token: `Bearer ${validToken}`,
      },
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on('connect_error', (error) => {
      done(error);
    });
  });

  it('should reject connection without authentication token', (done) => {
    const port = (app.getHttpServer().address() as any).port;

    clientSocket = io(`http://localhost:${port}`, {
      auth: {},
    });

    clientSocket.on('connect', () => {
      done(new Error('Should not connect without token'));
    });

    clientSocket.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication');
      done();
    });
  });

  it('should reject connection with invalid JWT token', (done) => {
    const port = (app.getHttpServer().address() as any).port;

    clientSocket = io(`http://localhost:${port}`, {
      auth: {
        token: 'Bearer invalid-token',
      },
    });

    clientSocket.on('connect', () => {
      done(new Error('Should not connect with invalid token'));
    });

    clientSocket.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication');
      done();
    });
  });

  it('should reject connection with malformed token', (done) => {
    const port = (app.getHttpServer().address() as any).port;

    clientSocket = io(`http://localhost:${port}`, {
      auth: {
        token: 'invalid-format',
      },
    });

    clientSocket.on('connect', () => {
      done(new Error('Should not connect with malformed token'));
    });

    clientSocket.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication');
      done();
    });
  });

  it('should maintain connection with heartbeat', (done) => {
    const port = (app.getHttpServer().address() as any).port;

    clientSocket = io(`http://localhost:${port}`, {
      auth: {
        token: `Bearer ${validToken}`,
      },
    });

    clientSocket.on('connect', () => {
      // Wait for 5 seconds to test heartbeat
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 5000);
    });

    clientSocket.on('disconnect', (reason) => {
      done(new Error(`Unexpected disconnect: ${reason}`));
    });
  }, 10000);

  it('should reconnect after temporary disconnection', (done) => {
    const port = (app.getHttpServer().address() as any).port;
    let disconnectCount = 0;
    let reconnectCount = 0;

    clientSocket = io(`http://localhost:${port}`, {
      auth: {
        token: `Bearer ${validToken}`,
      },
      reconnection: true,
      reconnectionDelay: 100,
    });

    clientSocket.on('connect', () => {
      if (reconnectCount === 0) {
        // First connection - force disconnect
        clientSocket.disconnect();
        setTimeout(() => {
          clientSocket.connect();
        }, 200);
      } else {
        // Reconnected successfully
        expect(reconnectCount).toBe(1);
        done();
      }
      reconnectCount++;
    });

    clientSocket.on('disconnect', () => {
      disconnectCount++;
    });
  }, 5000);

  it('should extract user information from JWT token', (done) => {
    const port = (app.getHttpServer().address() as any).port;

    clientSocket = io(`http://localhost:${port}`, {
      auth: {
        token: `Bearer ${validToken}`,
      },
    });

    clientSocket.on('connect', () => {
      // Emit event that requires authenticated user
      clientSocket.emit('ping', {}, (response: any) => {
        expect(response).toBeDefined();
        done();
      });
    });

    clientSocket.on('connect_error', (error) => {
      done(error);
    });
  });
});
