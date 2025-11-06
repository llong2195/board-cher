// useUpdateBoard - Update existing board
// Based on contracts/api-hooks.md

import { useState, useCallback } from 'react';
import { boardService } from '@/services/api/board.service';
import type { Board, UpdateBoardDto } from '@/types/board.types';
import type { UseMutationResult, MutationOptions } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useUpdateBoard(
  boardId: string,
  options?: MutationOptions<Board, UpdateBoardDto>,
): UseMutationResult<Board, UpdateBoardDto> {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = useCallback(
    async (variables: UpdateBoardDto): Promise<Board> => {
      setLoading(true);
      setError(null);

      try {
        const board = await boardService.updateBoard(boardId, variables);
        setData(board);

        // Call success callback
        options?.onSuccess?.(board, variables);

        return board;
      } catch (err) {
        const error = err as Error;
        setError(error);

        // Show error toast with retry
        toast.error({
          title: 'Failed to update board',
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
    [boardId, data, error, options, toast],
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
