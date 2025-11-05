/**
 * T278 [Phase 10] Keyboard Shortcuts Help Dialog
 *
 * Modal dialog showing all available keyboard shortcuts.
 * Triggered by pressing '?' (Shift+/)
 */

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DEFAULT_SHORTCUTS,
  formatShortcut,
  useKeyboardShortcuts,
} from '../../hooks/useKeyboardShortcuts';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Register help dialog shortcut
  useKeyboardShortcuts([
    {
      ...DEFAULT_SHORTCUTS.HELP,
      handler: () => setIsOpen((prev) => !prev),
    },
    {
      ...DEFAULT_SHORTCUTS.ESCAPE,
      handler: () => setIsOpen(false),
    },
  ]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Keyboard className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {/* Navigation */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Navigation</h3>
                <div className="space-y-2">
                  <ShortcutRow
                    keys={formatShortcut(DEFAULT_SHORTCUTS.SEARCH)}
                    description={DEFAULT_SHORTCUTS.SEARCH.description}
                  />
                  <ShortcutRow
                    keys={formatShortcut(DEFAULT_SHORTCUTS.ESCAPE)}
                    description={DEFAULT_SHORTCUTS.ESCAPE.description}
                  />
                </div>
              </section>

              {/* Actions */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Actions</h3>
                <div className="space-y-2">
                  <ShortcutRow
                    keys={formatShortcut(DEFAULT_SHORTCUTS.NEW_CARD)}
                    description={DEFAULT_SHORTCUTS.NEW_CARD.description}
                  />
                  <ShortcutRow
                    keys={formatShortcut(DEFAULT_SHORTCUTS.SAVE)}
                    description={DEFAULT_SHORTCUTS.SAVE.description}
                  />
                </div>
              </section>

              {/* Help */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Help</h3>
                <div className="space-y-2">
                  <ShortcutRow
                    keys={formatShortcut(DEFAULT_SHORTCUTS.HELP)}
                    description={DEFAULT_SHORTCUTS.HELP.description}
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Tip: Press <kbd className="px-2 py-1 bg-white border rounded text-xs">?</kbd> anytime
              to toggle this dialog
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

interface ShortcutRowProps {
  keys: string;
  description: string;
}

function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700">{description}</span>
      <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
        {keys}
      </kbd>
    </div>
  );
}
