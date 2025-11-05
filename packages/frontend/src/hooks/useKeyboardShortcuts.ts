/**
 * T278 [Phase 10] Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts for common actions:
 * - N: New card
 * - /: Focus search
 * - Esc: Close modal/dialog
 * - ?: Show help dialog
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  handler: () => void;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/**
 * Hook to register global keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Exception: Allow Escape key even in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      const shortcut = shortcuts.find(
        (s) =>
          s.key.toLowerCase() === event.key.toLowerCase() &&
          (s.ctrlKey ?? false) === event.ctrlKey &&
          (s.shiftKey ?? false) === event.shiftKey &&
          (s.altKey ?? false) === event.altKey,
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.handler();
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Default keyboard shortcuts configuration
 */
export const DEFAULT_SHORTCUTS: Record<string, Omit<KeyboardShortcut, 'handler'>> = {
  NEW_CARD: {
    key: 'n',
    description: 'Create new card',
  },
  SEARCH: {
    key: '/',
    description: 'Focus search',
  },
  ESCAPE: {
    key: 'Escape',
    description: 'Close modal/dialog',
  },
  HELP: {
    key: '?',
    shiftKey: true,
    description: 'Show keyboard shortcuts',
  },
  SAVE: {
    key: 's',
    ctrlKey: true,
    description: 'Save (Ctrl+S)',
  },
};

/**
 * Format shortcut key for display
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'handler'>): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  // Format key name
  let keyName = shortcut.key;
  if (keyName === ' ') keyName = 'Space';
  if (keyName === 'Escape') keyName = 'Esc';
  if (keyName.length === 1) keyName = keyName.toUpperCase();

  parts.push(keyName);

  return parts.join('+');
}
