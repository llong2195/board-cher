// useGetBoards - Fetch all boards for current user
// Based on contracts/api-hooks.md

import { useState, useEffect, useCallback } from 'react';
import { boardService } from '@/services/api/board.service';
import type { Board } from '@/types/board.types';
import type { UseQueryResult } from '@/types/api.types';
import { useToast } from '@/hooks/common/useToast';

export function useGetBoards(): UseQueryResult<Board[]> {
  const [data, setData] = useState<Board[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const boards = await boardService.getBoards();
      setData(boards);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error({
        title: 'Failed to load boards',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return {
    data,
    loading,
    error,
    refetch: fetchBoards,
  };
}
