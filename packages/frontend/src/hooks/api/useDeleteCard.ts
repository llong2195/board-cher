// useDeleteCard - Delete card
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { cardService } from '@/services/api/card.service';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useDeleteCard(
  cardId: string,
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
      await cardService.deleteCard(cardId);
      setData(undefined);

      toast.success('Card deleted');
      options?.onSuccess?.(undefined, undefined);
    } catch (err) {
      const error = err as Error;
      setError(error);

      toast.error({
        title: 'Failed to delete card',
        description: error.message,
        action: { label: 'Retry', onClick: () => mutate() },
      });

      options?.onError?.(error, undefined);
      throw error;
    } finally {
      setLoading(false);
      options?.onSettled?.(data, error, undefined);
    }
  }, [cardId, data, error, options, toast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, mutateAsync: mutate, data, loading, error, reset };
}
