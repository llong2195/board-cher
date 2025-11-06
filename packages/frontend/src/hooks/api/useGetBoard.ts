// useGetBoard - Fetch single board by ID
// Based on contracts/api-hooks.md

import { useState, useEffect, useCallback } from 'react';
import { boardService } from '@/services/api/board.service';
import type { Board } from '@/types/board.types';
import type { UseQueryResult } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useGetBoard(boardId: string): UseQueryResult<Board> {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const fetchBoard = useCallback(async () => {
    if (!boardId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const board = await boardService.getBoard(boardId);
      setData(board);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error({
        title: 'Failed to load board',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return {
    data,
    loading,
    error,
    refetch: fetchBoard,
  };
}
