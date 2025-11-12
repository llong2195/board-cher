# Organization Module

**Domain**: Multi-Tenant Organizations  
**Aggregate Root**: Organization  
**Module Location**: `src/domain/organization/`

## Overview

The Organization module provides multi-tenancy support, allowing multiple teams or companies to use the system with data isolation. Organizations own boards and manage user memberships with role-based access control.

## Purpose

- Create and manage organizations (teams/companies)
- Manage organization members and roles
- Isolate data between organizations
- Configure organization settings and billing
- Track organization usage and limits

## Components

### Domain Model (`organization.model.ts`)

```typescript
class Organization {
  id: string;
  name: string;
  slug: string; // Unique URL-friendly identifier
  description: string | null;
  logoUrl: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  maxMembers: number;
  maxBoards: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string; // Organization owner
}
```

**Business Rules**:

- Organization name required (1-100 characters)
- Slug must be unique and URL-safe (lowercase, alphanumeric, hyphens)
- Free plan: 5 members, 10 boards
- Pro plan: 50 members, unlimited boards
- Enterprise plan: unlimited members, unlimited boards
- Only owner can delete organization
- Deleting organization cascades to all boards

**Key Methods**:

- `static create()` - Create new organization
- `update()` - Update organization metadata
- `addMember()` - Add user to organization
- `removeMember()` - Remove user from organization
- `changePlan()` - Upgrade/downgrade plan
- `canAddMember()` - Check if member limit reached
- `canAddBoard()` - Check if board limit reached

### Repository (`organization.repository.ts`)

**Key Methods**:

- `findById(id): Promise<Organization | null>`
- `findBySlug(slug): Promise<Organization | null>`
- `findByUser(userId): Promise<Organization[]>`
- `save(org): Promise<Organization>`
- `delete(id): Promise<void>`

## Data Flow

### Creating an Organization

```text
1. POST /organizations with CreateOrganizationDto
2. Validate slug uniqueness
3. Create Organization via Organization.create()
4. Set creator as owner
5. Save to repository
6. Add creator as organization member (admin role)
7. Emit OrganizationCreatedEvent
8. Return OrganizationResponseDto
```

### Adding Member to Organization

```text
1. POST /organizations/:id/members with { email, role }
2. Validate user has admin role in organization
3. Check member limit not exceeded
4. Find user by email or send invitation
5. Create organization_member record
6. Emit MemberAddedEvent
7. Send invitation email if user not registered
8. Return MemberResponseDto
```

## Database Schema

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  max_members INTEGER NOT NULL,
  max_boards INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES users(id),

  INDEX idx_organizations_slug (slug),
  INDEX idx_organizations_owner (owner_id)
);

CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'owner', 'admin', 'member', 'guest'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id),

  INDEX idx_org_members_organization (organization_id),
  INDEX idx_org_members_user (user_id)
);
```

**Relationships**:

- `owner_id` → `users.id` (many-to-one)
- Many-to-many with `users` via `organization_members`
- One-to-many with `boards` (boards belong to organizations)

## Roles and Permissions

| Role       | Permissions                                       |
| ---------- | ------------------------------------------------- |
| **Owner**  | Full control, delete organization, manage billing |
| **Admin**  | Manage members, create boards, manage settings    |
| **Member** | Create boards, view organization boards           |
| **Guest**  | View specific boards (invite-only)                |

## API Endpoints

| Method | Path                                      | Description               |
| ------ | ----------------------------------------- | ------------------------- |
| GET    | `/organizations`                          | List user's organizations |
| GET    | `/organizations/:id`                      | Get organization details  |
| POST   | `/organizations`                          | Create organization       |
| PATCH  | `/organizations/:id`                      | Update organization       |
| DELETE | `/organizations/:id`                      | Delete organization       |
| GET    | `/organizations/:id/members`              | List organization members |
| POST   | `/organizations/:id/members`              | Add member                |
| DELETE | `/organizations/:id/members/:userId`      | Remove member             |
| PATCH  | `/organizations/:id/members/:userId/role` | Change member role        |

## Performance Considerations

- **Index on slug**: Fast organization lookup by URL
- **Index on owner_id**: Fast "my organizations" queries
- **Caching**: 10 minute TTL (rarely changes)
- **Member count**: Use COUNT query with caching
- **Expected volume**: 1-5 organizations per user

## Related Modules

- **Board Module** - Boards belong to organizations
- **User Module** - Users are organization members
- **Activity Module** - Track organization changes
