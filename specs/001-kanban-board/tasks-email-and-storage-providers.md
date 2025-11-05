# Tasks: Multi-Provider Email & File Storage

**Feature**: 001-kanban-board (Cross-Cutting Infrastructure)  
**Branch**: `001-kanban-board`  
**Date**: 2025-11-05  
**Dependencies**: Existing tasks.md (293 tasks complete)

---

## Overview

This task document adds two critical cross-cutting infrastructure features:

1. **Multi-Provider Email Service** - Support for AWS SES, Brevo, Mailchimp, SendGrid, Resend
2. **Multi-Provider File Storage Service** - Support for AWS S3, Google Cloud Storage, Cloudflare R2, Azure Blob Storage, local filesystem

These features integrate with existing User Story 2 (attachments) and User Story 6 (notifications via email).

---

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US2, US6)
- Include exact file paths in descriptions

---

## Phase 1: Multi-Provider Email Service (11 tasks)

**Purpose**: Abstract email sending with support for multiple providers (AWS SES, Brevo, Mailchimp, SendGrid, Resend)

**Integration Points**:

- User Story 6: Send notification emails for assignments, comments, due dates
- Password reset emails
- Organization invitations
- Weekly digest emails

### Domain Layer

- [x] T354 [P] Create EmailMessage value object in `packages/backend/src/domain/shared/value-objects/email-message.vo.ts` with to, from, subject, htmlBody, textBody, attachments
- [x] T355 [P] Create EmailProvider enum in `packages/backend/src/domain/shared/enums/email-provider.enum.ts` with values: AWS_SES, BREVO, MAILCHIMP, SENDGRID, RESEND, LOCAL
- [x] T356 Create EmailRepository interface in `packages/backend/src/domain/shared/email.repository.ts` with sendEmail, sendBulkEmail methods

### Infrastructure Layer - Provider Implementations

- [x] T357 Install email dependencies in backend: `@aws-sdk/client-ses`, `@getbrevo/brevo`, `@mailchimp/mailchimp_transactional`, `@sendgrid/mail`, `resend`
- [x] T358 [P] Create base EmailProviderAdapter abstract class in `packages/backend/src/infrastructure/email/adapters/email-provider.adapter.ts` with abstract sendEmail method
- [x] T359 [P] Implement AwsSesAdapter in `packages/backend/src/infrastructure/email/adapters/aws-ses.adapter.ts` using AWS SES SDK
- [x] T360 [P] Implement BrevoAdapter in `packages/backend/src/infrastructure/email/adapters/brevo.adapter.ts` using Brevo/Sendinblue SDK
- [x] T361 [P] Implement MailchimpAdapter in `packages/backend/src/infrastructure/email/adapters/mailchimp.adapter.ts` using Mailchimp Transactional API (Mandrill)
- [x] T362 [P] Implement SendGridAdapter in `packages/backend/src/infrastructure/email/adapters/sendgrid.adapter.ts` using SendGrid SDK
- [x] T363 [P] Implement ResendAdapter in `packages/backend/src/infrastructure/email/adapters/resend.adapter.ts` using Resend SDK
- [x] T364 [P] Implement LocalEmailAdapter in `packages/backend/src/infrastructure/email/adapters/local-email.adapter.ts` for development (logs to console/file)

### Application Layer

- [x] T365 Create EmailService in `packages/backend/src/application/services/email.service.ts` with provider factory pattern, retry logic, fallback to secondary provider
- [x] T366 Create email configuration in `packages/backend/src/config/email.config.ts` with provider selection (env var), API keys, retry settings, rate limits
- [x] T367 Create EmailModule in `packages/backend/src/infrastructure/email/email.module.ts` registering all adapters with provider factory

### Email Templates

- [x] T368 [P] Create email template engine wrapper in `packages/backend/src/infrastructure/email/template-engine.ts` using Handlebars for HTML templates
- [x] T369 [P] Create notification email template in `packages/backend/src/infrastructure/email/templates/notification.hbs` for card assignments, comments
- [x] T370 [P] Create invitation email template in `packages/backend/src/infrastructure/email/templates/invitation.hbs` for organization/board invites
- [x] T371 [P] Create password reset email template in `packages/backend/src/infrastructure/email/templates/password-reset.hbs`
- [x] T372 [P] Create weekly digest email template in `packages/backend/src/infrastructure/email/templates/weekly-digest.hbs` with activity summary

