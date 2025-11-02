/**
 * T122 [US2] Frontend Card Modal Integration Tests
 *
 * Tests the card detail modal component with React Testing Library:
 * - Opening/closing modal
 * - Adding/editing comments
 * - Uploading/removing attachments
 * - Assigning/removing labels
 * - Creating/toggling checklist items
 * - Updating description and due date
 * - Real-time updates from WebSocket
 *
 * TDD Approach: These tests are written FIRST and will FAIL until the implementation is complete.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardModal } from '../../../src/components/card/CardModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API service
vi.mock('../../../src/services/api/cardService', () => ({
  useCard: vi.fn(),
  useUpdateCard: vi.fn(),
  useComments: vi.fn(),
  useAddComment: vi.fn(),
  useDeleteComment: vi.fn(),
  useAttachments: vi.fn(),
  useUploadAttachment: vi.fn(),
  useDeleteAttachment: vi.fn(),
  useLabels: vi.fn(),
  useAssignLabel: vi.fn(),
  useRemoveLabel: vi.fn(),
  useChecklists: vi.fn(),
  useAddChecklist: vi.fn(),
  useAddChecklistItem: vi.fn(),
  useToggleChecklistItem: vi.fn(),
  useDeleteChecklistItem: vi.fn(),
}));

// Mock WebSocket service
vi.mock('../../../src/services/websocket.service', () => ({
  useWebSocket: vi.fn(() => ({
    socket: null,
    isConnected: true,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('CardModal - T122', () => {
  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
    listId: 'list-1',
    position: 0,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    comments: [],
    attachments: [],
    checklists: [],
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Open/Close', () => {
    it('should render modal when open', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
        error: null,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<CardModal cardId="card-1" isOpen={false} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close when clicking close button', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close when pressing Escape key', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show loading state while fetching card', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: null,
        isLoading: true,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show error state if card not found', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Card not found'),
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/not found|error/i)).toBeInTheDocument();
    });
  });

  describe('Update Description', () => {
    it('should display description editor', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should update description when edited', async () => {
      const mockUpdateCard = vi.fn();
      const { useCard, useUpdateCard } = await import('../../../src/services/api/cardService');

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useUpdateCard).mockReturnValue({
        mutate: mockUpdateCard,
        isPending: false,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const descriptionEditor = screen.getByLabelText(/description/i);
      await user.clear(descriptionEditor);
      await user.type(descriptionEditor, 'Updated description with **markdown**');

      const saveButton = screen.getByRole('button', { name: /save description/i });
      await user.click(saveButton);

      expect(mockUpdateCard).toHaveBeenCalledWith({
        cardId: 'card-1',
        description: 'Updated description with **markdown**',
      });
    });

    it('should support markdown preview', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: { ...mockCard, description: '**Bold** and *italic*' },
        isLoading: false,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      expect(screen.getByText(/bold/i)).toBeInTheDocument();
    });
  });

  describe('Update Due Date', () => {
    it('should display due date picker', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('should set due date', async () => {
      const mockUpdateCard = vi.fn();
      const { useCard, useUpdateCard } = await import('../../../src/services/api/cardService');

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useUpdateCard).mockReturnValue({
        mutate: mockUpdateCard,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const dueDateInput = screen.getByLabelText(/due date/i);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await user.type(dueDateInput, tomorrow.toISOString().split('T')[0]);

      await waitFor(() => {
        expect(mockUpdateCard).toHaveBeenCalledWith(
          expect.objectContaining({
            cardId: 'card-1',
            dueDate: expect.any(String),
          }),
        );
      });
    });

    it('should remove due date', async () => {
      const mockUpdateCard = vi.fn();
      const { useCard, useUpdateCard } = await import('../../../src/services/api/cardService');

      const cardWithDueDate = {
        ...mockCard,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      vi.mocked(useCard).mockReturnValue({
        data: cardWithDueDate,
        isLoading: false,
      } as any);

      vi.mocked(useUpdateCard).mockReturnValue({
        mutate: mockUpdateCard,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const removeDueDateButton = screen.getByRole('button', { name: /remove due date/i });
      await user.click(removeDueDateButton);

      expect(mockUpdateCard).toHaveBeenCalledWith({
        cardId: 'card-1',
        dueDate: null,
      });
    });
  });

  describe('Comments', () => {
    it('should display comment list', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          content: 'First comment',
          userId: 'user-1',
          user: { name: 'John Doe' },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'comment-2',
          content: 'Second comment',
          userId: 'user-2',
          user: { name: 'Jane Smith' },
          createdAt: new Date().toISOString(),
        },
      ];

      const { useCard, useComments } = await import('../../../src/services/api/cardService');

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useComments).mockReturnValue({
        data: mockComments,
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
    });

    it('should add new comment', async () => {
      const mockAddComment = vi.fn();
      const { useCard, useComments, useAddComment } = await import(
        '../../../src/services/api/cardService'
      );

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useComments).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      vi.mocked(useAddComment).mockReturnValue({
        mutate: mockAddComment,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const commentInput = screen.getByPlaceholderText(/write a comment/i);
      await user.type(commentInput, 'This is my comment');

      const submitButton = screen.getByRole('button', { name: /add comment|post/i });
      await user.click(submitButton);

      expect(mockAddComment).toHaveBeenCalledWith({
        cardId: 'card-1',
        content: 'This is my comment',
      });
    });

    it('should delete comment', async () => {
      const mockDeleteComment = vi.fn();
      const mockComments = [
        {
          id: 'comment-1',
          content: 'Comment to delete',
          userId: 'current-user',
          user: { name: 'Current User' },
          createdAt: new Date().toISOString(),
        },
      ];

      const { useCard, useComments, useDeleteComment } = await import(
        '../../../src/services/api/cardService'
      );

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useComments).mockReturnValue({
        data: mockComments,
        isLoading: false,
      } as any);

      vi.mocked(useDeleteComment).mockReturnValue({
        mutate: mockDeleteComment,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const deleteButton = screen.getByRole('button', { name: /delete comment/i });
      await user.click(deleteButton);

      expect(mockDeleteComment).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('Attachments', () => {
    it('should display attachment list', async () => {
      const mockAttachments = [
        {
          id: 'attachment-1',
          name: 'document.pdf',
          url: '/files/document.pdf',
          mimeType: 'application/pdf',
          size: 102400,
        },
        {
          id: 'attachment-2',
          name: 'image.png',
          url: '/files/image.png',
          mimeType: 'image/png',
          size: 51200,
        },
      ];

      const { useCard, useAttachments } = await import('../../../src/services/api/cardService');

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useAttachments).mockReturnValue({
        data: mockAttachments,
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.png')).toBeInTheDocument();
    });

    it('should upload attachment', async () => {
      const mockUploadAttachment = vi.fn();
      const { useCard, useAttachments, useUploadAttachment } = await import(
        '../../../src/services/api/cardService'
      );

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useAttachments).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      vi.mocked(useUploadAttachment).mockReturnValue({
        mutate: mockUploadAttachment,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/attach file|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockUploadAttachment).toHaveBeenCalledWith(
          expect.objectContaining({
            cardId: 'card-1',
            file: expect.any(File),
          }),
        );
      });
    });

    it('should delete attachment', async () => {
      const mockDeleteAttachment = vi.fn();
      const mockAttachments = [
        {
          id: 'attachment-1',
          name: 'to-delete.pdf',
          url: '/files/to-delete.pdf',
        },
      ];

      const { useCard, useAttachments, useDeleteAttachment } = await import(
        '../../../src/services/api/cardService'
      );

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useAttachments).mockReturnValue({
        data: mockAttachments,
        isLoading: false,
      } as any);

      vi.mocked(useDeleteAttachment).mockReturnValue({
        mutate: mockDeleteAttachment,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const deleteButton = screen.getByRole('button', { name: /delete attachment/i });
      await user.click(deleteButton);

      expect(mockDeleteAttachment).toHaveBeenCalledWith('attachment-1');
    });
  });

  describe('Labels', () => {
    it('should display assigned labels', async () => {
      const cardWithLabels = {
        ...mockCard,
        labels: [
          { id: 'label-1', name: 'Bug', color: 'red' },
          { id: 'label-2', name: 'Feature', color: 'blue' },
        ],
      };

      const { useCard } = await import('../../../src/services/api/cardService');

      vi.mocked(useCard).mockReturnValue({
        data: cardWithLabels,
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    it('should assign label to card', async () => {
      const mockAssignLabel = vi.fn();
      const { useCard, useLabels, useAssignLabel } = await import(
        '../../../src/services/api/cardService'
      );

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useLabels).mockReturnValue({
        data: [{ id: 'label-1', name: 'Bug', color: 'red' }],
        isLoading: false,
      } as any);

      vi.mocked(useAssignLabel).mockReturnValue({
        mutate: mockAssignLabel,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const addLabelButton = screen.getByRole('button', { name: /add label/i });
      await user.click(addLabelButton);

      const labelOption = screen.getByText('Bug');
      await user.click(labelOption);

      expect(mockAssignLabel).toHaveBeenCalledWith({
        cardId: 'card-1',
        labelId: 'label-1',
      });
    });

    it('should remove label from card', async () => {
      const mockRemoveLabel = vi.fn();
      const cardWithLabels = {
        ...mockCard,
        labels: [{ id: 'label-1', name: 'Bug', color: 'red' }],
      };

      const { useCard, useRemoveLabel } = await import('../../../src/services/api/cardService');

      vi.mocked(useCard).mockReturnValue({
        data: cardWithLabels,
        isLoading: false,
      } as any);

      vi.mocked(useRemoveLabel).mockReturnValue({
        mutate: mockRemoveLabel,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const removeButton = screen.getByLabelText(/remove label bug/i);
      await user.click(removeButton);

      expect(mockRemoveLabel).toHaveBeenCalledWith({
        cardId: 'card-1',
        labelId: 'label-1',
      });
    });
  });

  describe('Checklists', () => {
    it('should display checklists with progress', async () => {
      const cardWithChecklists = {
        ...mockCard,
        checklists: [
          {
            id: 'checklist-1',
            name: 'Setup Tasks',
            items: [
              { id: 'item-1', text: 'Install deps', isCompleted: true },
              { id: 'item-2', text: 'Configure app', isCompleted: false },
            ],
            progress: 50,
          },
        ],
      };

      const { useCard, useChecklists } = await import('../../../src/services/api/cardService');

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useChecklists).mockReturnValue({
        data: cardWithChecklists.checklists,
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Setup Tasks')).toBeInTheDocument();
      expect(screen.getByText('Install deps')).toBeInTheDocument();
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('should add new checklist', async () => {
      const mockAddChecklist = vi.fn();
      const { useCard, useChecklists, useAddChecklist } = await import(
        '../../../src/services/api/cardService'
      );

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useChecklists).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      vi.mocked(useAddChecklist).mockReturnValue({
        mutate: mockAddChecklist,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const addChecklistButton = screen.getByRole('button', { name: /add checklist/i });
      await user.click(addChecklistButton);

      const nameInput = screen.getByPlaceholderText(/checklist name/i);
      await user.type(nameInput, 'New Checklist');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(mockAddChecklist).toHaveBeenCalledWith({
        cardId: 'card-1',
        name: 'New Checklist',
      });
    });

    it('should toggle checklist item completion', async () => {
      const mockToggleItem = vi.fn();
      const cardWithChecklists = {
        ...mockCard,
        checklists: [
          {
            id: 'checklist-1',
            name: 'Tasks',
            items: [{ id: 'item-1', text: 'Task 1', isCompleted: false }],
          },
        ],
      };

      const { useCard, useChecklists, useToggleChecklistItem } = await import(
        '../../../src/services/api/cardService'
      );

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useChecklists).mockReturnValue({
        data: cardWithChecklists.checklists,
        isLoading: false,
      } as any);

      vi.mocked(useToggleChecklistItem).mockReturnValue({
        mutate: mockToggleItem,
      } as any);

      const user = userEvent.setup();

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const checkbox = screen.getByRole('checkbox', { name: /task 1/i });
      await user.click(checkbox);

      expect(mockToggleItem).toHaveBeenCalledWith({
        itemId: 'item-1',
        isCompleted: true,
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update card when WebSocket event received', async () => {
      const { useCard } = await import('../../../src/services/api/cardService');
      const { useWebSocket } = await import('../../../src/services/websocket.service');

      const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
      };

      vi.mocked(useWebSocket).mockReturnValue({
        socket: mockSocket as any,
        isConnected: true,
      });

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(mockSocket.on).toHaveBeenCalledWith('card:updated', expect.any(Function));
    });

    it('should show real-time comment when added by another user', async () => {
      const { useCard, useComments } = await import('../../../src/services/api/cardService');
      const { useWebSocket } = await import('../../../src/services/websocket.service');

      const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
      };

      vi.mocked(useWebSocket).mockReturnValue({
        socket: mockSocket as any,
        isConnected: true,
      });

      vi.mocked(useCard).mockReturnValue({
        data: mockCard,
        isLoading: false,
      } as any);

      vi.mocked(useComments).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(<CardModal cardId="card-1" isOpen={true} onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(mockSocket.on).toHaveBeenCalledWith('card:comment:added', expect.any(Function));
    });
  });
});
