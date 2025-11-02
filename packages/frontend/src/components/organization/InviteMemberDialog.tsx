/**
 * T196 [US4] InviteMemberDialog
 * User Story 4: Team Organization and Access Control
 *
 * Dialog component for inviting members to an organization with role selection
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  organizationApi,
  OrganizationRole,
  type OrganizationMember,
} from '../../services/api/organization.api';

interface InviteMemberDialogProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: OrganizationMember) => void;
}

export function InviteMemberDialog({
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberDialogProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<string>(OrganizationRole.MEMBER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const member = await organizationApi.inviteMember(organizationId, {
        userId,
        role: role as (typeof OrganizationRole)[keyof typeof OrganizationRole],
      });
      onSuccess(member);
      onClose();
      setUserId('');
      setRole(OrganizationRole.MEMBER);
    } catch (err) {
      console.error('Failed to invite member:', err);
      setError('Failed to invite member. Please check the user ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Invite Member</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium mb-1">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter user UUID"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={OrganizationRole.GUEST}>Guest (Read-only)</option>
              <option value={OrganizationRole.MEMBER}>Member (Can edit)</option>
              <option value={OrganizationRole.ADMIN}>Admin (Can manage members)</option>
              <option value={OrganizationRole.OWNER}>Owner (Full access)</option>
            </select>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