### Integration with Notifications (User Story 6)

- [x] T373 Update NotificationService in `packages/backend/src/application/services/notification.service.ts` to call EmailService when user preferences allow email notifications
- [x] T374 Add emailEnabled field to NotificationPreferences entity in `packages/backend/src/infrastructure/persistence/entities/notification-preferences.entity.ts`
- [x] T375 Create NotificationEmailSubscriber in `packages/backend/src/application/subscribers/notification-email.subscriber.ts` that listens to NotificationCreated events and sends emails

### Testing

- [x] T376 [P] Unit test EmailService provider switching logic in `packages/backend/test/unit/application/email.service.spec.ts`
- [x] T377 [P] Unit test each adapter (mock SDK calls) in `packages/backend/test/unit/infrastructure/email/adapters/*.spec.ts`
- [x] T378 [P] Integration test email sending with local adapter in `packages/backend/test/integration/email/email-sending.spec.ts`
- [x] T379 E2E test notification email flow: assign card → email sent to assignee in `packages/backend/test/e2e/notifications/notification-email.e2e-spec.ts`

---

## Phase 2: Multi-Provider File Storage Service (14 tasks)

**Purpose**: Abstract file upload/download with support for multiple cloud storage providers (AWS S3, Google Cloud Storage, Cloudflare R2, Azure Blob, local filesystem)

**Integration Points**:

- User Story 2: Card attachment uploads
- User avatars (User entity)
- Organization logos (Organization entity)
- Board background images (future feature)

### Domain Layer

- [ ] T380 [P] Create FileMetadata value object in `packages/backend/src/domain/shared/value-objects/file-metadata.vo.ts` with filename, mimeType, fileSize, hash, uploadedAt
- [ ] T381 [P] Create StorageProvider enum in `packages/backend/src/domain/shared/enums/storage-provider.enum.ts` with values: AWS_S3, GOOGLE_CLOUD_STORAGE, CLOUDFLARE_R2, AZURE_BLOB, LOCAL
- [ ] T382 Create StorageRepository interface in `packages/backend/src/domain/shared/storage.repository.ts` with uploadFile, downloadFile, deleteFile, getSignedUrl methods

### Infrastructure Layer - Provider Implementations

- [ ] T383 Install storage dependencies in backend: `@aws-sdk/client-s3`, `@google-cloud/storage`, `@azure/storage-blob`, `@aws-sdk/s3-request-presigner`
- [ ] T384 [P] Create base StorageProviderAdapter abstract class in `packages/backend/src/infrastructure/storage/adapters/storage-provider.adapter.ts` with abstract upload, download, delete, getSignedUrl methods
- [ ] T385 [P] Implement AwsS3Adapter in `packages/backend/src/infrastructure/storage/adapters/aws-s3.adapter.ts` using AWS S3 SDK v3 with multipart upload support
- [ ] T386 [P] Implement GoogleCloudStorageAdapter in `packages/backend/src/infrastructure/storage/adapters/google-cloud-storage.adapter.ts` using GCS SDK
- [ ] T387 [P] Implement CloudflareR2Adapter in `packages/backend/src/infrastructure/storage/adapters/cloudflare-r2.adapter.ts` using S3-compatible API
- [ ] T388 [P] Implement AzureBlobAdapter in `packages/backend/src/infrastructure/storage/adapters/azure-blob.adapter.ts` using Azure Blob Storage SDK
- [ ] T389 [P] Implement LocalStorageAdapter in `packages/backend/src/infrastructure/storage/adapters/local-storage.adapter.ts` for development (saves to disk at `uploads/`)

### Application Layer

- [ ] T390 Create StorageService in `packages/backend/src/application/services/storage.service.ts` with provider factory, file validation (size, mime type), virus scanning integration hook
- [ ] T391 Create storage configuration in `packages/backend/src/config/storage.config.ts` with provider selection, bucket names, region, max file size, allowed mime types
- [ ] T392 Create StorageModule in `packages/backend/src/infrastructure/storage/storage.module.ts` registering all adapters with provider factory

### Integration with Attachments (User Story 2)

