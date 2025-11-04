/**
 * T204 [US6] - Frontend Notification Toast Integration Test
 * User Story 6: Card Assignment and Notifications
 *
 * Tests the NotificationToast component and its integration with
 * WebSocket events for displaying real-time notifications.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import {
  NotificationToast,
  NotificationToastProvider,
  createAssignmentNotification,
  createCommentNotification,
  useToast,
} from '../../../src/components/card/NotificationToast';
import type { Toast } from '../../../src/hooks/useToast';

describe('NotificationToast Component', () => {
  describe('NotificationToast Rendering', () => {
    it('should render nothing when toasts array is empty', () => {
      const { container } = render(<NotificationToast toasts={[]} onDismiss={vi.fn()} />);

      // No toasts should be visible
      expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
    });

    it('should render a single toast notification', () => {
      const toast: Toast = {
        id: 'toast-1',
        title: 'Test Notification',
        description: 'This is a test notification',
        variant: 'default',
      };

      render(<NotificationToast toasts={[toast]} onDismiss={vi.fn()} />);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    });

    it('should render multiple toast notifications', () => {
      const toasts: Toast[] = [
        {
          id: 'toast-1',
          title: 'First Notification',
          description: 'First description',
          variant: 'default',
        },
        {
          id: 'toast-2',
          title: 'Second Notification',
          description: 'Second description',
          variant: 'success',
        },
      ];

      render(<NotificationToast toasts={toasts} onDismiss={vi.fn()} />);

      expect(screen.getByText('First Notification')).toBeInTheDocument();
      expect(screen.getByText('Second Notification')).toBeInTheDocument();
    });

    it('should render toast without description', () => {
      const toast: Toast = {
        id: 'toast-1',
        title: 'Simple Notification',
        variant: 'default',
      };

      render(<NotificationToast toasts={[toast]} onDismiss={vi.fn()} />);

      expect(screen.getByText('Simple Notification')).toBeInTheDocument();
    });

    it('should render correct icon based on variant', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', title: 'Default', variant: 'default' },
        { id: 'toast-2', title: 'Success', variant: 'success' },
        { id: 'toast-3', title: 'Error', variant: 'error' },
        { id: 'toast-4', title: 'Warning', variant: 'warning' },
      ];

      const { container } = render(<NotificationToast toasts={toasts} onDismiss={vi.fn()} />);

      // Check that icons are rendered (lucide icons render as SVG)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(toasts.length);
    });
  });

  describe('Toast Interaction', () => {
    it('should call onDismiss when close button is clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const toast: Toast = {
        id: 'toast-1',
        title: 'Test Notification',
        variant: 'default',
      };

      render(<NotificationToast toasts={[toast]} onDismiss={onDismiss} />);

      // Find and click the close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // onDismiss should be called with the toast id
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith('toast-1');
      });
    });
  });

  describe('Notification Helper Functions', () => {
    it('should create assignment notification with correct format', () => {
      const notification = createAssignmentNotification({
        cardTitle: 'Fix login bug',
        cardId: 'card-123',
        boardName: 'Development Board',
        assignedByName: 'John Doe',
      });

      expect(notification.title).toBe('You were assigned to a card');
      expect(notification.description).toContain('John Doe');
      expect(notification.description).toContain('Fix login bug');
      expect(notification.description).toContain('Development Board');
      expect(notification.variant).toBe('default');
      expect(notification.duration).toBe(7000);
    });

    it('should create comment notification with correct format', () => {
      const notification = createCommentNotification({
        cardTitle: 'Fix login bug',
        cardId: 'card-123',
        boardName: 'Development Board',
        commentAuthorName: 'Jane Smith',
        commentPreview: 'Started working on this',
      });

      expect(notification.title).toBe('New comment on your card');
      expect(notification.description).toContain('Jane Smith');
      expect(notification.description).toContain('Fix login bug');
      expect(notification.description).toContain('Development Board');
      expect(notification.description).toContain('Started working on this');
      expect(notification.variant).toBe('default');
      expect(notification.duration).toBe(7000);
    });
  });

  describe('NotificationToastProvider', () => {
    it('should render children and toast component', () => {
      render(
        <NotificationToastProvider>
          <div>Test Child Content</div>
        </NotificationToastProvider>,
      );

      expect(screen.getByText('Test Child Content')).toBeInTheDocument();
    });
  });
});

describe('useToast Hook', () => {
  // Helper component to test the hook
  function ToastTestComponent() {
    const { toasts, addToast, removeToast } = useToast();

    return (
      <div>
        <button
          onClick={() =>
            addToast({
              title: 'Test Toast',
              description: 'Test Description',
              variant: 'default',
            })
          }
        >
          Add Toast
        </button>
        <button
          onClick={() =>
            addToast({
              title: 'Success Toast',
              variant: 'success',
              duration: 1000,
            })
          }
        >
          Add Success Toast
        </button>
        <div data-testid="toast-count">{toasts.length}</div>
        {toasts.map((toast: Toast) => (
          <div key={toast.id} data-testid={`toast-${toast.id}`}>
            <span>{toast.title}</span>
            <button onClick={() => removeToast(toast.id)}>Remove {toast.id}</button>
          </div>
        ))}
      </div>
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should add a toast when addToast is called', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToastTestComponent />);

    const addButton = screen.getByRole('button', { name: /add toast/i });
    await user.click(addButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('should remove a toast when removeToast is called', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToastTestComponent />);

    // Add a toast
    const addButton = screen.getByRole('button', { name: /add toast/i });
    await user.click(addButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    // Remove the toast
    const removeButton = screen.getByRole('button', { name: /remove toast-1/i });
    await user.click(removeButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('should auto-dismiss toast after duration', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToastTestComponent />);

    // Add a toast with 1000ms duration
    const addButton = screen.getByRole('button', { name: /add success toast/i });
    await user.click(addButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    // Fast-forward time by 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Toast should be auto-dismissed
    await waitFor(() => {
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  it('should add multiple toasts', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToastTestComponent />);

    const addButton = screen.getByRole('button', { name: /^add toast$/i });

    // Add multiple toasts
    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
  });

  it('should assign unique ids to each toast', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToastTestComponent />);

    const addButton = screen.getByRole('button', { name: /^add toast$/i });

    // Add two toasts
    await user.click(addButton);
    await user.click(addButton);

    // Get all toast elements
    const toast1 = screen.getByTestId('toast-toast-1');
    const toast2 = screen.getByTestId('toast-toast-2');

    expect(toast1).toBeInTheDocument();
    expect(toast2).toBeInTheDocument();
  });
});

describe('WebSocket Integration Simulation', () => {
  // Helper component that simulates WebSocket events
  function WebSocketSimulator() {
    const { addToast } = useToast();

    const simulateCardAssigned = () => {
      const notification = createAssignmentNotification({
        cardTitle: 'Implement user authentication',
        cardId: 'card-456',
        boardName: 'Sprint 1',
        assignedByName: 'Project Manager',
      });
      addToast(notification);
    };

    const simulateCommentAdded = () => {
      const notification = createCommentNotification({
        cardTitle: 'Implement user authentication',
        cardId: 'card-456',
        boardName: 'Sprint 1',
        commentAuthorName: 'Developer',
        commentPreview: 'I will start working on this tomorrow',
      });
      addToast(notification);
    };

    return (
      <div>
        <button onClick={simulateCardAssigned}>Simulate Card Assigned Event</button>
        <button onClick={simulateCommentAdded}>Simulate Comment Added Event</button>
        <NotificationToastProvider>
          <div>App Content</div>
        </NotificationToastProvider>
      </div>
    );
  }

  it('should display notification when card:assigned WebSocket event is simulated', async () => {
    const user = userEvent.setup();
    render(<WebSocketSimulator />);

    const assignButton = screen.getByRole('button', {
      name: /simulate card assigned event/i,
    });
    await user.click(assignButton);

    // Check that assignment notification is displayed
    await waitFor(() => {
      expect(screen.getByText('You were assigned to a card')).toBeInTheDocument();
      expect(screen.getByText(/Project Manager/)).toBeInTheDocument();
      expect(screen.getByText(/Implement user authentication/)).toBeInTheDocument();
    });
  });

  it('should display notification when comment:added WebSocket event is simulated', async () => {
    const user = userEvent.setup();
    render(<WebSocketSimulator />);

    const commentButton = screen.getByRole('button', {
      name: /simulate comment added event/i,
    });
    await user.click(commentButton);

    // Check that comment notification is displayed
    await waitFor(() => {
      expect(screen.getByText('New comment on your card')).toBeInTheDocument();
      expect(screen.getByText(/Developer/)).toBeInTheDocument();
      expect(screen.getByText(/I will start working on this tomorrow/)).toBeInTheDocument();
    });
  });

  it('should handle multiple WebSocket events', async () => {
    const user = userEvent.setup();
    render(<WebSocketSimulator />);

    // Trigger both events
    const assignButton = screen.getByRole('button', {
      name: /simulate card assigned event/i,
    });
    const commentButton = screen.getByRole('button', {
      name: /simulate comment added event/i,
    });

    await user.click(assignButton);
    await user.click(commentButton);

    // Both notifications should be visible
    await waitFor(() => {
      expect(screen.getByText('You were assigned to a card')).toBeInTheDocument();
      expect(screen.getByText('New comment on your card')).toBeInTheDocument();
    });
  });
});
