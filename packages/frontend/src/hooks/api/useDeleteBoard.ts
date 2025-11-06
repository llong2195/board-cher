// useDeleteBoard - Delete board
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { boardService } from '@/services/api/board.service';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useDeleteBoard(
  boardId: string,
  options?: MutationOptions<void, void>,
): UseMutationResult<void, void> {
  const [data, setData] = useState<void | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await boardService.deleteBoard(boardId);
      setData(undefined);

      // Show success toast
      toast.success({
        title: 'Board deleted',
        description: 'Board has been permanently deleted',
      });

      // Call success callback
      options?.onSuccess?.(undefined, undefined);
    } catch (err) {
      const error = err as Error;
      setError(error);

      // Show error toast with retry
      toast.error({
        title: 'Failed to delete board',
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => mutate(),
        },
      });

      // Call error callback
      options?.onError?.(error, undefined);

      throw error;
    } finally {
      setLoading(false);
      options?.onSettled?.(data, error, undefined);
    }
  }, [boardId, data, error, options, toast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync: mutate,
    data,
    loading,
    error,
    reset,
  };
}
