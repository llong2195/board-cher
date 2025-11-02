/**
 * T197 [US4] MemberList Component
 * User Story 4: Team Organization and Access Control
 *
 * Displays organization members with role badges and management actions
 */

import { Button } from '../ui/button';
import type { OrganizationMember } from '../../services/api/organization.api';

interface MemberListProps {
  members: OrganizationMember[];
  onRemoveMember: (userId: string) => void;
  onChangeRole: (userId: string) => void;
}

export function MemberList({ members, onRemoveMember, onChangeRole }: MemberListProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (members.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No members yet. Invite members to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {member.userId.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div>
              <div className="font-medium">User {member.userId.slice(0, 8)}...</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                >
                  {member.role.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onChangeRole(member.userId)}>
              Change Role
            </Button>
            {member.role !== 'owner' && (
              <Button variant="destructive" size="sm" onClick={() => onRemoveMember(member.userId)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
