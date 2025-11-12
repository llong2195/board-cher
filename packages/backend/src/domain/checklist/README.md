# Checklist Module

**Domain**: Card Checklists  
**Aggregate Root**: Checklist  
**Module Location**: `src/domain/checklist/`

## Overview

The Checklist module enables task tracking within cards. Checklists contain multiple checkable items, providing a way to break down card work into smaller subtasks. This module supports progress tracking and completion percentages.

## Purpose

- Create checklists for cards
- Add/remove checklist items
- Mark items as complete/incomplete
- Track checklist progress (% complete)
- Reorder checklist items

## Components

### Domain Models

**Checklist** (`checklist.model.ts`):

```typescript
class Checklist {
  id: string;
  cardId: string;
  title: string; // e.g., "Implementation Steps"
  position: number; // Order on card
  createdAt: Date;
  updatedAt: Date;
  items: ChecklistItem[]; // Child items
}
```

**ChecklistItem** (`checklist-item.model.ts`):

```typescript
class ChecklistItem {
  id: string;
  checklistId: string;
  content: string; // Item text
  isCompleted: boolean;
  position: number; // Order in checklist
  assignedUserId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:

- Checklist title required (1-255 characters)
- Checklist must belong to a card
- Item content required (1-500 characters)
- Progress = completedItems / totalItems
- Deleting checklist deletes all items (cascade)

**Key Methods**:

- `Checklist.create()` - Create new checklist
- `Checklist.addItem()` - Add item to checklist
- `ChecklistItem.toggle()` - Mark complete/incomplete
- `Checklist.getProgress()` - Calculate % complete

### Repository (`checklist.repository.ts`)

**Key Methods**:

- `findById(id): Promise<Checklist | null>`
- `findByCard(cardId): Promise<Checklist[]>`
- `save(checklist): Promise<Checklist>`
- `delete(id): Promise<void>`
- `saveItem(item): Promise<ChecklistItem>`
- `deleteItem(itemId): Promise<void>`

## Data Flow

### Creating a Checklist

```text
1. POST /cards/:id/checklists with CreateChecklistDto
2. Validate card exists and user has access
3. Calculate position (end of card)
4. Create Checklist via Checklist.create()
5. Save to repository
6. Emit ChecklistCreatedEvent
7. WebSocket broadcasts to board
8. Return ChecklistResponseDto
```

### Toggling Checklist Item

```text
1. PATCH /checklist-items/:id/toggle
2. Load checklist item
3. Call item.toggle() (flip isCompleted)
4. Save item to repository
5. Update card progress (if all checklists complete, suggest archiving card)
6. Emit ChecklistItemToggledEvent
7. WebSocket broadcasts real-time update
8. Return updated ChecklistItemResponseDto
```

## Database Schema

```sql
CREATE TABLE checklists (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_checklists_card (card_id),
  INDEX idx_checklists_card_position (card_id, position)
);

CREATE TABLE checklist_items (
  id UUID PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_checklist_items_checklist (checklist_id),
  INDEX idx_checklist_items_checklist_position (checklist_id, position)
);
```

**Relationships**:

- `card_id` → `cards.id` (many-to-one)
- `checklist_id` → `checklists.id` (many-to-one)
- `assigned_user_id` → `users.id` (many-to-one, nullable)

## API Endpoints

| Method | Path                          | Description            |
| ------ | ----------------------------- | ---------------------- |
| GET    | `/cards/:id/checklists`       | Get card checklists    |
| POST   | `/cards/:id/checklists`       | Create checklist       |
| PATCH  | `/checklists/:id`             | Update checklist title |
| DELETE | `/checklists/:id`             | Delete checklist       |
| POST   | `/checklists/:id/items`       | Add checklist item     |
| PATCH  | `/checklist-items/:id`        | Update item content    |
| PATCH  | `/checklist-items/:id/toggle` | Toggle item completion |
| DELETE | `/checklist-items/:id`        | Delete item            |

## Performance Considerations

- **Eager loading**: Load checklists with items to avoid N+1
- **Progress calculation**: Cached in application (not DB column)
- **Caching**: No caching (real-time updates)
- **Expected volume**: 1-3 checklists per card, 5-15 items per checklist

## Related Modules

- **Card Module** - Checklists belong to cards
- **User Module** - Checklist items can be assigned
- **Activity Module** - Checklist actions logged
