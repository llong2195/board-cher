/**
 * T195 [US4] OrganizationPage
 * User Story 4: Team Organization and Access Control
 *
 * Displays organization details, members, and boards
 * Allows organization owners/admins to manage members
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  organizationApi,
  type Organization,
  type OrganizationMember,
} from '../services/api/organization.api';
import { Button } from '../components/ui/button';

export function OrganizationPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [orgData, membersData] = await Promise.all([
        organizationApi.getOrganization(organizationId),
        organizationApi.getMembers(organizationId),
      ]);

      setOrganization(orgData);
      setMembers(membersData);
    } catch (err) {
      console.error('Failed to load organization:', err);
      setError('Failed to load organization. You may not have permission.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) {
      navigate('/organizations');
      return;
    }

    loadOrganization();
  }, [organizationId, navigate, loadOrganization]);

  const handleRemoveMember = async (userId: string) => {
    if (!organizationId) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await organizationApi.removeMember(organizationId, userId);
      setMembers(members.filter((m) => m.userId !== userId));
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Failed to remove member. You may not have permission.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading organization...</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-red-600">{error || 'Organization not found'}</div>
        <Button onClick={() => navigate('/organizations')}>Back to Organizations</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Organization Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
        {organization.description && <p className="text-gray-600">{organization.description}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Members ({members.length})</h2>
            <Button
              onClick={() => {
                /* TODO: T196 - Open InviteMemberDialog */
                alert('Invite member dialog not yet implemented');
              }}
            >
              Invite Member
            </Button>
          </div>
          <div>
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No members yet</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">User {member.userId.slice(0, 8)}...</div>
                      <div className="text-sm text-gray-500">
                        Role: <span className="font-semibold">{member.role}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          /* TODO: Change role */
                          alert('Change role not yet implemented');
                        }}
                      >
                        Change Role
                      </Button>
                      {member.role !== 'owner' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Boards Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Boards</h2>
            <Button
              onClick={() => {
                /* TODO: Create board */
                alert('Create board not yet implemented');
              }}
            >
              Create Board
            </Button>
          </div>
          <div>
            <p className="text-gray-500 text-center py-4">Boards will be listed here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
