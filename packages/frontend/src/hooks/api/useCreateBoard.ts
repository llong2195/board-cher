// useCreateBoard - Create new board
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { boardService } from '@/services/api/board.service';
import type { Board, CreateBoardDto } from '@/types/board.types';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useCreateBoard(
  options?: MutationOptions<Board, CreateBoardDto>,
): UseMutationResult<Board, CreateBoardDto> {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = useCallback(
    async (variables: CreateBoardDto): Promise<Board> => {
      setLoading(true);
      setError(null);

      try {
        const board = await boardService.createBoard(variables);
        setData(board);

        // Show success toast
        toast.success({
          title: 'Board created successfully',
          description: `Created "${board.name}"`,
        });

        // Call success callback
        options?.onSuccess?.(board, variables);

        return board;
      } catch (err) {
        const error = err as Error;
        setError(error);

        // Show error toast with retry
        toast.error({
          title: 'Failed to create board',
          description: error.message,
          action: {
            label: 'Retry',
            onClick: () => mutate(variables),
          },
        });

        // Call error callback
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

  return {
    mutate,
    mutateAsync: mutate,
    data,
    loading,
    error,
    reset,
  };
}