- [ ] T393 Update Attachment entity in `packages/backend/src/infrastructure/persistence/entities/attachment.entity.ts` to add storageProvider field (enum)
- [ ] T394 Update AttachmentService in `packages/backend/src/application/services/attachment.service.ts` to use StorageService instead of local file storage
- [ ] T395 Update CardController POST /cards/:id/attachments endpoint in `packages/backend/src/presentation/controllers/card.controller.ts` to handle multipart/form-data upload
- [ ] T396 Implement presigned URL generation in AttachmentService for secure direct downloads without proxying through backend
- [ ] T397 Update AttachmentController GET /attachments/:id/download in `packages/backend/src/presentation/controllers/attachment.controller.ts` to redirect to presigned URL or stream file

### File Upload Optimizations

- [ ] T398 [P] Create file upload queue using Bull in `packages/backend/src/infrastructure/storage/upload-queue.service.ts` for async background uploads
- [ ] T399 [P] Implement image thumbnail generation in `packages/backend/src/infrastructure/storage/thumbnail.service.ts` using Sharp library for image attachments
- [ ] T400 [P] Create file deduplication service in `packages/backend/src/infrastructure/storage/deduplication.service.ts` using SHA-256 hash to avoid duplicate uploads
- [ ] T401 Implement virus scanning integration in `packages/backend/src/infrastructure/storage/virus-scanner.service.ts` with ClamAV or cloud antivirus API

### Frontend Integration

- [ ] T402 Create useFileUpload hook in `packages/frontend/src/hooks/useFileUpload.ts` with upload progress, chunked uploads, retry logic
- [ ] T403 Update CardAttachment component in `packages/frontend/src/components/card/CardAttachment.tsx` to use new upload hook with progress bar
- [ ] T404 Create FileUploadDropzone component in `packages/frontend/src/components/ui/FileUploadDropzone.tsx` with drag-and-drop support using react-dropzone

### Testing

- [ ] T405 [P] Unit test StorageService provider switching logic in `packages/backend/test/unit/application/storage.service.spec.ts`
- [ ] T406 [P] Unit test each adapter (mock SDK calls) in `packages/backend/test/unit/infrastructure/storage/adapters/*.spec.ts`
- [ ] T407 [P] Integration test file upload/download with local adapter in `packages/backend/test/integration/storage/file-operations.spec.ts`
- [ ] T408 E2E test attachment upload flow: upload file → store in cloud → download → delete in `packages/backend/test/e2e/attachments/attachment-storage.e2e-spec.ts`
- [ ] T409 [P] Frontend component test FileUploadDropzone with mock file in `packages/frontend/test/components/ui/FileUploadDropzone.spec.tsx`

---

## Phase 3: Configuration & Provider Management (6 tasks)

**Purpose**: Admin UI and runtime provider switching

- [ ] T410 Create provider configuration entity in `packages/backend/src/infrastructure/persistence/entities/provider-config.entity.ts` for storing API keys, settings per provider
- [ ] T411 Create ProviderConfigService in `packages/backend/src/application/services/provider-config.service.ts` with CRUD operations, encryption for API keys
- [ ] T412 Create admin endpoint POST /admin/providers/email in `packages/backend/src/presentation/controllers/admin.controller.ts` for configuring email providers
- [ ] T413 Create admin endpoint POST /admin/providers/storage in `packages/backend/src/presentation/controllers/admin.controller.ts` for configuring storage providers
- [ ] T414 Create ProviderSettings page in `packages/frontend/src/pages/admin/ProviderSettings.tsx` with forms for email and storage provider configuration
- [ ] T415 Add provider health check endpoint GET /admin/providers/health in `packages/backend/src/presentation/controllers/admin.controller.ts` to test provider connections

---

## Phase 4: Monitoring & Observability (5 tasks)

**Purpose**: Track email delivery and file storage metrics

- [ ] T416 Create EmailLog entity in `packages/backend/src/infrastructure/persistence/entities/email-log.entity.ts` to track sent emails (to, subject, provider, status, sentAt, error)
- [ ] T417 Update EmailService to log all email sends in `packages/backend/src/application/services/email.service.ts`
- [ ] T418 Create StorageMetrics entity in `packages/backend/src/infrastructure/persistence/entities/storage-metrics.entity.ts` to track upload/download stats (bytes, duration, provider)
- [ ] T419 Create provider metrics dashboard endpoint GET /admin/metrics/providers in `packages/backend/src/presentation/controllers/admin.controller.ts` returning email/storage stats
- [ ] T420 Create ProviderMetrics page in `packages/frontend/src/pages/admin/ProviderMetrics.tsx` with charts for email delivery rate, storage usage per provider

