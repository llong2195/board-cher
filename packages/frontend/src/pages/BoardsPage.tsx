/**
 * BoardsPage Component
 * Displays all boards accessible to the current user in a grid layout
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader } from '../components/ui/card';
import { boardApi } from '../services/api/board.api';
import type { Board } from '../services/api/board.api';
import { Plus, Clock } from 'lucide-react';

export function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setIsLoading(true);
      // Get all boards - we'll need to fetch from all organizations
      // For now, use a placeholder organizationId or fetch all available boards
      const data = await boardApi.listBoards('', 1, 100); // Empty string to get all boards
      setBoards(data.data);
    } catch (err) {
      setError('Failed to load boards');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getBoardColor = (color?: string) => {
    return color || 'bg-gradient-to-br from-blue-500 to-indigo-600';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        </div>
        <p className="text-gray-600">Manage and organize your work with boards</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && boards.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No boards yet</h2>
          <p className="text-gray-600 mb-6">Create your first board to get started</p>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Board
          </Button>
        </div>
      )}

      {/* Boards Grid */}
      {boards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <Link key={board.id} to={`/boards/${board.id}`}>
              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div
                    className={`h-24 -mt-6 -mx-6 mb-4 rounded-t-lg ${getBoardColor(board.color)} flex items-center justify-center`}
                  >
                    <h3 className="text-xl font-bold text-white px-4 text-center line-clamp-2">
                      {board.name}
                    </h3>
                  </div>
                  {board.description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {board.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="flex items-center justify-between text-xs text-gray-500 pt-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {board.labels && board.labels.length > 0 && (
                    <div className="flex items-center">
                      <div className="flex -space-x-1">
                        {board.labels.slice(0, 3).map((label, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded-full border-2 border-white"
                            style={{ backgroundColor: label.color }}
                            title={label.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
