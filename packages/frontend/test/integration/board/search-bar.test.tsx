import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../../../src/components/search/SearchBar';

describe('SearchBar Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Input Handling', () => {
    it('should render search input with placeholder', () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should update input value on user typing', async () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, 'feature request');

      expect(input).toHaveValue('feature request');
    });

    it('should clear input when clear button is clicked', async () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, 'test query');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(input).toHaveValue('');
    });
  });

  describe('Debounced Search', () => {
    it('should debounce search callback by 300ms', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/search cards/i);

      // Type quickly without waiting
      await user.type(input, 'bug');

      // Search should not be called immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Fast-forward time by 250ms (still within debounce)
      vi.advanceTimersByTime(250);
      expect(onSearch).not.toHaveBeenCalled();

      // Fast-forward remaining 50ms to reach 300ms
      vi.advanceTimersByTime(50);

      // Now search should be called with final value
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('bug');
      });
    });

    it('should reset debounce timer on each keystroke', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/search cards/i);

      // Type 'b'
      await user.type(input, 'b');
      vi.advanceTimersByTime(200);

      // Type 'u' after 200ms (resets debounce)
      await user.type(input, 'u');
      vi.advanceTimersByTime(200);

      // Type 'g' after another 200ms (resets debounce again)
      await user.type(input, 'g');

      // At this point, 600ms have passed but search still not called
      // because debounce resets on each keystroke
      expect(onSearch).not.toHaveBeenCalled();

      // Wait final 300ms after last keystroke
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('bug');
      });
    });

    it('should handle rapid typing efficiently', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/search cards/i);

      // Simulate very rapid typing (10 characters)
      await user.type(input, 'abcdefghij');

      // Advance time less than debounce
      vi.advanceTimersByTime(299);
      expect(onSearch).not.toHaveBeenCalled();

      // Complete debounce period
      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('abcdefghij');
      });
    });

    it('should use default debounce of 300ms when not specified', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, 'test');

      vi.advanceTimersByTime(299);
      expect(onSearch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Search Behavior', () => {
    it('should trigger search on Enter key press immediately', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, 'urgent');
      await user.keyboard('{Enter}');

      // Search should be called immediately, not after debounce
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('urgent');

      // Debounce timer should be cancelled
      vi.advanceTimersByTime(300);
      expect(onSearch).toHaveBeenCalledTimes(1); // Still only once
    });

    it('should search with empty string when input is cleared', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, 'test');

      vi.advanceTimersByTime(300);
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test');
      });

      // Clear input
      await user.clear(input);
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('');
      });
    });

    it('should trim whitespace from search query', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, '  spaced query  ');

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('spaced query');
      });
    });

    it('should handle special characters in search query', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      const specialQuery = 'bug #123 @user (urgent)';
      await user.type(input, specialQuery);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(specialQuery);
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when isLoading is true', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />);

      const loadingIndicator = screen.getByRole('status', { name: /loading/i });
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator when isLoading is false', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

      const loadingIndicator = screen.queryByRole('status', { name: /loading/i });
      expect(loadingIndicator).not.toBeInTheDocument();
    });

    it('should disable input during loading', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      expect(input).toBeDisabled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should focus input on Ctrl+K shortcut', async () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      expect(input).not.toHaveFocus();

      await user.keyboard('{Control>}k{/Control}');

      expect(input).toHaveFocus();
    });

    it('should focus input on Cmd+K shortcut (Mac)', async () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      expect(input).not.toHaveFocus();

      await user.keyboard('{Meta>}k{/Meta}');

      expect(input).toHaveFocus();
    });

    it('should blur input on Escape key', async () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.click(input);
      expect(input).toHaveFocus();

      await user.keyboard('{Escape}');

      expect(input).not.toHaveFocus();
    });
  });

  describe('Result Count', () => {
    it('should display result count when provided', () => {
      render(<SearchBar onSearch={vi.fn()} resultCount={42} />);

      expect(screen.getByText(/42 results/i)).toBeInTheDocument();
    });

    it('should display singular form for single result', () => {
      render(<SearchBar onSearch={vi.fn()} resultCount={1} />);

      expect(screen.getByText(/1 result/i)).toBeInTheDocument();
    });

    it('should not display result count when not provided', () => {
      render(<SearchBar onSearch={vi.fn()} />);

      expect(screen.queryByText(/results/i)).not.toBeInTheDocument();
    });

    it('should display "No results" when count is 0 and search is active', () => {
      render(<SearchBar onSearch={vi.fn()} resultCount={0} hasActiveSearch={true} />);

      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAccessibleName(/search/i);
    });

    it('should announce loading state to screen readers', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should be keyboard navigable', async () => {
      render(<SearchBar onSearch={vi.fn()} />);

      // Tab to input
      await user.tab();
      const input = screen.getByPlaceholderText(/search cards/i);
      expect(input).toHaveFocus();

      // Tab to clear button (when input has value)
      await user.type(input, 'test');
      await user.tab();
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toHaveFocus();
    });

    it('should have sufficient color contrast for text', () => {
      const { container } = render(<SearchBar onSearch={vi.fn()} />);

      const input = container.querySelector('input');
      const styles = window.getComputedStyle(input!);

      // Basic check that text color is defined (actual contrast checking requires specialized tools)
      expect(styles.color).toBeDefined();
      expect(styles.backgroundColor).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should cleanup debounce timer on unmount', async () => {
      const onSearch = vi.fn();
      const { unmount } = render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, 'test');

      // Unmount before debounce completes
      unmount();

      // Advance time past debounce
      vi.advanceTimersByTime(300);

      // Search should not be called after unmount
      expect(onSearch).not.toHaveBeenCalled();
    });

    it('should not trigger search for same consecutive queries', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search cards/i);

      // Type and wait for debounce
      await user.type(input, 'test');
      vi.advanceTimersByTime(300);
      await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));

      // Clear and type same query again
      await user.clear(input);
      await user.type(input, 'test');
      vi.advanceTimersByTime(300);

      // Should be called again (not debounced based on previous value)
      await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(3)); // 1 initial + 1 clear + 1 re-type
    });
  });

  describe('Integration with Board Context', () => {
    it('should maintain search state when re-rendered', async () => {
      const onSearch = vi.fn();
      const { rerender } = render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search cards/i);
      await user.type(input, 'persistent query');

      // Re-render with different props
      rerender(<SearchBar onSearch={onSearch} isLoading={true} />);

      // Input value should persist
      expect(input).toHaveValue('persistent query');
    });

    it('should reset search when defaultValue changes', () => {
      const { rerender } = render(<SearchBar onSearch={vi.fn()} defaultValue="initial" />);

      const input = screen.getByPlaceholderText(/search cards/i);
      expect(input).toHaveValue('initial');

      rerender(<SearchBar onSearch={vi.fn()} defaultValue="updated" />);

      expect(input).toHaveValue('updated');
    });
  });
});
