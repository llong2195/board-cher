# Comment Module

**Domain**: Card Comments  
**Aggregate Root**: Comment  
**Module Location**: `src/domain/comment/`

## Overview

The Comment module enables threaded discussions on cards. Users can add comments, edit them, delete them, and mention other users. Comments support rich text formatting (markdown) and provide a collaboration space for card discussions.

## Purpose

- Add comments to cards for discussions
- Edit and delete own comments
- Mention users with @ syntax
- Support markdown formatting
- Real-time comment notifications

## Components

### Domain Model (`comment.model.ts`)

```typescript
class Comment {
  id: string;
  cardId: string;
  userId: string; // Author
  content: string; // Markdown text
  mentions: string[]; // User IDs mentioned with @
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:

- Comment content required (1-5000 characters)
- Comments belong to cards
- Only author can edit/delete comment
- Edited comments marked with `isEdited: true`
- Deleted comments soft-deleted (content replaced with "[deleted]")

**Key Methods**:

- `static create()` - Create new comment
- `update()` - Update comment content
- `delete()` - Soft delete comment
- `extractMentions()` - Parse @ mentions from content

### Repository (`comment.repository.ts`)

**Key Methods**:

- `findById(id): Promise<Comment | null>`
- `findByCard(cardId): Promise<Comment[]>` - Ordered by createdAt
- `save(comment): Promise<Comment>`
- `delete(id): Promise<void>`

## Data Flow

### Adding a Comment

```text
1. POST /cards/:id/comments with CreateCommentDto
2. Validate card exists and user has access
3. Create Comment via Comment.create()
4. Extract mentions from content
5. Save to repository
6. Emit CommentCreatedEvent
7. Send notifications to mentioned users
8. WebSocket broadcasts to board room
9. Return CommentResponseDto
```

### Editing a Comment

```text
1. PATCH /comments/:id with UpdateCommentDto
2. Load comment, validate author
3. Update content, set isEdited: true
4. Save to repository
5. Emit CommentUpdatedEvent
6. WebSocket broadcasts update
7. Return updated CommentResponseDto
```

## Database Schema

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  mentions UUID[], -- Array of user IDs
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_comments_card (card_id, created_at),
  INDEX idx_comments_user (user_id)
);
```

**Relationships**:

- `card_id` → `cards.id` (many-to-one)
- `user_id` → `users.id` (many-to-one, nullable if user deleted)

## API Endpoints

| Method | Path                  | Description         |
| ------ | --------------------- | ------------------- |
| GET    | `/cards/:id/comments` | Get card comments   |
| POST   | `/cards/:id/comments` | Add comment to card |
| PATCH  | `/comments/:id`       | Edit comment        |
| DELETE | `/comments/:id`       | Delete comment      |

## Performance Considerations

- **Index on (card_id, created_at)**: Fast comment list queries
- **Markdown parsing**: Server-side sanitization, client-side rendering
- **Caching**: No caching (real-time collaboration)
- **WebSocket**: Instant comment updates
- **Expected volume**: 10-50 comments per card

## Related Modules

- **Card Module** - Comments belong to cards
- **User Module** - Comments authored by users
- **Activity Module** - Comment actions logged
