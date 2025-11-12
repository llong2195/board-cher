# Attachment Module

**Domain**: Card Attachments  
**Aggregate Root**: Attachment  
**Module Location**: `src/domain/attachment/`

## Overview

The Attachment module handles file uploads and associations with cards. Users can attach documents, images, videos, and other files to cards for reference and collaboration. Files are stored in cloud storage (S3) with metadata tracked in the database.

## Purpose

- Upload files to cards
- Download/preview attachments
- Delete attachments
- Track file metadata (name, size, type, URL)
- Generate signed URLs for secure access

## Components

### Domain Model (`attachment.model.ts`)

```typescript
class Attachment {
  id: string;
  cardId: string;
  userId: string; // Uploader
  fileName: string;
  fileSize: number; // Bytes
  mimeType: string; // e.g., "image/png", "application/pdf"
  storageKey: string; // S3 object key
  storageUrl: string | null; // Public URL if applicable
  createdAt: Date;
}
```

**Business Rules**:

- Attachment must belong to a card
- Max file size: 10MB per file
- Allowed MIME types: images, PDFs, documents, archives
- Dangerous file types blocked (.exe, .sh, .bat)
- Only uploader or card owner can delete attachment

**Key Methods**:

- `static create()` - Create attachment record
- `getSignedUrl()` - Generate temporary download URL (valid 1 hour)
- `delete()` - Mark for deletion, trigger storage cleanup

### Repository (`attachment.repository.ts`)

**Key Methods**:

- `findById(id): Promise<Attachment | null>`
- `findByCard(cardId): Promise<Attachment[]>`
- `save(attachment): Promise<Attachment>`
- `delete(id): Promise<void>`

### Storage Service (`attachment-storage.service.ts`)

**Key Methods**:

- `upload(file, cardId): Promise<{ key, url }>`
- `getSignedUrl(key): Promise<string>`
- `delete(key): Promise<void>`

## Data Flow

### Uploading an Attachment

```text
1. POST /cards/:id/attachments (multipart/form-data)
2. Validate file size and MIME type
3. Scan for malware (optional, via ClamAV)
4. Generate unique storage key (UUID + extension)
5. Upload to S3 via AttachmentStorageService
6. Create Attachment record via Attachment.create()
7. Save to repository
8. Emit AttachmentUploadedEvent
9. Return AttachmentResponseDto with signed URL
```

### Downloading an Attachment

```text
1. GET /attachments/:id/download
2. Load attachment from repository
3. Validate user has access to card
4. Generate signed URL via getSignedUrl()
5. Redirect to signed URL (302)
6. User downloads directly from S3
```

### Deleting an Attachment

```text
1. DELETE /attachments/:id
2. Load attachment, validate ownership
3. Delete from repository
4. Queue background job to delete from S3
5. Emit AttachmentDeletedEvent
6. Return 204 No Content
```

## Database Schema

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_key VARCHAR(500) NOT NULL UNIQUE,
  storage_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_attachments_card (card_id),
  INDEX idx_attachments_user (user_id)
);
```

**Relationships**:

- `card_id` → `cards.id` (many-to-one)
- `user_id` → `users.id` (many-to-one, nullable if user deleted)

## Storage Strategy

### S3 Configuration

```typescript
const s3Config = {
  bucket: process.env.S3_BUCKET,
  region: process.env.AWS_REGION,
  prefix: 'attachments/',
  signedUrlExpiry: 3600, // 1 hour
};
```

### Storage Key Format

```text
attachments/<cardId>/<uuid>.<extension>
Example: attachments/abc-123/def-456.pdf
```

### Security

- **Pre-signed URLs**: Temporary access (1 hour expiry)
- **MIME type validation**: Block dangerous file types
- **Virus scanning**: Optional ClamAV integration
- **Access control**: Only card members can download
- **CORS**: Restrict to known origins

## API Endpoints

| Method | Path                        | Description                            |
| ------ | --------------------------- | -------------------------------------- |
| GET    | `/cards/:id/attachments`    | List card attachments                  |
| POST   | `/cards/:id/attachments`    | Upload file to card                    |
| GET    | `/attachments/:id`          | Get attachment metadata                |
| GET    | `/attachments/:id/download` | Download file (redirect to signed URL) |
| DELETE | `/attachments/:id`          | Delete attachment                      |

## Performance Considerations

- **Direct uploads**: Client → Backend → S3 (not client → S3 due to auth complexity)
- **Streaming**: Use Node.js streams for large files
- **Thumbnails**: Generate thumbnails for images (future enhancement)
- **CDN**: Use CloudFront for faster downloads
- **Cleanup**: Background job deletes orphaned S3 objects weekly
- **Expected volume**: 5-20 attachments per card

## Related Modules

- **Card Module** - Attachments belong to cards
- **User Module** - Attachments uploaded by users
- **Activity Module** - Attachment actions logged
