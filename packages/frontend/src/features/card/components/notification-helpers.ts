/**
 * Notification Helper Functions
 * User Story 6: Card Assignment and Notifications
 *
 * Helper functions to create notification toast objects.
 * Separated from NotificationToast component for react-refresh compliance.
 */

import type { Toast as ToastType } from '@/hooks/useToast';

export interface AssignmentNotification {
  cardTitle: string;
  cardId: string;
  boardName: string;
  assignedByName: string;
}

export interface CommentNotification {
  cardTitle: string;
  cardId: string;
  boardName: string;
  commentAuthorName: string;
  commentPreview: string;
}

export function createAssignmentNotification({
  cardTitle,
  boardName,
  assignedByName,
}: AssignmentNotification): Omit<ToastType, 'id'> {
  return {
    title: 'You were assigned to a card',
    description: `${assignedByName} assigned you to "${cardTitle}" in ${boardName}`,
    variant: 'default',
    duration: 7000,
  };
}

export function createCommentNotification({
  cardTitle,
  boardName,
  commentAuthorName,
  commentPreview,
}: CommentNotification): Omit<ToastType, 'id'> {
  return {
    title: 'New comment on your card',
    description: `${commentAuthorName} commented on "${cardTitle}" in ${boardName}: ${commentPreview}`,
    variant: 'default',
    duration: 7000,
  };
}
