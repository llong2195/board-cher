/**
 * T199 [US4] Organization Selector
 * User Story 4: Team Organization and Access Control
 *
 * Dropdown selector for switching between organizations
 * To be integrated into navigation/sidebar
 */

import { useState, useEffect } from 'react';
import { organizationApi, type Organization } from '../../services/api/organization.api';

interface OrganizationSelectorProps {
  currentOrganizationId?: string | null;
  onOrganizationChange?: (organizationId: string) => void;
  className?: string;
}

export function OrganizationSelector({
  currentOrganizationId,
  onOrganizationChange,
  className = '',
}: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orgs = await organizationApi.getOrganizations();
      setOrganizations(orgs);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const currentOrganization = organizations.find((org) => org.id === currentOrganizationId);

  const handleOrganizationSelect = (organizationId: string) => {
    setIsOpen(false);
    onOrganizationChange?.(organizationId);
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="px-4 py-2 bg-white border border-gray-300 rounded-md animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="px-4 py-2 bg-red-50 border border-red-300 rounded-md text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => (window.location.href = '/organizations/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Create Organization
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          {currentOrganization ? currentOrganization.name : 'Select Organization'}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>

          {/* Menu */}
          <div className="absolute left-0 right-0 z-20 mt-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  org.id === currentOrganizationId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {org.id === currentOrganizationId && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{org.name}</div>
                    {org.description && (
                      <div className="text-xs text-gray-500 truncate">{org.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {/* Create New Organization */}
            <div className="border-t border-gray-200 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/organizations/new';
                }}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Organization
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
