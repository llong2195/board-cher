// useReorderLists - Reorder lists horizontally on a board
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { listService } from '@/services/api/list.service';
import type { ReorderListsDto } from '@/types/list.types';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useReorderLists(
  options?: MutationOptions<void, ReorderListsDto>,
): UseMutationResult<void, ReorderListsDto> {
  const [data, setData] = useState<void | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = useCallback(
    async (variables: ReorderListsDto): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await listService.reorderLists(variables);
        setData(undefined);
        options?.onSuccess?.(undefined, variables);
      } catch (err) {
        const error = err as Error;
        setError(error);

        // Silent operation - show error toast only on failure
        toast.error({
          title: 'Failed to reorder lists',
          description: error.message,
          action: { label: 'Retry', onClick: () => mutate(variables) },
        });

        options?.onError?.(error, variables);
        throw error;
      } finally {
        setLoading(false);
        options?.onSettled?.(data, error, variables);
      }
    },
    [data, error, options, toast],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, mutateAsync: mutate, data, loading, error, reset };
}
