import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { List } from './List';
import { ListSkeleton } from '../skeleton/ListSkeleton';
import { useBoardStore } from '../../stores/board.store';
import { useState } from 'react';
import { CreateListForm } from './CreateListForm';
import type { OrganizationRole } from '../../services/api/organization.api';

/**
 * Board Component
 * Main board view with lists and drag-and-drop
 */

interface BoardProps {
  boardId: string;
  userRole?: OrganizationRole | null;
  isLoadingRole?: boolean;
}

export function Board({ boardId, userRole, isLoadingRole }: BoardProps) {
  const board = useBoardStore((state) => state.board);
  const lists = useBoardStore((state) => state.lists);
  const isLoading = useBoardStore((state) => state.isLoadingLists);
  const [showAddList, setShowAddList] = useState(false);

  // Determine if user has edit permissions (not a guest)
  const canEdit = !isLoadingRole && userRole !== 'guest';

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Board Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
              {board.description && (
                <p className="text-sm text-gray-600 mt-1">{board.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canEdit}
              >
                Share
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canEdit}
              >
                ⋯
              </button>
            </div>
          </div>
        </div>

        {/* Lists Container */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full">
            {isLoading ? (
              <>
                <ListSkeleton cardCount={3} />
                <ListSkeleton cardCount={2} />
                <ListSkeleton cardCount={4} />
                <div className="flex-shrink-0 w-72 h-20 bg-gray-100 rounded-lg animate-pulse" />
              </>
            ) : (
              <>
                {lists.map((list) => (
                  <List
                    key={list.id}
                    listId={list.id}
                    name={list.name}
                    position={list.position}
                    canEdit={canEdit}
                  />
                ))}

                {/* Add List - Only show for users with edit permissions */}
                {canEdit && (
                  <div className="flex-shrink-0 w-72">
                    {showAddList ? (
                      <CreateListForm
                        boardId={boardId}
                        onCancel={() => setShowAddList(false)}
                        onSuccess={() => setShowAddList(false)}
                      />
                    ) : (
                      <button
                        onClick={() => setShowAddList(true)}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        + Add another list
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
