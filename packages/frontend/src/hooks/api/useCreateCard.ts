// useCreateCard - Create new card in a list
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { cardService } from '@/services/api/card.service';
import type { Card, CreateCardDto } from '@/types/card.types';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useCreateCard(
  options?: MutationOptions<Card, CreateCardDto>,
): UseMutationResult<Card, CreateCardDto> {
  const [data, setData] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = useCallback(
    async (variables: CreateCardDto): Promise<Card> => {
      setLoading(true);
      setError(null);

      try {
        const card = await cardService.createCard(variables);
        setData(card);

        toast.success('Card created');
        options?.onSuccess?.(card, variables);

        return card;
      } catch (err) {
        const error = err as Error;
        setError(error);

        toast.error({
          title: 'Failed to create card',
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
