import React, { useEffect, useState, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
  defaultValue?: string;
  resultCount?: number;
  hasActiveSearch?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  debounceMs = 300,
  isLoading = false,
  defaultValue = '',
  resultCount,
  hasActiveSearch = false,
}) => {
  const [query, setQuery] = useState(defaultValue);
  const debounceTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update query when defaultValue changes
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, onSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Trigger search immediately on Enter
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(query.trim());
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const renderResultCount = () => {
    if (resultCount === undefined) return null;

    if (resultCount === 0 && hasActiveSearch) {
      return (
        <span className="text-sm text-muted-foreground" aria-live="polite">
          No results
        </span>
      );
    }

    return (
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {resultCount} {resultCount === 1 ? 'result' : 'results'}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-label="Search cards"
            placeholder="Search cards..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="pl-10 pr-10"
          />
          {isLoading && (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              role="status"
              aria-label="Loading search results"
              aria-live="polite"
            />
          )}
          {query && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="hidden text-xs text-muted-foreground md:block">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
      {renderResultCount()}
    </div>
  );
};