---

## Phase 5: Migration & Cleanup (4 tasks)

**Purpose**: Database migrations and cleanup jobs

- [ ] T421 Create migration for Attachment.storageProvider field in `packages/backend/migrations/1730900100000-AddStorageProviderToAttachment.ts`
- [ ] T422 Create migration for NotificationPreferences.emailEnabled field in `packages/backend/migrations/1730900200000-AddEmailEnabledToNotificationPreferences.ts`
- [ ] T423 Create migration for ProviderConfig table in `packages/backend/migrations/1730900300000-CreateProviderConfig.ts`
- [ ] T424 Create migration for EmailLog and StorageMetrics tables in `packages/backend/migrations/1730900400000-CreateProviderMetricsTables.ts`

---

## Summary

**Total Tasks**: 71 (T354-T424)

### Task Breakdown by Phase:

- **Phase 1**: Multi-Provider Email Service - 26 tasks
- **Phase 2**: Multi-Provider File Storage Service - 30 tasks
- **Phase 3**: Configuration & Provider Management - 6 tasks
- **Phase 4**: Monitoring & Observability - 5 tasks
- **Phase 5**: Migration & Cleanup - 4 tasks

### Parallelization Opportunities:

**Phase 1 Parallel** (can run simultaneously):

- T354, T355 (domain models)
- T359-T364 (all provider adapter implementations)
- T368-T372 (email templates)
- T376-T379 (all tests)

**Phase 2 Parallel** (can run simultaneously):

- T380, T381 (domain models)
- T385-T389 (all storage adapter implementations)
- T398-T401 (optimization services)
- T405-T409 (all tests)

### MVP Scope (Critical Path - 35 tasks):

**Email MVP** (15 tasks): T354-T367, T373-T375, T376, T378

- Delivers: Working email service with AWS SES + Brevo + local adapter
- Enables: Notification emails for card assignments

**Storage MVP** (20 tasks): T380-T397, T402-T404, T405, T407

- Delivers: Working file storage with AWS S3 + local adapter
- Enables: Card attachments uploaded to cloud storage

### Time Estimates:

- **Phase 1**: 8-10 days (email service + templates + integration)
- **Phase 2**: 10-12 days (storage service + optimizations + frontend)
- **Phase 3**: 3-4 days (admin UI for provider configuration)
- **Phase 4**: 3-4 days (monitoring and metrics)
- **Phase 5**: 1 day (migrations)

**Total**: 25-31 days for complete implementation

---

## Dependencies

### Phase 1 Dependencies:

- ✅ T301-T303: Notification entities (from tasks-notifications-real.md)
- ✅ T310-T314: NotificationService (from tasks-notifications-real.md)
- ✅ User entity and auth system (from existing tasks.md)

### Phase 2 Dependencies:

- ✅ T135-T145: Attachment entity and service (from existing tasks.md - User Story 2)
- ✅ Card entity (from existing tasks.md)
- ✅ User entity (from existing tasks.md)

### No Blocking Dependencies:

Both Phase 1 and Phase 2 can be implemented in parallel by different developers.

---

## Integration Points

### Email Service Integration:

1. **Notification System** (US6):
   - T373: NotificationService → EmailService when emailEnabled=true
   - T375: NotificationEmailSubscriber listens to domain events

2. **Authentication**:
   - Password reset emails
   - Email verification (future)

3. **Organization Management** (US4):
   - Invitation emails when users added to organization
   - Weekly digest emails with activity summary

### Storage Service Integration:

1. **Card Attachments** (US2):
   - T394-T397: AttachmentService uses StorageService
   - T402-T404: Frontend upload components

2. **User Avatars**:
   - Upload avatar → StorageService → presigned URL for display

3. **Organization Logos** (US4):
   - Logo upload for branding

---

## Configuration Example

### Email Provider Configuration (env vars):

