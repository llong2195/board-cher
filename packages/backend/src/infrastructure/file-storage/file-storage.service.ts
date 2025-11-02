/**
 * File Storage Service (T144)
 * User Story 2: Enrich Cards with Details
 *
 * Handles local file storage for card attachments.
 * Validates file size and type before storing.
 *
 * Storage Strategy:
 * - Files stored in: /uploads/attachments/{year}/{month}/{uuid}-{filename}
 * - Max file size: 10MB (validated by Attachment domain model)
 * - Allowed types: images, PDFs, documents, archives
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Attachment } from 'src/domain/attachment/attachment.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileStorageService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Get upload directory from config or use default
    this.uploadDir =
      this.configService.get<string>('FILE_UPLOAD_DIR') ||
      path.join(process.cwd(), 'uploads', 'attachments');

    // Get base URL for file access
    this.baseUrl =
      this.configService.get<string>('FILE_BASE_URL') ||
      'http://localhost:3000/api/attachments';
  }

  /**
   * Store a file and return storage path and public URL
   */
  async store(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ storagePath: string; url: string }> {
    // Validate file size
    if (buffer.length > Attachment.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${Attachment.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Validate MIME type
    if (!Attachment.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `File type '${mimeType}' is not allowed. Allowed types: ${Attachment.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Generate unique filename with date-based directory structure
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const uniqueId = uuidv4();
    const sanitizedFilename = this.sanitizeFilename(filename);
    const relativeDir = path.join(year, month);
    const storageFilename = `${uniqueId}-${sanitizedFilename}`;
    const storagePath = path.join(relativeDir, storageFilename);
    const fullPath = path.join(this.uploadDir, storagePath);

    // Ensure directory exists
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });

    // Write file to disk
    await fs.writeFile(fullPath, buffer);

    // Generate public URL
    const url = `${this.baseUrl}/${storagePath.replace(/\\/g, '/')}`;

    return {
      storagePath,
      url,
    };
  }

  /**
   * Delete a file from storage
   */
  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Read a file from storage
   */
  async read(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, storagePath);
    try {
      return await fs.readFile(fullPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new BadRequestException('File not found');
      }
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.uploadDir, storagePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats (size, dates)
   */
  async getStats(storagePath: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
  }> {
    const fullPath = path.join(this.uploadDir, storagePath);
    try {
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new BadRequestException('File not found');
      }
      throw error;
    }
  }

  /**
   * Sanitize filename to prevent directory traversal
   */
  private sanitizeFilename(filename: string): string {
    // Remove path separators and null bytes
    let sanitized = filename
      .replace(/[/\\]/g, '_')
      .replace(/\0/g, '')
      .replace(/\.\./g, '_');

    // Limit length
    if (sanitized.length > 200) {
      const ext = path.extname(sanitized);
      const base = path.basename(sanitized, ext);
      sanitized = base.substring(0, 200 - ext.length) + ext;
    }

    return sanitized;
  }
}
