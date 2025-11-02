import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, Trash2, FileIcon, Image as ImageIcon } from 'lucide-react';
import type { Attachment } from '@/services/api/card.api';
import { attachmentApi, AttachmentApiClient } from '@/services/api/attachment.api';

/**
 * AttachmentList Component (T163)
 * User Story 2: Enrich Cards with Details
 *
 * Displays list of attachments with upload button and file management.
 * Includes upload progress tracking.
 */

interface AttachmentListProps {
  cardId: string;
  attachments: Attachment[];
  onUpload: (attachment: Attachment) => void;
  onDelete: (attachmentId: string) => void;
  readOnly?: boolean;
}

export function AttachmentList({
  cardId,
  attachments,
  onUpload,
  onDelete,
  readOnly = false,
}: AttachmentListProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const attachment = await attachmentApi.uploadAttachment(cardId, file, {
        onUploadProgress: (progressEvent) => {
          const progress = AttachmentApiClient.getUploadProgress(progressEvent);
          setUploadProgress(progress);
        },
      });

      onUpload(attachment);
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = await attachmentApi.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await attachmentApi.deleteAttachment(attachmentId);
      onDelete(attachmentId);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Attachments</h3>
        {!readOnly && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? `Uploading ${uploadProgress}%` : 'Add attachment'}
            </Button>
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No attachments yet</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-shrink-0">
                {attachment.isImage ? (
                  <ImageIcon className="h-8 w-8 text-blue-500" />
                ) : (
                  <FileIcon className="h-8 w-8 text-gray-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-gray-500">
                  {attachment.formattedSize} • {attachment.extension.toUpperCase()} •{' '}
                  {new Date(attachment.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>

                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
