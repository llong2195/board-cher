// useCreateList - Create new list on a board
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { listService } from '@/services/api/list.service';
import type { List, CreateListDto } from '@/types/list.types';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useCreateList(
  options?: MutationOptions<List, CreateListDto>,
): UseMutationResult<List, CreateListDto> {
  const [data, setData] = useState<List | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = useCallback(
    async (variables: CreateListDto): Promise<List> => {
      setLoading(true);
      setError(null);

      try {
        const list = await listService.createList(variables);
        setData(list);

        toast.success('List created');
        options?.onSuccess?.(list, variables);

        return list;
      } catch (err) {
        const error = err as Error;
        setError(error);

        toast.error({
          title: 'Failed to create list',
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
