/**
 * T118 [US2] Attachment Upload E2E Tests
 *
 * Tests file upload/download/deletion for card attachments:
 * - Uploading files (multipart/form-data)
 * - File size validation (max 10MB)
 * - MIME type validation (images, PDFs, documents)
 * - Downloading attachments
 * - Deleting attachments
 * - Permission checks
 *
 * TDD Approach: These tests are written FIRST and will FAIL until the implementation is complete.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import * as path from 'path';
import * as fs from 'fs';

describe('AttachmentController (e2e) - T118', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;
  let boardId: string;
  let listId: string;
  let cardId: string;
  let attachmentId: string;

  // Test file paths
  const testFilesDir = path.join(__dirname, '..', '..', 'fixtures', 'files');
  const smallImagePath = path.join(testFilesDir, 'test-image.png');
  const largePdfPath = path.join(testFilesDir, 'large-file.pdf');
  const docPath = path.join(testFilesDir, 'test-document.docx');
  const invalidFilePath = path.join(testFilesDir, 'malicious.exe');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Create test files directory if it doesn't exist
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create a small test image (1KB PNG)
    if (!fs.existsSync(smallImagePath)) {
      const pngBuffer = Buffer.from(
        '89504e470d0a1a0a0000000d494844520000000100000001080200000090773864' +
          '0000000c49444154089963000001000001e0e0c3ce0000000049454e44ae426082',
        'hex',
      );
      fs.writeFileSync(smallImagePath, pngBuffer);
    }

    // Create a large file (>10MB) for size validation testing
    if (!fs.existsSync(largePdfPath)) {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB
      fs.writeFileSync(largePdfPath, largeBuffer);
    }

    // Create a small DOCX file
    if (!fs.existsSync(docPath)) {
      // Minimal DOCX structure (ZIP file)
      const docxBuffer = Buffer.from(
        '504b0304140000000800000000000000000000000000000000000000',
        'hex',
      );
      fs.writeFileSync(docPath, docxBuffer);
    }

    // Create an executable file (not allowed)
    if (!fs.existsSync(invalidFilePath)) {
      fs.writeFileSync(invalidFilePath, 'MZ'); // DOS executable header
    }
  });

  afterAll(async () => {
    // Cleanup test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
    await app.close();
  });

  beforeEach(async () => {
    // Setup: Create test user, board, list, and card
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'attachment-test@example.com',
        password: 'password123',
        name: 'Attachment Tester',
      })
      .expect(201);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Org',
        slug: 'test-org-attachments',
      })
      .expect(201);

    const organizationId = orgResponse.body.id;

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        organizationId,
        name: 'Attachment Test Board',
        description: 'For testing attachments',
      })
      .expect(201);

    boardId = boardResponse.body.id;

    // Create list
    const listResponse = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test List',
      })
      .expect(201);

    listId = listResponse.body.id;

    // Create card
    const cardResponse = await request(app.getHttpServer())
      .post(`/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Card for Attachments',
        description: 'This card will have attachments',
      })
      .expect(201);

    cardId = cardResponse.body.id;
  });

  describe('POST /cards/:cardId/attachments - Upload Attachment', () => {
    it('should upload an image file', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'Test Image')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.cardId).toBe(cardId);
      expect(response.body.userId).toBe(userId);
      expect(response.body.name).toBe('Test Image');
      expect(response.body.filename).toContain('test-image');
      expect(response.body.filename).toContain('.png');
      expect(response.body.mimeType).toBe('image/png');
      expect(response.body.size).toBeGreaterThan(0);
      expect(response.body.size).toBeLessThanOrEqual(10 * 1024 * 1024);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('createdAt');

      attachmentId = response.body.id;
    });

    it('should upload a PDF file', async () => {
      // Create a small PDF for this test
      const smallPdfPath = path.join(testFilesDir, 'small.pdf');
      fs.writeFileSync(smallPdfPath, '%PDF-1.0\n1 0 obj\n<<>>\nendobj\n%%EOF');

      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallPdfPath)
        .field('name', 'Test PDF')
        .expect(201);

      expect(response.body.mimeType).toMatch(
        /application\/pdf|application\/x-pdf/,
      );
      expect(response.body.name).toBe('Test PDF');

      fs.unlinkSync(smallPdfPath);
    });

    it('should upload a DOCX file', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', docPath)
        .field('name', 'Test Document')
        .expect(201);

      expect(response.body.mimeType).toMatch(
        /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/octet-stream/,
      );
      expect(response.body.name).toBe('Test Document');
    });

    it('should default to filename if name not provided', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .expect(201);

      expect(response.body.name).toContain('test-image');
    });

    it('should reject file larger than 10MB', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largePdfPath)
        .field('name', 'Too Large')
        .expect(400);
    });

    it('should reject disallowed file types (executables)', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', invalidFilePath)
        .field('name', 'Malicious File')
        .expect(400);
    });

    it('should require file field', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'No File')
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .attach('file', smallImagePath)
        .expect(401);
    });

    it('should require board access permission', async () => {
      // Create another user without board access
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-attachment-user@example.com',
          password: 'password123',
          name: 'Other User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${otherToken}`)
        .attach('file', smallImagePath)
        .expect(403);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .post('/cards/00000000-0000-0000-0000-000000000000/attachments')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .expect(404);
    });

    it('should handle multiple attachments on same card', async () => {
      // Upload first attachment
      const response1 = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'First Attachment')
        .expect(201);

      // Upload second attachment
      const response2 = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'Second Attachment')
        .expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);
      expect(response1.body.name).toBe('First Attachment');
      expect(response2.body.name).toBe('Second Attachment');
    });

    it('should sanitize filename to prevent path traversal', async () => {
      const maliciousPath = path.join(testFilesDir, '..\\..\\malicious.png');
      fs.writeFileSync(maliciousPath, 'fake');

      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousPath)
        .field('name', '../../../etc/passwd')
        .expect(201);

      // Filename should be sanitized
      expect(response.body.filename).not.toContain('..');
      expect(response.body.filename).not.toContain('/');
      expect(response.body.filename).not.toContain('\\');

      fs.unlinkSync(maliciousPath);
    });
  });

  describe('GET /cards/:cardId/attachments - List Attachments', () => {
    beforeEach(async () => {
      // Upload test attachments
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'First Attachment')
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'Second Attachment')
        .expect(201);
    });

    it('should retrieve all attachments for a card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Attachments should be ordered by createdAt (oldest first)
      const timestamps = response.body.map((a: any) =>
        new Date(a.createdAt).getTime(),
      );
      expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
    });

    it('should include uploader information', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const attachment = response.body[0];
      expect(attachment).toHaveProperty('user');
      expect(attachment.user).toHaveProperty('id');
      expect(attachment.user).toHaveProperty('name');
      expect(attachment.user).not.toHaveProperty('passwordHash');
    });

    it('should return empty array for card with no attachments', async () => {
      // Create a new card without attachments
      const newCardResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card without attachments',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${newCardResponse.body.id}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/cards/${cardId}/attachments`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'viewer-attachment@example.com',
          password: 'password123',
          name: 'Viewer',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .get(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('GET /attachments/:attachmentId/download - Download Attachment', () => {
    let testAttachmentId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'Download Test')
        .expect(201);

      testAttachmentId = response.body.id;
    });

    it('should download attachment file', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attachments/${testAttachmentId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('filename=');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/attachments/${testAttachmentId}/download`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'downloader@example.com',
          password: 'password123',
          name: 'Downloader',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .get(`/attachments/${testAttachmentId}/download`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent attachment', async () => {
      await request(app.getHttpServer())
        .get('/attachments/00000000-0000-0000-0000-000000000000/download')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /attachments/:attachmentId - Delete Attachment', () => {
    let testAttachmentId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'To Be Deleted')
        .expect(201);

      testAttachmentId = response.body.id;
    });

    it('should delete own attachment', async () => {
      await request(app.getHttpServer())
        .delete(`/attachments/${testAttachmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify attachment is deleted
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedAttachment = response.body.find(
        (a: any) => a.id === testAttachmentId,
      );
      expect(deletedAttachment).toBeUndefined();
    });

    it('should delete the file from storage', async () => {
      // Get attachment details
      const attachmentResponse = await request(app.getHttpServer())
        .get(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const attachment = attachmentResponse.body.find(
        (a: any) => a.id === testAttachmentId,
      );
      const filePath = attachment.filePath;

      // Delete attachment
      await request(app.getHttpServer())
        .delete(`/attachments/${testAttachmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // File should be deleted (if filePath is provided)
      if (filePath && fs.existsSync(filePath)) {
        fail('File should have been deleted from storage');
      }
    });

    it('should prevent non-uploader from deleting attachment', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-deleter-attachment@example.com',
          password: 'password123',
          name: 'Other Deleter',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      // Add other user to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: otherUserResponse.body.user.id,
          role: 'member',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/attachments/${testAttachmentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should allow board admin to delete any attachment', async () => {
      const adminResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin-attachment@example.com',
          password: 'password123',
          name: 'Admin',
        })
        .expect(201);

      const adminToken = adminResponse.body.accessToken;

      // Add admin to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: adminResponse.body.user.id,
          role: 'admin',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/attachments/${testAttachmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/attachments/${testAttachmentId}`)
        .expect(401);
    });

    it('should return 404 for non-existent attachment', async () => {
      await request(app.getHttpServer())
        .delete('/attachments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should be idempotent - deleting twice returns 404', async () => {
      // First delete
      await request(app.getHttpServer())
        .delete(`/attachments/${testAttachmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Second delete
      await request(app.getHttpServer())
        .delete(`/attachments/${testAttachmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Real-time Attachment Events (WebSocket)', () => {
    it('should emit attachment:added event when attachment uploaded', async () => {
      // TODO: This will need WebSocket test client
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallImagePath)
        .field('name', 'Real-time Attachment')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // WebSocket event should be emitted: card:attachment:added
    });
  });
});
