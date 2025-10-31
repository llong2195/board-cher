# Data Model: Collaborative Kanban Board Application

**Feature**: 001-kanban-board  
**Date**: 2025-10-31  
**Phase**: 1 - Design & Contracts

## Entity Relationship Overview

```
User ──< OrganizationMember >── Organization
  │                                    │
  │                                    │
  └──< BoardMember >── Board ─────────┘
           │            │
           │            └──< List ──< Card ──< Comment
           │                   │        │
           │                   │        ├──< Attachment
           │                   │        ├──< CardLabel >── Label
           │                   │        ├──< CardAssignment
           │                   │        ├──< Checklist ──< ChecklistItem
           │                   │        └──< Activity
           │                   │
           └───────────────────┘
```

---

## Core Entities

### 1. User

Represents an authenticated person using the application.

**Aggregate Root**: Yes

**Fields**:
- `id` (UUID, PK): Unique identifier
- `email` (string, unique, required): User email address
- `passwordHash` (string, required): Bcrypt hashed password
- `name` (string, required): Display name
- `avatarUrl` (string, nullable): Profile picture URL
- `createdAt` (timestamp, required): Account creation time
- `updatedAt` (timestamp, required): Last profile update
- `lastLoginAt` (timestamp, nullable): Last successful login

**Relationships**:
- Has many `OrganizationMember` (user's organization memberships)
- Has many `BoardMember` (board access permissions)
- Has many `CardAssignment` (assigned cards)
- Has many `Comment` (authored comments)
- Has many `Activity` (actions performed)

**Validation Rules**:
- Email must be valid format (RFC 5322)
- Password minimum 8 characters, must hash before storage
- Name minimum 2 characters, maximum 100 characters

**Indexes**:
- Primary: `id`
- Unique: `email`
- Index: `createdAt` (for user growth analytics)

---

### 2. Organization

Represents a team or company that owns boards.

**Aggregate Root**: Yes

**Fields**:
- `id` (UUID, PK): Unique identifier
- `name` (string, required): Organization display name
- `slug` (string, unique, required): URL-friendly identifier
- `description` (text, nullable): Organization description
- `logoUrl` (string, nullable): Organization logo
- `createdAt` (timestamp, required): Creation time
- `updatedAt` (timestamp, required): Last update time

**Relationships**:
- Has many `OrganizationMember` (members with roles)
- Has many `Board` (owned boards)

**Validation Rules**:
- Name minimum 2 characters, maximum 100 characters
- Slug must be lowercase alphanumeric + hyphens, unique

**Indexes**:
- Primary: `id`
- Unique: `slug`
- Index: `createdAt`

---

### 3. OrganizationMember

Join table representing user membership in an organization with role.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `organizationId` (UUID, FK, required): References `Organization.id`
- `userId` (UUID, FK, required): References `User.id`
- `role` (enum, required): One of: `owner`, `admin`, `member`
- `joinedAt` (timestamp, required): When user joined organization

**Relationships**:
- Belongs to `Organization`
- Belongs to `User`

**Validation Rules**:
- Composite unique: `(organizationId, userId)` - user can't join org twice
- Organization must have at least one owner
- Role must be valid enum value

**Indexes**:
- Primary: `id`
- Unique: `(organizationId, userId)`
- Index: `organizationId` (lookup members by org)
- Index: `userId` (lookup user's orgs)

**Role Permissions**:
- `owner`: All permissions, can delete organization, manage all members
- `admin`: Manage members (except owners), manage boards, manage settings
- `member`: View organization, view boards, create boards (if allowed)

---

### 4. Board

Represents a project workspace containing lists and cards.

**Aggregate Root**: Yes

**Fields**:
- `id` (UUID, PK): Unique identifier
- `organizationId` (UUID, FK, required): References `Organization.id`
- `name` (string, required): Board display name
- `description` (text, nullable): Board purpose description
- `color` (string, nullable): Board background color (hex)
- `isArchived` (boolean, default false): Soft delete flag
- `createdAt` (timestamp, required): Creation time
- `updatedAt` (timestamp, required): Last update time
- `createdBy` (UUID, FK, required): References `User.id`

**Relationships**:
- Belongs to `Organization`
- Has many `BoardMember` (access permissions)
- Has many `List` (columns on board)
- Has many `Label` (board-specific labels)
- Has many `Activity` (board-level audit log)
- Created by `User`

**Validation Rules**:
- Name minimum 1 character, maximum 200 characters
- Must belong to an organization
- Color must be valid hex format if provided

**Indexes**:
- Primary: `id`
- Index: `organizationId` (lookup org's boards)
- Index: `(organizationId, isArchived)` (active boards query)
- Index: `createdBy`
- Index: `createdAt`

---

### 5. BoardMember

Join table representing user access to a specific board with role.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `boardId` (UUID, FK, required): References `Board.id`
- `userId` (UUID, FK, required): References `User.id`
- `role` (enum, required): One of: `admin`, `member`, `guest`
- `joinedAt` (timestamp, required): When user added to board

**Relationships**:
- Belongs to `Board`
- Belongs to `User`

**Validation Rules**:
- Composite unique: `(boardId, userId)` - user can't be added twice
- Role must be valid enum value
- Guest role can only read, not write

**Indexes**:
- Primary: `id`
- Unique: `(boardId, userId)`
- Index: `boardId` (lookup board members)
- Index: `userId` (lookup user's boards)

**Role Permissions**:
- `admin`: Full control of board (edit, delete, manage members)
- `member`: Create/edit/delete lists and cards
- `guest`: View only (read-only access)

---

### 6. List

Represents a workflow stage column on a board (e.g., "To Do", "In Progress").

**Entity** (within Board aggregate)

**Fields**:
- `id` (UUID, PK): Unique identifier
- `boardId` (UUID, FK, required): References `Board.id`
- `name` (string, required): Column name
- `position` (integer, required): Sort order (0-based)
- `isArchived` (boolean, default false): Soft delete flag
- `createdAt` (timestamp, required): Creation time
- `updatedAt` (timestamp, required): Last update time

**Relationships**:
- Belongs to `Board`
- Has many `Card` (cards in this list)

**Validation Rules**:
- Name minimum 1 character, maximum 100 characters
- Position must be unique within board
- Cannot archive list with unarchived cards (must move or archive cards first)

**Indexes**:
- Primary: `id`
- Index: `boardId` (lookup board's lists)
- Index: `(boardId, position)` (ordered lists query)
- Index: `(boardId, isArchived)`

**Position Management**:
- Positions are 0-indexed integers
- When list moved, positions recalculated for affected lists
- Drag-and-drop updates position field

---

### 7. Card

Represents a work item or task on the board.

**Aggregate Root**: Yes

**Fields**:
- `id` (UUID, PK): Unique identifier
- `listId` (UUID, FK, required): References `List.id`
- `title` (string, required): Card title
- `description` (text, nullable): Detailed description (Markdown supported)
- `position` (integer, required): Sort order within list (0-based)
- `dueDate` (timestamp, nullable): Due date for card
- `isArchived` (boolean, default false): Soft delete flag
- `createdAt` (timestamp, required): Creation time
- `updatedAt` (timestamp, required): Last update time
- `createdBy` (UUID, FK, required): References `User.id`

**Relationships**:
- Belongs to `List`
- Has many `Comment` (card comments)
- Has many `Attachment` (file attachments)
- Has many `CardLabel` (applied labels)
- Has many `CardAssignment` (assigned users)
- Has many `Checklist` (task breakdowns)
- Has many `Activity` (card-level audit log)
- Created by `User`

**Validation Rules**:
- Title minimum 1 character, maximum 500 characters
- Position must be unique within list
- Description maximum 50,000 characters
- Due date must be future or null

**Indexes**:
- Primary: `id`
- Index: `listId` (lookup list's cards)
- Index: `(listId, position)` (ordered cards query)
- Index: `(listId, isArchived)`
- Index: `createdBy`
- Index: `dueDate` (due date queries)
- Index: `updatedAt` (recent activity)

**Position Management**:
- Similar to List positioning
- When card moved between lists, position updated in both source and target

---

### 8. Comment

Represents user feedback or discussion on a card.

**Entity** (within Card aggregate)

**Fields**:
- `id` (UUID, PK): Unique identifier
- `cardId` (UUID, FK, required): References `Card.id`
- `userId` (UUID, FK, required): References `User.id` (author)
- `content` (text, required): Comment text (Markdown supported)
- `createdAt` (timestamp, required): Creation time
- `updatedAt` (timestamp, required): Last edit time
- `isEdited` (boolean, default false): Indicates if comment was edited

**Relationships**:
- Belongs to `Card`
- Belongs to `User` (author)

**Validation Rules**:
- Content minimum 1 character, maximum 10,000 characters
- Cannot be empty or whitespace only
- Deleted comments soft-delete (set content to "[deleted]", preserve author)

**Indexes**:
- Primary: `id`
- Index: `cardId` (lookup card's comments)
- Index: `userId` (user's comments)
- Index: `createdAt` (chronological order)

---

### 9. Attachment

Represents file metadata for files attached to cards.

**Value Object** (within Card aggregate)

**Fields**:
- `id` (UUID, PK): Unique identifier
- `cardId` (UUID, FK, required): References `Card.id`
- `userId` (UUID, FK, required): References `User.id` (uploader)
- `filename` (string, required): Original file name
- `mimeType` (string, required): File MIME type
- `fileSize` (integer, required): File size in bytes
- `storagePath` (string, required): Storage location path/key
- `uploadedAt` (timestamp, required): Upload time

**Relationships**:
- Belongs to `Card`
- Uploaded by `User`

**Validation Rules**:
- Filename maximum 255 characters
- File size maximum 10MB (10,485,760 bytes)
- Mime type must be in allowed list (images, PDFs, Office docs)
- Storage path must be unique

**Indexes**:
- Primary: `id`
- Index: `cardId` (lookup card's attachments)
- Index: `userId` (user's uploads)
- Unique: `storagePath`

**Allowed MIME Types**:
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`
- Archives: `application/zip`, `application/x-rar-compressed`

---

### 10. Label

Represents a categorization tag for cards (e.g., "Bug", "Feature").

**Entity** (within Board context)

**Fields**:
- `id` (UUID, PK): Unique identifier
- `boardId` (UUID, FK, required): References `Board.id`
- `name` (string, required): Label name
- `color` (string, required): Label color (predefined palette or hex)
- `createdAt` (timestamp, required): Creation time

**Relationships**:
- Belongs to `Board`
- Has many `CardLabel` (cards with this label)

**Validation Rules**:
- Name minimum 1 character, maximum 50 characters
- Color must be valid hex or from predefined palette
- Composite unique: `(boardId, name)` - no duplicate label names per board

**Indexes**:
- Primary: `id`
- Index: `boardId` (lookup board's labels)
- Unique: `(boardId, name)`

**Predefined Colors**:
- Red: `#ef4444`, Yellow: `#eab308`, Green: `#22c55e`, Blue: `#3b82f6`, Purple: `#a855f7`, Pink: `#ec4899`, Gray: `#6b7280`

---

### 11. CardLabel

Join table representing labels applied to cards.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `cardId` (UUID, FK, required): References `Card.id`
- `labelId` (UUID, FK, required): References `Label.id`
- `appliedAt` (timestamp, required): When label applied

**Relationships**:
- Belongs to `Card`
- Belongs to `Label`

**Validation Rules**:
- Composite unique: `(cardId, labelId)` - can't apply same label twice
- Label must belong to same board as card

**Indexes**:
- Primary: `id`
- Unique: `(cardId, labelId)`
- Index: `cardId` (card's labels)
- Index: `labelId` (cards with label - for filtering)

---

### 12. CardAssignment

Join table representing users assigned to cards.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `cardId` (UUID, FK, required): References `Card.id`
- `userId` (UUID, FK, required): References `User.id`
- `assignedAt` (timestamp, required): When user assigned
- `assignedBy` (UUID, FK, required): References `User.id` (who assigned)

**Relationships**:
- Belongs to `Card`
- Belongs to `User` (assignee)
- Assigned by `User`

**Validation Rules**:
- Composite unique: `(cardId, userId)` - can't assign same user twice
- User must have access to card's board
- Self-assignment allowed

**Indexes**:
- Primary: `id`
- Unique: `(cardId, userId)`
- Index: `cardId` (card's assignees)
- Index: `userId` (user's assigned cards - for "assigned to me" view)

---

### 13. Checklist

Represents a task breakdown within a card.

**Entity** (within Card aggregate)

**Fields**:
- `id` (UUID, PK): Unique identifier
- `cardId` (UUID, FK, required): References `Card.id`
- `title` (string, required): Checklist title
- `position` (integer, required): Sort order (0-based)
- `createdAt` (timestamp, required): Creation time

**Relationships**:
- Belongs to `Card`
- Has many `ChecklistItem` (individual items)

**Validation Rules**:
- Title minimum 1 character, maximum 200 characters
- Position must be unique within card

**Indexes**:
- Primary: `id`
- Index: `cardId` (card's checklists)
- Index: `(cardId, position)`

**Computed Field**:
- `completionPercentage`: `(completedItems / totalItems) * 100`

---

### 14. ChecklistItem

Represents a single item in a checklist.

**Entity** (within Checklist)

**Fields**:
- `id` (UUID, PK): Unique identifier
- `checklistId` (UUID, FK, required): References `Checklist.id`
- `text` (string, required): Item description
- `position` (integer, required): Sort order (0-based)
- `isCompleted` (boolean, default false): Completion status
- `completedAt` (timestamp, nullable): When marked complete
- `completedBy` (UUID, FK, nullable): References `User.id`
- `createdAt` (timestamp, required): Creation time

**Relationships**:
- Belongs to `Checklist`
- Completed by `User` (nullable)

**Validation Rules**:
- Text minimum 1 character, maximum 500 characters
- Position must be unique within checklist
- If `isCompleted` true, `completedAt` and `completedBy` must be set

**Indexes**:
- Primary: `id`
- Index: `checklistId` (checklist's items)
- Index: `(checklistId, position)`

---

### 15. Activity

Represents an audit log entry for actions performed on boards or cards.

**Entity** (audit/event log)

**Fields**:
- `id` (UUID, PK): Unique identifier
- `userId` (UUID, FK, required): References `User.id` (actor)
- `boardId` (UUID, FK, nullable): References `Board.id` (if board-level)
- `cardId` (UUID, FK, nullable): References `Card.id` (if card-level)
- `actionType` (enum, required): Type of action performed
- `entityType` (enum, required): What was affected (Board, List, Card, etc.)
- `entityId` (UUID, required): ID of affected entity
- `metadata` (jsonb, nullable): Additional context (old/new values, etc.)
- `createdAt` (timestamp, required): When action occurred

**Relationships**:
- Belongs to `User` (actor)
- Optionally belongs to `Board` (board-level actions)
- Optionally belongs to `Card` (card-level actions)

**Validation Rules**:
- Must have either `boardId` or `cardId` (or both)
- `actionType` must be valid enum
- `entityType` must be valid enum

**Indexes**:
- Primary: `id`
- Index: `boardId, createdAt DESC` (board activity feed)
- Index: `cardId, createdAt DESC` (card activity feed)
- Index: `userId` (user's actions)
- Index: `createdAt` (recent activity)

**Action Types** (enum):
- `BOARD_CREATED`, `BOARD_UPDATED`, `BOARD_DELETED`, `BOARD_ARCHIVED`
- `LIST_CREATED`, `LIST_UPDATED`, `LIST_MOVED`, `LIST_DELETED`, `LIST_ARCHIVED`
- `CARD_CREATED`, `CARD_UPDATED`, `CARD_MOVED`, `CARD_DELETED`, `CARD_ARCHIVED`
- `COMMENT_ADDED`, `COMMENT_EDITED`, `COMMENT_DELETED`
- `ATTACHMENT_ADDED`, `ATTACHMENT_DELETED`
- `LABEL_ADDED`, `LABEL_REMOVED`, `LABEL_CREATED`, `LABEL_DELETED`
- `MEMBER_ASSIGNED`, `MEMBER_UNASSIGNED`
- `CHECKLIST_CREATED`, `CHECKLIST_ITEM_CHECKED`, `CHECKLIST_ITEM_UNCHECKED`
- `DUE_DATE_SET`, `DUE_DATE_REMOVED`

**Entity Types** (enum):
- `BOARD`, `LIST`, `CARD`, `COMMENT`, `ATTACHMENT`, `LABEL`, `CHECKLIST`, `USER`

---

## Database Migrations

### Migration 001: Initial Schema

Create all base tables with primary keys, foreign keys, and indexes.

**Tables Created**:
1. `users`
2. `organizations`
3. `organization_members`
4. `boards`
5. `board_members`
6. `lists`
7. `cards`
8. `comments`
9. `attachments`
10. `labels`
11. `card_labels`
12. `card_assignments`
13. `checklists`
14. `checklist_items`
15. `activities`

**Foreign Key Constraints**:
- All FK constraints with `ON DELETE CASCADE` except user references (use `ON DELETE SET NULL` for audit trails)
- Ensure referential integrity

**Indexes**:
- All indexes listed in entity definitions above
- Composite indexes for join tables
- Timestamp indexes for sorting

---

## Data Integrity Rules

### Cascade Delete Rules

1. **User Deleted**: 
   - Set `createdBy` to NULL in boards/cards (preserve content)
   - Set `userId` to NULL in activities (preserve audit log)
   - Delete organization_members, board_members, card_assignments

2. **Organization Deleted**:
   - Cascade delete all boards
   - Cascade delete organization_members

3. **Board Deleted**:
   - Cascade delete lists, labels, board_members, activities

4. **List Deleted**:
   - Cascade delete cards (or require moving cards first)

5. **Card Deleted**:
   - Cascade delete comments, attachments, card_labels, card_assignments, checklists, activities

### Constraints

- At least one organization owner must exist
- Board must have at least one admin
- Position fields must be sequential (0, 1, 2, ...)
- Email addresses must be unique system-wide
- Organization slugs must be unique system-wide

---

## Sample Data Structure

### Example Board Hierarchy

```
Organization: "Acme Corp"
└── Board: "Marketing Campaign Q1"
    ├── List: "Backlog" (position: 0)
    │   ├── Card: "Design landing page" (position: 0)
    │   │   ├── Label: "Design" (blue)
    │   │   ├── Assigned: Alice, Bob
    │   │   ├── Checklist: "Design Tasks"
    │   │   │   ├── Item: "Create wireframe" ✓
    │   │   │   └── Item: "Design mockup"
    │   │   └── Comment: "Should use brand colors"
    │   └── Card: "Write copy" (position: 1)
    ├── List: "In Progress" (position: 1)
    │   └── Card: "Set up analytics" (position: 0)
    └── List: "Complete" (position: 2)
```

---

## TypeORM Entity Mapping Notes

- Domain entities in `src/domain/` contain business logic
- TypeORM entities in `src/infrastructure/persistence/entities/` are persistence models
- Repositories map between domain and persistence layers
- Use TypeORM decorators: `@Entity`, `@Column`, `@ManyToOne`, `@OneToMany`, `@Index`, `@Unique`
- Enable `synchronize: false` in production, use migrations only

---

## Next Steps

1. Create OpenAPI specification for REST API endpoints
2. Document WebSocket events and payloads
3. Generate TypeORM migration files
4. Create seed data for development/testing
