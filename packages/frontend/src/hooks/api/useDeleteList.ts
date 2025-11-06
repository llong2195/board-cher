// useDeleteList - Delete list and all its cards
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { listService } from '@/services/api/list.service';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useDeleteList(
  listId: string,
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
      await listService.deleteList(listId);
      setData(undefined);

      toast.success('List deleted');
      options?.onSuccess?.(undefined, undefined);
    } catch (err) {
      const error = err as Error;
      setError(error);

      toast.error({
        title: 'Failed to delete list',
        description: error.message,
        action: { label: 'Retry', onClick: () => mutate() },
      });

      options?.onError?.(error, undefined);
      throw error;
    } finally {
      setLoading(false);
      options?.onSettled?.(data, error, undefined);
    }
  }, [listId, data, error, options, toast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, mutateAsync: mutate, data, loading, error, reset };
}
