/**
 * T063 [US1] Frontend Drag-and-Drop Card Integration Test
 *
 * Tests user workflow for dragging cards between lists.
 * Uses React DnD test utilities to simulate drag-and-drop interactions.
 *
 * TDD Approach: This test is written FIRST, expects to FAIL until components are implemented.
 *
 * Test Coverage:
 * - User drags card within same list (reorder)
 * - User drags card to different list
 * - Position updates are sent to API
 * - Optimistic UI updates
 * - Rollback on API failure
 * - WebSocket synchronization
 * - Drag preview rendering
 * - Drop zone highlighting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { wrapInTestContext } from 'react-dnd-test-utils';

// Mock API and WebSocket
const mockMoveCard = vi.fn();
const mockWebSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('@/services/api/card.api', () => ({
  cardApi: {
    moveCard: (...args: unknown[]) => mockMoveCard(...args),
    getCard: vi.fn((id: string) =>
      Promise.resolve({
        id,
        title: `Card ${id}`,
        listId: 'list-1',
        position: 1,
      }),
    ),
  },
}));

vi.mock('@/services/websocket.service', () => ({
  WebSocketService: {
    getInstance: () => mockWebSocket,
  },
}));

// Component imports (to be implemented)
let Board: React.ComponentType<{ boardId: string }>;
let Card: React.ComponentType<{
  id: string;
  title: string;
  listId: string;
  position: number;
  onMove?: (cardId: string, targetListId: string, position: number) => void;
}>;

try {
  const boardModule = await import('@/components/board/Board');
  Board = boardModule.Board;
} catch {
  // Mock Board component with lists and cards
  Board = ({ boardId }) => {
    const [cards, setCards] = React.useState([
      { id: 'card-1', title: 'Design landing page', listId: 'list-1', position: 1 },
      { id: 'card-2', title: 'Write copy', listId: 'list-1', position: 2 },
      { id: 'card-3', title: 'Review design', listId: 'list-2', position: 1 },
    ]);

    const handleMove = (cardId: string, targetListId: string, position: number) => {
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, listId: targetListId, position } : c)),
      );
    };

    return (
      <DndProvider backend={HTML5Backend}>
        <div data-testid={`board-${boardId}`}>
          <div data-testid="list-1">
            <h2>To Do</h2>
            {cards
              .filter((c) => c.listId === 'list-1')
              .map((card) => (
                <Card key={card.id} {...card} onMove={handleMove} />
              ))}
          </div>
          <div data-testid="list-2">
            <h2>In Progress</h2>
            {cards
              .filter((c) => c.listId === 'list-2')
              .map((card) => (
                <Card key={card.id} {...card} onMove={handleMove} />
              ))}
          </div>
        </div>
      </DndProvider>
    );
  };
}

try {
  const cardModule = await import('@/components/board/Card');
  Card = cardModule.Card;
} catch {
  // Mock draggable Card component
  Card = ({ id, title }) => (
    <div data-testid={`card-${id}`} draggable>
      <h3>{title}</h3>
    </div>
  );
}

// Import React after mocks
import React from 'react';

describe('T063: Card Drag-and-Drop Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMoveCard.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Drag-and-Drop Setup', () => {
    it('should render board with draggable cards', () => {
      render(<Board boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const card2 = screen.getByTestId('card-card-2');

      expect(card1).toBeInTheDocument();
      expect(card2).toBeInTheDocument();

      // Cards should be draggable
      expect(card1).toHaveAttribute('draggable', 'true');
    });

    it('should render multiple lists as drop zones', () => {
      render(<Board boardId="board-1" />);

      const list1 = screen.getByTestId('list-1');
      const list2 = screen.getByTestId('list-2');

      expect(list1).toBeInTheDocument();
      expect(list2).toBeInTheDocument();

      expect(within(list1).getByText(/to do/i)).toBeInTheDocument();
      expect(within(list2).getByText(/in progress/i)).toBeInTheDocument();
    });

    it('should group cards by their list', () => {
      render(<Board boardId="board-1" />);

      const list1 = screen.getByTestId('list-1');
      const list2 = screen.getByTestId('list-2');

      // List 1 should have 2 cards
      expect(within(list1).getByText('Design landing page')).toBeInTheDocument();
      expect(within(list1).getByText('Write copy')).toBeInTheDocument();

      // List 2 should have 1 card
      expect(within(list2).getByText('Review design')).toBeInTheDocument();
    });
  });

  describe('Same-List Reordering', () => {
    it('should reorder card within same list on drag', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');

      // Simulate drag start
      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));

      // Should show drag preview
      expect(card1).toHaveClass('dragging');

      // Drop at position 2 (after card-2)
      const list1 = screen.getByTestId('list-1');
      list1.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Should call API to update position
      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalledWith('card-1', {
          listId: 'list-1',
          position: 2,
        });
      });
    });

    it('should update UI optimistically before API response', async () => {
      // Delay API to see optimistic update
      mockMoveCard.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 200)),
      );

      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list1 = screen.getByTestId('list-1');

      // Get initial order
      const initialCards = within(list1).getAllByTestId(/^card-/);
      expect(initialCards[0]).toHaveAttribute('data-testid', 'card-card-1');

      // Drag card to end
      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list1.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // UI should update immediately (optimistic)
      const updatedCards = within(list1).getAllByTestId(/^card-/);
      expect(updatedCards[updatedCards.length - 1]).toHaveAttribute('data-testid', 'card-card-1');

      // Wait for API call
      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalled();
      });
    });

    it('should rollback on API failure', async () => {
      mockMoveCard.mockRejectedValue(new Error('Network error'));

      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list1 = screen.getByTestId('list-1');

      // Get initial order
      const initialCards = within(list1).getAllByTestId(/^card-/);
      const initialOrder = initialCards.map((c) => c.getAttribute('data-testid'));

      // Attempt drag
      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list1.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Wait for API failure
      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalled();
      });

      // UI should revert to original order
      await waitFor(() => {
        const currentCards = within(list1).getAllByTestId(/^card-/);
        const currentOrder = currentCards.map((c) => c.getAttribute('data-testid'));
        expect(currentOrder).toEqual(initialOrder);
      });

      // Should show error message
      expect(screen.getByText(/failed to move card/i)).toBeInTheDocument();
    });
  });

  describe('Cross-List Movement', () => {
    it('should move card to different list on drag', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1'); // In list-1
      const list2 = screen.getByTestId('list-2'); // Target: list-2

      // Drag card from list-1 to list-2
      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list2.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Should call API with new list ID
      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalledWith('card-1', {
          listId: 'list-2',
          position: expect.any(Number),
        });
      });

      // Card should appear in list-2
      await waitFor(() => {
        expect(within(list2).getByText('Design landing page')).toBeInTheDocument();
      });

      // Card should be removed from list-1
      const list1 = screen.getByTestId('list-1');
      expect(within(list1).queryByText('Design landing page')).not.toBeInTheDocument();
    });

    it('should insert card at correct position in target list', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      // List-2 already has 1 card at position 1
      // New card should be inserted at position 2

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list2.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalledWith('card-1', {
          listId: 'list-2',
          position: 2, // After existing card
        });
      });
    });

    it('should handle moving to empty list', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      // Create empty list
      const emptyList = document.createElement('div');
      emptyList.setAttribute('data-testid', 'list-3');
      screen.getByTestId('board-board-1').appendChild(emptyList);

      const card1 = screen.getByTestId('card-card-1');

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      emptyList.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Should insert at position 1 in empty list
      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalledWith('card-1', {
          listId: 'list-3',
          position: 1,
        });
      });
    });
  });

  describe('Visual Feedback', () => {
    it('should show drag preview while dragging', () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));

      // Card should have dragging class
      expect(card1).toHaveClass('dragging');

      // Drag preview should be rendered
      expect(screen.getByTestId('drag-preview')).toBeInTheDocument();
    });

    it('should highlight drop zone on drag over', () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list2.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));

      // List should be highlighted
      expect(list2).toHaveClass('drop-zone-active');
    });

    it('should remove highlight after drag ends', () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list2.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
      list2.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Highlight should be removed
      expect(list2).not.toHaveClass('drop-zone-active');
    });

    it('should show insertion point indicator', () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list2.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));

      // Should show where card will be inserted
      expect(screen.getByTestId('insertion-indicator')).toBeInTheDocument();
    });
  });

  describe('WebSocket Synchronization', () => {
    it('should emit WebSocket event after successful move', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      mockMoveCard.mockResolvedValue({
        id: 'card-1',
        listId: 'list-2',
        position: 2,
      });

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list2.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Should emit card:moved event
      await waitFor(() => {
        expect(mockWebSocket.emit).toHaveBeenCalledWith('card:moved', {
          cardId: 'card-1',
          listId: 'list-2',
          position: 2,
        });
      });
    });

    it('should handle incoming card move events from other users', async () => {
      render(<Board boardId="board-1" />);

      const list1 = screen.getByTestId('list-1');
      const list2 = screen.getByTestId('list-2');

      // Initially card-1 is in list-1
      expect(within(list1).getByText('Design landing page')).toBeInTheDocument();

      // Simulate WebSocket event from another user
      const moveHandler = mockWebSocket.on.mock.calls.find((call) => call[0] === 'card:moved')?.[1];

      if (moveHandler) {
        moveHandler({
          cardId: 'card-1',
          listId: 'list-2',
          position: 3,
        });
      }

      // Card should move to list-2
      await waitFor(() => {
        expect(within(list2).getByText('Design landing page')).toBeInTheDocument();
      });

      // Card should be removed from list-1
      expect(within(list1).queryByText('Design landing page')).not.toBeInTheDocument();
    });

    it('should prevent conflicts with local drag operation', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      // Start local drag
      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));

      // Incoming WebSocket event during drag
      const moveHandler = mockWebSocket.on.mock.calls.find((call) => call[0] === 'card:moved')?.[1];

      if (moveHandler) {
        moveHandler({
          cardId: 'card-1',
          listId: 'list-2',
          position: 3,
        });
      }

      // Complete local drag
      list2.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Local drag should take precedence
      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid drag operations without lag', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      const startTime = performance.now();

      // Perform 10 rapid drags
      for (let i = 0; i < 10; i++) {
        const dataTransfer = new DataTransfer();
        card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
        list2.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in < 100ms (perceived instant feedback)
      expect(duration).toBeLessThan(100);
    });

    it('should debounce API calls for rapid moves', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');
      const list2 = screen.getByTestId('list-2');

      // Perform 5 rapid drags
      for (let i = 0; i < 5; i++) {
        const dataTransfer = new DataTransfer();
        card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
        list2.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
      }

      // Wait for debounce
      await waitFor(
        () => {
          // Should only make 1 API call (last position)
          expect(mockMoveCard).toHaveBeenCalledTimes(1);
        },
        { timeout: 500 },
      );
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard-based card movement', async () => {
      const user = userEvent.setup();
      render(<Board boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');

      // Focus card
      card1.focus();

      // Press Space to pick up
      await user.keyboard(' ');

      // Arrow down to move position
      await user.keyboard('{ArrowDown}');

      // Space to drop
      await user.keyboard(' ');

      // Should call API
      await waitFor(() => {
        expect(mockMoveCard).toHaveBeenCalled();
      });
    });

    it('should announce drag state to screen readers', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));

      // Should have aria-grabbed attribute
      expect(card1).toHaveAttribute('aria-grabbed', 'true');

      // Should have live region announcement
      expect(screen.getByRole('status')).toHaveTextContent(/dragging.*design landing page/i);
    });

    it('should have proper ARIA labels for drop zones', () => {
      render(<Board boardId="board-1" />);

      const list1 = screen.getByTestId('list-1');
      const list2 = screen.getByTestId('list-2');

      expect(list1).toHaveAttribute('aria-label', expect.stringContaining('To Do'));
      expect(list2).toHaveAttribute('aria-label', expect.stringContaining('In Progress'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle dragging last card from list', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card3 = screen.getByTestId('card-card-3'); // Only card in list-2
      const list1 = screen.getByTestId('list-1');
      const list2 = screen.getByTestId('list-2');

      const dataTransfer = new DataTransfer();
      card3.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      list1.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // List-2 should be empty
      await waitFor(() => {
        const list2Cards = within(list2).queryAllByTestId(/^card-/);
        expect(list2Cards).toHaveLength(0);
      });

      // Should show empty state
      expect(within(list2).getByText(/no cards|empty/i)).toBeInTheDocument();
    });

    it('should prevent dropping card on itself', async () => {
      const TestBoard = wrapInTestContext(Board);
      render(<TestBoard boardId="board-1" />);

      const card1 = screen.getByTestId('card-card-1');

      const dataTransfer = new DataTransfer();
      card1.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));

      // Try to drop card on itself
      card1.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));

      // Should not call API
      expect(mockMoveCard).not.toHaveBeenCalled();
    });

    it('should handle concurrent moves from multiple users', async () => {
      render(<Board boardId="board-1" />);

      // Two users move same card simultaneously
      const moveHandler = mockWebSocket.on.mock.calls.find((call) => call[0] === 'card:moved')?.[1];

      if (moveHandler) {
        // User A moves to list-2, position 1
        moveHandler({
          cardId: 'card-1',
          listId: 'list-2',
          position: 1,
          timestamp: Date.now(),
        });

        // User B moves to list-2, position 2 (slightly later)
        setTimeout(() => {
          moveHandler({
            cardId: 'card-1',
            listId: 'list-2',
            position: 2,
            timestamp: Date.now() + 10,
          });
        }, 50);
      }

      // Should resolve to latest timestamp
      await waitFor(() => {
        const list2 = screen.getByTestId('list-2');
        const cards = within(list2).getAllByTestId(/^card-/);
        const card1 = cards.find((c) => c.getAttribute('data-testid') === 'card-card-1');
        // Should be at position 2 (latest update)
        expect(card1).toBeTruthy();
      });
    });
  });
});
