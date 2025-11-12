# Label Module

**Domain**: Card Labels  
**Aggregate Root**: Label  
**Module Location**: `src/domain/label/`

## Overview

The Label module provides color-coded categorization for cards. Labels help users organize and filter cards by type, priority, status, or custom categories. Labels are board-scoped and can be applied to multiple cards.

## Purpose

- Create color-coded labels for boards
- Apply labels to cards (many-to-many)
- Filter cards by labels
- Customize label names and colors

## Components

### Domain Model (`label.model.ts`)

```typescript
class Label {
  id: string;
  boardId: string;
  name: string; // e.g., "Bug", "Feature", "High Priority"
  color: string; // Hex code or predefined color name
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:

- Label name optional (can be color-only)
- Label must belong to a board
- Color must be valid hex code or from predefined palette
- Board can have max 20 labels
- Label name must be unique within board (if provided)

**Key Methods**:

- `static create()` - Create new label
- `update()` - Update label name/color
- `validate()` - Enforce color validity

### Repository (`label.repository.ts`)

**Key Methods**:

- `findById(id): Promise<Label | null>`
- `findByBoard(boardId): Promise<Label[]>`
- `save(label): Promise<Label>`
- `delete(id): Promise<void>`

## Data Flow

### Creating a Label

```text
1. POST /boards/:id/labels with CreateLabelDto
2. Validate board exists and user has access
3. Validate label count < 20
4. Create Label via Label.create()
5. Save to repository
6. Emit LabelCreatedEvent
7. Return LabelResponseDto
```

### Applying Label to Card

```text
1. POST /cards/:id/labels/:labelId
2. Validate card and label belong to same board
3. Create card_label association (M:N)
4. Emit CardLabeledEvent
5. WebSocket broadcasts card update
6. Invalidate card cache
```

## Database Schema

```sql
CREATE TABLE labels (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(100),
  color VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_labels_board (board_id),
  UNIQUE (board_id, name) WHERE name IS NOT NULL
);

CREATE TABLE card_labels (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id),

  INDEX idx_card_labels_card (card_id),
  INDEX idx_card_labels_label (label_id)
);
```

**Relationships**:

- `board_id` → `boards.id` (many-to-one)
- Many-to-many with `cards` via `card_labels` junction table

## Predefined Colors

```typescript
const LABEL_COLORS = [
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
];
```

## API Endpoints

| Method | Path                               | Description            |
| ------ | ---------------------------------- | ---------------------- |
| GET    | `/boards/:id/labels`               | Get board labels       |
| POST   | `/boards/:id/labels`               | Create label           |
| PATCH  | `/labels/:id`                      | Update label           |
| DELETE | `/labels/:id`                      | Delete label           |
| POST   | `/cards/:id/labels/:labelId`       | Apply label to card    |
| DELETE | `/cards/:id/labels/:labelId`       | Remove label from card |
| GET    | `/boards/:id/cards?labels=id1,id2` | Filter cards by labels |

## Performance Considerations

- **Eager loading**: Load labels with cards to avoid N+1
- **Caching**: 5 minute TTL (rarely changes)
- **Filtering**: Use `EXISTS` subquery for label filtering
- **Expected volume**: 5-15 labels per board, 0-5 labels per card

## Related Modules

- **Board Module** - Labels belong to boards
- **Card Module** - Cards have labels (M:N)