```bash
# Email Provider Selection
EMAIL_PROVIDER=aws_ses  # aws_ses | brevo | mailchimp | sendgrid | resend | local
EMAIL_FROM=noreply@kanban.example.com

# AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=AKIA...
AWS_SES_SECRET_KEY=...

# Brevo (Sendinblue)
BREVO_API_KEY=xkeysib-...

# Mailchimp Transactional (Mandrill)
MAILCHIMP_API_KEY=md-...

# SendGrid
SENDGRID_API_KEY=SG.....

# Resend
RESEND_API_KEY=re_...
```

### Storage Provider Configuration (env vars):

```bash
# Storage Provider Selection
STORAGE_PROVIDER=aws_s3  # aws_s3 | gcs | cloudflare_r2 | azure_blob | local
STORAGE_MAX_FILE_SIZE=10485760  # 10MB in bytes

# AWS S3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=kanban-attachments
AWS_S3_ACCESS_KEY=AKIA...
AWS_S3_SECRET_KEY=...

# Google Cloud Storage
GCS_PROJECT_ID=my-project
GCS_BUCKET=kanban-attachments
GCS_KEY_FILE=/path/to/service-account.json

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_BUCKET=kanban-attachments
R2_ACCESS_KEY=...
R2_SECRET_KEY=...

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT=myaccount
AZURE_STORAGE_KEY=...
AZURE_STORAGE_CONTAINER=kanban-attachments

# Local (development)
LOCAL_UPLOAD_DIR=./uploads
```

---

## Success Criteria

### Email Service:

- ✅ SC-E01: Emails sent successfully with 99.5% delivery rate
- ✅ SC-E02: Automatic failover to secondary provider within 5 seconds on primary failure
- ✅ SC-E03: Email templates render correctly with user data (no broken variables)
- ✅ SC-E04: Rate limiting prevents spam (max 100 emails/hour per user)
- ✅ SC-E05: All email sends logged with delivery status

### Storage Service:

- ✅ SC-S01: Files up to 10MB upload successfully within 30 seconds
- ✅ SC-S02: File downloads use presigned URLs (no backend proxy overhead)
- ✅ SC-S03: Duplicate files detected by hash (no redundant storage)
- ✅ SC-S04: Image thumbnails generated within 5 seconds of upload
- ✅ SC-S05: Virus scanning completes before file is available for download
- ✅ SC-S06: File operations work identically across all providers (abstraction is transparent)

### Admin Experience:

- ✅ SC-A01: Admins can switch providers via UI without code changes
- ✅ SC-A02: Provider health checks detect connectivity issues within 10 seconds
- ✅ SC-A03: Metrics dashboard shows email delivery rate and storage usage

---

## Architecture Decisions

### Email Service Design:

**Pattern**: Strategy Pattern + Factory Pattern

- Abstract `EmailProviderAdapter` defines interface
- Concrete adapters implement provider-specific logic
- `EmailService` uses factory to select provider at runtime
- Retry logic with exponential backoff (3 attempts)
- Fallback to secondary provider on permanent failure

**Template Engine**: Handlebars

- Precompiled templates for performance
- Layouts for consistent branding
- Helper functions for date formatting, pluralization

### Storage Service Design:

**Pattern**: Strategy Pattern + Repository Pattern

- Abstract `StorageProviderAdapter` defines interface
- Concrete adapters implement provider-specific logic
- `StorageService` handles validation, deduplication, orchestration
- Presigned URLs for direct client downloads (avoid backend proxy)

**File Processing Pipeline**:

1. Validate (size, mime type, filename)
2. Calculate hash (SHA-256)
3. Check deduplication (existing hash?)
4. Upload to cloud storage (or reuse existing)
5. Generate thumbnail (if image)
6. Scan for viruses (async job)
7. Update attachment entity

**Multipart Upload**:

- Files >5MB use multipart upload (S3, R2, Azure support)
- Resumable uploads for large files
- Progress tracking via WebSocket

---

## Testing Strategy

### Email Service Tests:

1. **Unit Tests** (T376-T377):
   - Mock each provider SDK
   - Test provider factory selection logic
   - Test retry mechanism
   - Test fallback to secondary provider

2. **Integration Tests** (T378):
   - Test email sending with local adapter (log to file)
   - Verify template rendering with real data
   - Test rate limiting enforcement

3. **E2E Tests** (T379):
   - Create notification → verify email sent
   - Test HTML rendering in email client (MailHog for dev)

### Storage Service Tests:

