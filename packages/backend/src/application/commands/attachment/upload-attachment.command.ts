/**
 * Upload Attachment Command (T138)
 * User Story 2: Enrich Cards with Details
 */

export class UploadAttachmentCommand {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly file: {
      name: string;
      filename: string;
      mimeType: string;
      size: number;
      buffer: Buffer;
    },
  ) {}
}
