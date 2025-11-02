/**
 * T194 [US4] Organization API Client
 * User Story 4: Team Organization and Access Control
 *
 * Handles all HTTP requests related to organizations and members
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Organization Types
export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationDto {
  name: string;
  description?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
}

// Organization Member Types
export const OrganizationRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest',
} as const;

export type OrganizationRole = (typeof OrganizationRole)[keyof typeof OrganizationRole];

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: Date;
}

export interface InviteMemberDto {
  userId: string;
  role: OrganizationRole;
}

export interface ChangeMemberRoleDto {
  role: OrganizationRole;
}

/**
 * Organization API Client
 */
export class OrganizationApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api/v1') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Create a new organization
   */
  async createOrganization(dto: CreateOrganizationDto): Promise<Organization> {
    const response = await this.client.post<Organization>('/organizations', dto);
    return response.data;
  }

  /**
   * Get all organizations for the current user
   */
  async getOrganizations(): Promise<Organization[]> {
    const response = await this.client.get<Organization[]>('/organizations');
    return response.data;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization> {
    const response = await this.client.get<Organization>(`/organizations/${id}`);
    return response.data;
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const response = await this.client.put<Organization>(`/organizations/${id}`, dto);
    return response.data;
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<void> {
    await this.client.delete(`/organizations/${id}`);
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const response = await this.client.get<OrganizationMember[]>(
      `/organizations/${organizationId}/members`,
    );
    return response.data;
  }

  /**
   * Invite member to organization
   */
  async inviteMember(organizationId: string, dto: InviteMemberDto): Promise<OrganizationMember> {
    const response = await this.client.post<OrganizationMember>(
      `/organizations/${organizationId}/members`,
      dto,
    );
    return response.data;
  }

  /**
   * Change member role
   */
  async changeMemberRole(
    organizationId: string,
    userId: string,
    dto: ChangeMemberRoleDto,
  ): Promise<OrganizationMember> {
    const response = await this.client.put<OrganizationMember>(
      `/organizations/${organizationId}/members/${userId}/role`,
      dto,
    );
    return response.data;
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    await this.client.delete(`/organizations/${organizationId}/members/${userId}`);
  }
}

// Export singleton instance
export const organizationApi = new OrganizationApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