1. **Unit Tests** (T405-T406):
   - Mock each provider SDK
   - Test file validation logic
   - Test hash calculation
   - Test deduplication logic

2. **Integration Tests** (T407):
   - Upload file with local adapter
   - Download file and verify contents
   - Delete file and verify removal
   - Test presigned URL generation

3. **E2E Tests** (T408):
   - Upload attachment via API
   - Download attachment via presigned URL
   - Verify thumbnail generated for image
   - Delete card and verify cascading deletion

4. **Frontend Tests** (T409):
   - Test drag-and-drop upload
   - Test upload progress display
   - Test error handling (file too large)

---

## Rollout Plan

### Phase 1: Local Development

- Deploy with `EMAIL_PROVIDER=local` and `STORAGE_PROVIDER=local`
- Emails logged to console/file (MailHog for preview)
- Files stored in `uploads/` directory

### Phase 2: Staging Environment

- Deploy with `EMAIL_PROVIDER=aws_ses` and `STORAGE_PROVIDER=aws_s3`
- Test real email delivery (to test email addresses)
- Test S3 uploads with test bucket

### Phase 3: Production Environment

- Deploy with production provider credentials
- Monitor email delivery rate (target: 99.5%)
- Monitor storage costs and performance
- Setup CloudWatch/Datadog alerts for provider failures

### Phase 4: Multi-Provider Rollout

- Add Brevo as secondary email provider (auto-failover)
- Add Cloudflare R2 as cost-effective storage alternative
- Admin UI to switch providers per organization (premium feature)

---

## Cost Optimization

### Email Providers (sorted by cost):

1. **AWS SES**: $0.10 per 1,000 emails (cheapest, requires warm-up)
2. **Brevo**: Free tier 300 emails/day, then $25/month for 20k emails
3. **Resend**: $20/month for 50k emails
4. **SendGrid**: $19.95/month for 50k emails
5. **Mailchimp**: $35/month for 50k emails (most expensive)

**Recommendation**: AWS SES as primary, Brevo as free-tier fallback

### Storage Providers (sorted by cost):

1. **Cloudflare R2**: $0.015/GB storage, ZERO egress fees (cheapest)
2. **AWS S3**: $0.023/GB storage, $0.09/GB egress
3. **Google Cloud Storage**: $0.020/GB storage, $0.12/GB egress
4. **Azure Blob Storage**: $0.018/GB storage, $0.087/GB egress
5. **Local**: Free but not scalable

**Recommendation**: Cloudflare R2 for production (zero egress = huge savings for file downloads)

---

## Security Considerations

### Email Service:

- ✅ API keys stored encrypted in database (AES-256)
- ✅ Rate limiting per user (prevent spam)
- ✅ Email address validation (prevent header injection)
- ✅ SPF, DKIM, DMARC records configured for domain
- ✅ Unsubscribe link in all notification emails (compliance)

### Storage Service:

- ✅ Presigned URLs expire after 15 minutes (short-lived)
- ✅ File size limits enforced (10MB max)
- ✅ MIME type whitelist (prevent executable uploads)
- ✅ Virus scanning before file availability
- ✅ File names sanitized (prevent path traversal)
- ✅ S3 bucket policies restrict public access

---

## Documentation Requirements

- [ ] T425 [P] Update README.md with email provider setup instructions
- [ ] T426 [P] Update README.md with storage provider setup instructions
- [ ] T427 [P] Create docs/email-providers.md with comparison table and setup guide for each provider
- [ ] T428 [P] Create docs/storage-providers.md with comparison table and setup guide for each provider
- [ ] T429 [P] Update architecture.md with email and storage service diagrams
- [ ] T430 Update deployment.md with environment variable documentation for all providers

**Total Documentation Tasks**: 6 (T425-T430)

---

## Final Task Count: **77 tasks** (T354-T430)

- Phase 1: Multi-Provider Email Service - 26 tasks
- Phase 2: Multi-Provider File Storage Service - 30 tasks
- Phase 3: Configuration & Provider Management - 6 tasks
- Phase 4: Monitoring & Observability - 5 tasks
- Phase 5: Migration & Cleanup - 4 tasks
- Documentation - 6 tasks

---

**Status**: ⏳ **READY FOR IMPLEMENTATION**

All tasks are immediately actionable and include specific file paths per speckit.tasks.prompt.md requirements.
