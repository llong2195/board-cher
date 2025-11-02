/**
 * Attachment Domain Model (T132)
 *
 * Represents a file attachment on a card.
 * Users can upload files (images, documents, etc.) to provide context for work items.
 *
 * Constraints:
 * - Max file size: 10MB (10,485,760 bytes)
 * - Allowed mime types: images, PDFs, documents, archives
 */

export class Attachment {
  // File size limit: 10MB in bytes
  public static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Allowed MIME types
  public static readonly ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/csv',
    'text/markdown',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  constructor(
    public readonly id: string,
    public readonly cardId: string,
    public readonly userId: string,
    public name: string,
    public readonly filename: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly storagePath: string,
    public readonly url: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Create a new Attachment instance
   */
  static create(
    id: string,
    cardId: string,
    userId: string,
    name: string,
    filename: string,
    mimeType: string,
    size: number,
    storagePath: string,
    url: string,
  ): Attachment {
    return new Attachment(
      id,
      cardId,
      userId,
      name,
      filename,
      mimeType,
      size,
      storagePath,
      url,
      new Date(),
      new Date(),
    );
  }

  /**
   * Rename the attachment (display name only, not filename)
   */
  rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Attachment name cannot be empty');
    }
    if (newName.length > 200) {
      throw new Error('Attachment name cannot exceed 200 characters');
    }
    this.name = newName;
    this.updatedAt = new Date();
  }

  /**
   * Check if file is an image
   */
  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * Get file extension from filename
   */
  getExtension(): string {
    const parts = this.filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Get human-readable file size
   */
  getFormattedSize(): string {
    const kb = this.size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  /**
   * Validate attachment invariants and constraints
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Attachment name cannot be empty');
    }
    if (this.name.length > 200) {
      throw new Error('Attachment name cannot exceed 200 characters');
    }
    if (!this.filename || this.filename.trim().length === 0) {
      throw new Error('Filename cannot be empty');
    }
    if (this.filename.length > 255) {
      throw new Error('Filename cannot exceed 255 characters');
    }
    if (!this.mimeType) {
      throw new Error('MIME type is required');
    }
    if (!Attachment.ALLOWED_MIME_TYPES.includes(this.mimeType)) {
      throw new Error(
        `MIME type '${this.mimeType}' is not allowed. Allowed types: ${Attachment.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
    if (this.size <= 0) {
      throw new Error('File size must be greater than 0');
    }
    if (this.size > Attachment.MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed size of ${Attachment.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
    if (!this.storagePath || this.storagePath.trim().length === 0) {
      throw new Error('Storage path is required');
    }
    if (!this.url || this.url.trim().length === 0) {
      throw new Error('URL is required');
    }
    if (!this.cardId) {
      throw new Error('Attachment must belong to a card');
    }
    if (!this.userId) {
      throw new Error('Attachment must have an uploader');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      cardId: this.cardId,
      userId: this.userId,
      name: this.name,
      filename: this.filename,
      mimeType: this.mimeType,
      size: this.size,
      formattedSize: this.getFormattedSize(),
      storagePath: this.storagePath,
      url: this.url,
      isImage: this.isImage(),
      extension: this.getExtension(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
