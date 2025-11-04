/**
 * BoardActivityPage (T262)
 * User Story 7: Activity History and Audit Trail
 *
 * Full-page view of board activity accessible from board menu.
 * Shows all actions performed on the board with full-width layout.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity as ActivityIcon } from 'lucide-react';
import { ActivityFeed } from '@/components/card/ActivityFeed';
import { boardApi, type Board } from '@/services/api/board.api';

export function BoardActivityPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!boardId) {
      navigate('/');
      return;
    }

    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const loadBoard = async () => {
    if (!boardId) return;

    try {
      setIsLoading(true);
      const data = await boardApi.getBoard(boardId);
      setBoard(data);
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (boardId) {
      navigate(`/boards/${boardId}`);
    } else {
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!board || !boardId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Board not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Board
              </Button>
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-gray-600" />
                <h1 className="text-xl font-semibold">{board.name} - Activity</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">Board Activity Timeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete history of all actions performed on this board
            </p>
          </div>

          <ActivityFeed
            type="board"
            id={boardId}
            maxHeight="calc(100vh - 320px)"
            wsToken={localStorage.getItem('authToken')}
            boardId={boardId}
          />
        </div>
      </div>
    </div>
  );
}
