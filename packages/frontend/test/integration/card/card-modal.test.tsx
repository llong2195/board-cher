/**
 * T122 [US2] Frontend Card Modal Integration Tests
 * Simplified version focusing on key functionality
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardModal } from '../../../src/components/card/CardModal';

// Mock all API modules
vi.mock('../../../src/services/api/card.api', () => ({
  cardApi: {
    getDetails: vi.fn().mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      title: 'Test Card',
      description: 'Test description',
      position: 0,
      isArchived: false,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
}));

vi.mock('../../../src/services/api/comment.api', () => ({
  commentApi: {
    getCardComments: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../src/services/api/attachment.api', () => ({
  attachmentApi: {
    getCardAttachments: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../src/services/api/label.api', () => ({
  labelApi: {
    getBoardLabels: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../src/services/api/checklist.api', () => ({
  checklistApi: {
    getCardChecklists: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    isConnected: true,
  })),
}));

describe('CardModal - T122', () => {
  const mockOnClose = vi.fn();

  it('should not render when closed', () => {
    render(<CardModal cardId="card-1" boardId="board-1" isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render modal when open', async () => {
    render(<CardModal cardId="card-1" boardId="board-1" isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('Test Card', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<CardModal cardId="card-1" boardId="board-1" isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
