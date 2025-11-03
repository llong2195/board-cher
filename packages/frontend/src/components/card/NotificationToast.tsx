import { Bell, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast, type Toast as ToastType } from '@/hooks/useToast';

/**
 * NotificationToast Component (T221)
 * User Story 6: Card Assignment and Notifications
 *
 * Toast notification component for displaying real-time assignment
 * and comment notifications using shadcn/ui Toast primitives.
 */

export interface NotificationToastProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  const getIcon = (variant?: 'default' | 'success' | 'error' | 'warning') => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <Bell className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onOpenChange={(open) => !open && onDismiss(toast.id)}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(toast.variant)}</div>
            <div className="flex-1">
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

/**
 * Notification types for specific use cases
 */

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

/**
 * Helper functions to create notifications
 */

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

/**
 * NotificationToastProvider Component
 * Wrapper component that provides toast context to the app
 */

interface NotificationToastProviderProps {
  children: React.ReactNode;
}

export function NotificationToastProvider({ children }: NotificationToastProviderProps) {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />
    </>
  );
}

/**
 * Export the useToast hook for use in components
 */
export { useToast };
