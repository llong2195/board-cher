import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPlus, X, User as UserIcon } from 'lucide-react';
import axios from 'axios';

/**
 * AssigneeSelector Component (T218)
 * User Story 6: Card Assignment and Notifications
 *
 * Dropdown component for selecting and assigning board members to a card.
 * Features user search, avatar display, and assignment management.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AssigneeSelectorProps {
  boardId: string;
  cardId: string;
  selectedAssignees: User[];
  onAssign: (user: User) => void;
  onUnassign: (userId: string) => void;
  readOnly?: boolean;
}

export function AssigneeSelector({
  boardId,
  cardId,
  selectedAssignees,
  onAssign,
  onUnassign,
  readOnly = false,
}: AssigneeSelectorProps) {
  const [boardMembers, setBoardMembers] = useState<User[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  // Load board members when popover opens
  useEffect(() => {
    const loadBoardMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken');
        const response = await axios.get<User[]>(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/boards/${boardId}/members`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setBoardMembers(response.data);
        setFilteredMembers(response.data);
      } catch (err) {
        console.error('Failed to load board members:', err);
        setError('Failed to load board members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadBoardMembers();
    }
  }, [isOpen, boardId]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(boardMembers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = boardMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query),
    );
    setFilteredMembers(filtered);
  }, [searchQuery, boardMembers]);

  const handleAssignUser = async (user: User) => {
    try {
      setAssigningUserId(user.id);
      setError(null);

      const token = localStorage.getItem('authToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/cards/${cardId}/assignments/${user.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      onAssign(user);
    } catch (err) {
      console.error('Failed to assign user:', err);
      setError('Failed to assign user. Please try again.');
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    try {
      setError(null);

      const token = localStorage.getItem('authToken');
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/cards/${cardId}/assignments/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      onUnassign(userId);
    } catch (err) {
      console.error('Failed to unassign user:', err);
      setError('Failed to remove assignee. Please try again.');
    }
  };

  const isUserAssigned = (userId: string) => {
    return selectedAssignees.some((assignee) => assignee.id === userId);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (user: User) => {
    return user.avatarUrl || undefined;
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Assignees</h3>

      <div className="flex flex-wrap gap-2">
        {selectedAssignees.map((assignee) => (
          <div
            key={assignee.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm"
          >
            <div className="flex items-center gap-2">
              {assignee.avatarUrl ? (
                <img
                  src={getAvatarUrl(assignee)}
                  alt={assignee.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                  {getUserInitials(assignee.name)}
                </div>
              )}
              <span>{assignee.name}</span>
            </div>
            {!readOnly && (
              <button
                onClick={() => handleUnassignUser(assignee.id)}
                className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                title="Remove assignee"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <UserPlus className="h-4 w-4 mr-1" />
                Assign
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Assign Member</h4>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="h-9 pr-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</div>
                )}

                {/* Members list */}
                {loading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading members...</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {searchQuery
                      ? 'No members found matching your search.'
                      : 'No members available.'}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {filteredMembers.map((member) => {
                      const isAssigned = isUserAssigned(member.id);
                      const isAssigning = assigningUserId === member.id;

                      return (
                        <button
                          key={member.id}
                          onClick={() => !isAssigned && handleAssignUser(member)}
                          disabled={isAssigned || isAssigning}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                            isAssigned
                              ? 'bg-blue-50 text-blue-700 cursor-default'
                              : 'hover:bg-gray-100'
                          } ${isAssigning ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {/* Avatar */}
                          {member.avatarUrl ? (
                            <img
                              src={getAvatarUrl(member)}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {getUserInitials(member.name)}
                            </div>
                          )}

                          {/* User info */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium truncate">{member.name}</div>
                            <div className="text-xs text-gray-500 truncate">{member.email}</div>
                          </div>

                          {/* Status indicator */}
                          {isAssigned && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                              Assigned
                            </span>
                          )}
                          {isAssigning && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {selectedAssignees.length === 0 && readOnly && (
        <p className="text-sm text-gray-500">No assignees</p>
      )}
    </div>
  );
}
