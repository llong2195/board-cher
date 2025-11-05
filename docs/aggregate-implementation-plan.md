# DDD Aggregate Implementation Plan

**Date**: 2025-11-05  
**Status**: Implementation Required  
**Priority**: High - Architectural Improvement

## Current State Analysis

### Existing Implementation

The current codebase has basic domain models but **lacks proper DDD aggregate implementation**:

1. **Board Model** (`packages/backend/src/domain/board/board.model.ts`)
   - ✅ Exists as aggregate root
   - ❌ Does not manage child entities (Lists)
   - ❌ No aggregate boundary enforcement
   - ❌ Missing domain events

2. **Card Model** (`packages/backend/src/domain/card/card.model.ts`)
   - ✅ Exists as aggregate root
   - ✅ Has private collections for child entities (\_commentIds, \_attachmentIds, etc.)
   - ⚠️ Partial aggregate implementation
   - ❌ Missing domain events
   - ❌ No transactional boundary enforcement

3. **Other Entities**
   - List, Comment, Checklist, Label, Attachment exist as separate models
   - Not properly encapsulated within aggregates

## DDD Aggregate Principles

### What is an Aggregate?

An aggregate is a cluster of domain objects (entities and value objects) that can be treated as a single unit for data changes. Key principles:

1. **Aggregate Root**: Single entry point for all changes to the aggregate
2. **Consistency Boundary**: All invariants maintained within the aggregate
3. **Transactional Consistency**: Changes to aggregate are atomic
4. **Identity**: Only the root has global identity, children referenced by root
5. **External References**: Other aggregates can only reference the root by ID

### Identified Aggregates in Trello Vibe

Based on the data model and research.md:

#### 1. **Board Aggregate** (Root: Board)

**Cluster**:

- Board (root)
- List (entity within aggregate)

**Why**:

- Lists cannot exist without a Board
- List ordering is managed at Board level
- Board invariants (e.g., max lists) need consistency

**Responsibilities**:

- Add/remove/reorder lists
- Validate list count limits
- Ensure position consistency

#### 2. **Card Aggregate** (Root: Card)

**Cluster**:

- Card (root)
- Comment (entity)
- Attachment (entity)
- Checklist (entity)
  - ChecklistItem (value object)
- CardLabel (entity/join table)
- CardAssignment (entity/join table)

**Why**:

- These are all details about a single card
- Cannot exist without the card
- Changes should be atomic (e.g., add comment + update timestamp)

**Responsibilities**:

- Add/remove comments
- Attach/detach files
- Add/remove/toggle checklist items
- Assign/unassign users
- Apply/remove labels

#### 3. **Organization Aggregate** (Root: Organization)

**Cluster**:

- Organization (root)
- OrganizationMember (entity)

**Why**:

- Members belong to an organization
- Membership rules enforced at organization level
- Role changes must be consistent

**Responsibilities**:

- Add/remove members
- Change member roles
- Validate owner uniqueness

#### 4. **User Aggregate** (Root: User)

**Cluster**:

- User (root only - no children)

**Why**:

- User is a standalone entity
- No child entities that must be consistent with User

## Implementation Tasks

### Task 1: Enhance Board Aggregate ✨

**File**: `packages/backend/src/domain/board/board-aggregate.ts`

**Required Changes**:

```typescript
export class BoardAggregate {
  private constructor(
    private readonly board: Board,
    private lists: List[] = [],
  ) {}

  // Factory method
  static create(boardData, organizationId: string, createdBy: string): BoardAggregate {
    const board = Board.create(...);
    return new BoardAggregate(board, []);
  }

  // Aggregate operations
  addList(listId: string, name: string, createdBy: string): void {
    // Validate list count
    if (this.lists.length >= 50) {
      throw new Error('Board cannot have more than 50 lists');
    }

    const position = this.lists.length;
    const list = List.create(listId, this.board.id, name, position, createdBy);
    this.lists.push(list);

    // Emit domain event
    this.addDomainEvent(new ListAddedEvent(this.board.id, listId));
  }

  removeList(listId: string): void {
    const index = this.lists.findIndex(l => l.id === listId);
    if (index === -1) {
      throw new Error('List not found');
    }

    this.lists.splice(index, 1);
    this.reorderLists();

    this.addDomainEvent(new ListRemovedEvent(this.board.id, listId));
  }

  moveList(listId: string, newPosition: number): void {
    // Implementation with position recalculation
    this.addDomainEvent(new ListMovedEvent(this.board.id, listId, newPosition));
  }

  // Getters with defensive copying
  getLists(): ReadonlyArray<List> {
    return Object.freeze([...this.lists]);
  }

  getBoard(): Board {
    return this.board;
  }

  // Domain events
  private domainEvents: DomainEvent[] = [];

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
```

### Task 2: Enhance Card Aggregate ✨

**File**: `packages/backend/src/domain/card/card-aggregate.ts`

**Required Changes**:

```typescript
export class CardAggregate {
  private constructor(
    private readonly card: Card,
    private comments: Comment[] = [],
    private attachments: Attachment[] = [],
    private checklists: Checklist[] = [],
    private labels: Label[] = [],
    private assignees: string[] = [], // User IDs
  ) {}

  static create(cardData, listId: string, createdBy: string): CardAggregate {
    const card = Card.create(...);
    return new CardAggregate(card);
  }

  // Comment operations
  addComment(commentId: string, content: string, userId: string): void {
    const comment = Comment.create(commentId, this.card.id, userId, content);
    this.comments.push(comment);
    this.card.updatedAt = new Date(); // Update card timestamp

    this.addDomainEvent(new CommentAddedEvent(this.card.id, commentId, userId));
  }

  updateComment(commentId: string, newContent: string, userId: string): void {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new Error('Only comment author can update');
    }

    comment.update(newContent);
    this.addDomainEvent(new CommentUpdatedEvent(this.card.id, commentId));
  }

  deleteComment(commentId: string, userId: string): void {
    const index = this.comments.findIndex(c => c.id === commentId);
    if (index === -1) {
      throw new Error('Comment not found');
    }
    if (this.comments[index].userId !== userId) {
      throw new Error('Only comment author can delete');
    }

    this.comments.splice(index, 1);
    this.addDomainEvent(new CommentDeletedEvent(this.card.id, commentId));
  }

  // Checklist operations
  addChecklist(checklistId: string, title: string): void {
    const checklist = Checklist.create(checklistId, this.card.id, title);
    this.checklists.push(checklist);

    this.addDomainEvent(new ChecklistAddedEvent(this.card.id, checklistId));
  }

  addChecklistItem(checklistId: string, itemId: string, text: string): void {
    const checklist = this.checklists.find(c => c.id === checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    checklist.addItem(itemId, text);
    this.addDomainEvent(new ChecklistItemAddedEvent(this.card.id, checklistId, itemId));
  }

  toggleChecklistItem(checklistId: string, itemId: string): void {
    const checklist = this.checklists.find(c => c.id === checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    checklist.toggleItem(itemId);
    this.addDomainEvent(new ChecklistItemToggledEvent(this.card.id, checklistId, itemId));
  }

  // Label operations
  applyLabel(labelId: string): void {
    if (this.labels.some(l => l.id === labelId)) {
      throw new Error('Label already applied');
    }
    // Note: Label entity fetched from repository
    this.labels.push({ id: labelId } as Label); // Simplified

    this.addDomainEvent(new LabelAppliedEvent(this.card.id, labelId));
  }

  removeLabel(labelId: string): void {
    const index = this.labels.findIndex(l => l.id === labelId);
    if (index === -1) {
      throw new Error('Label not found');
    }

    this.labels.splice(index, 1);
    this.addDomainEvent(new LabelRemovedEvent(this.card.id, labelId));
  }

  // Assignment operations
  assignUser(userId: string): void {
    if (this.assignees.includes(userId)) {
      throw new Error('User already assigned');
    }

    this.assignees.push(userId);
    this.addDomainEvent(new UserAssignedEvent(this.card.id, userId));
  }

  unassignUser(userId: string): void {
    const index = this.assignees.indexOf(userId);
    if (index === -1) {
      throw new Error('User not assigned');
    }

    this.assignees.splice(index, 1);
    this.addDomainEvent(new UserUnassignedEvent(this.card.id, userId));
  }

  // Attachment operations
  addAttachment(attachmentId: string, filename: string, url: string, size: number): void {
    const attachment = Attachment.create(attachmentId, this.card.id, filename, url, size);
    this.attachments.push(attachment);

    this.addDomainEvent(new AttachmentAddedEvent(this.card.id, attachmentId));
  }

  removeAttachment(attachmentId: string): void {
    const index = this.attachments.findIndex(a => a.id === attachmentId);
    if (index === -1) {
      throw new Error('Attachment not found');
    }

    this.attachments.splice(index, 1);
    this.addDomainEvent(new AttachmentRemovedEvent(this.card.id, attachmentId));
  }

  // Getters with defensive copying
  getCard(): Card {
    return this.card;
  }

  getComments(): ReadonlyArray<Comment> {
    return Object.freeze([...this.comments]);
  }

  getChecklists(): ReadonlyArray<Checklist> {
    return Object.freeze([...this.checklists]);
  }

  // Domain events management
  private domainEvents: DomainEvent[] = [];

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
```

### Task 3: Create Domain Events

**File**: `packages/backend/src/domain/events/domain-event.ts`

```typescript
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
  }

  abstract get eventName(): string;
}

// Board events
export class ListAddedEvent extends DomainEvent {
  constructor(
    public readonly boardId: string,
    public readonly listId: string,
  ) {
    super(boardId);
  }

  get eventName(): string {
    return 'ListAdded';
  }
}

// Card events
export class CommentAddedEvent extends DomainEvent {
  constructor(
    public readonly cardId: string,
    public readonly commentId: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'CommentAdded';
  }
}

// ... other events
```

### Task 4: Update Repositories to Work with Aggregates

**File**: `packages/backend/src/domain/board/board-aggregate.repository.ts`

```typescript
export interface IBoardAggregateRepository {
  findById(boardId: string): Promise<BoardAggregate | null>;
  save(aggregate: BoardAggregate): Promise<void>;
  delete(boardId: string): Promise<void>;
}
```

**Implementation**: `packages/backend/src/infrastructure/persistence/repositories/board-aggregate.repository.impl.ts`

```typescript
@Injectable()
export class BoardAggregateRepositoryImpl implements IBoardAggregateRepository {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepo: Repository<BoardEntity>,
    @InjectRepository(ListEntity)
    private readonly listRepo: Repository<ListEntity>,
    private readonly eventBus: EventBus,
  ) {}

  async findById(boardId: string): Promise<BoardAggregate | null> {
    // Load board with all lists
    const boardEntity = await this.boardRepo.findOne({
      where: { id: boardId },
      relations: ['lists'],
    });

    if (!boardEntity) {
      return null;
    }

    // Map to domain models
    const board = this.mapToDomain(boardEntity);
    const lists = boardEntity.lists.map((l) => this.mapListToDomain(l));

    // Reconstitute aggregate
    return BoardAggregate.reconstitute(board, lists);
  }

  async save(aggregate: BoardAggregate): Promise<void> {
    const board = aggregate.getBoard();
    const lists = aggregate.getLists();

    // Start transaction
    await this.boardRepo.manager.transaction(async (manager) => {
      // Save board
      const boardEntity = this.mapToEntity(board);
      await manager.save(BoardEntity, boardEntity);

      // Save lists
      const listEntities = lists.map((l) => this.mapListToEntity(l));
      await manager.save(ListEntity, listEntities);

      // Publish domain events
      const events = aggregate.getDomainEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }

      // Clear events after publishing
      aggregate.clearDomainEvents();
    });
  }

  // ... mapping methods
}
```

### Task 5: Update Command Handlers to Use Aggregates

**File**: `packages/backend/src/application/commands/board/add-list.handler.ts`

```typescript
@CommandHandler(AddListCommand)
export class AddListHandler implements ICommandHandler<AddListCommand> {
  constructor(
    @Inject('IBoardAggregateRepository')
    private readonly boardAggregateRepo: IBoardAggregateRepository,
  ) {}

  async execute(command: AddListCommand): Promise<string> {
    const { boardId, name, userId } = command;

    // Load aggregate
    const aggregate = await this.boardAggregateRepo.findById(boardId);
    if (!aggregate) {
      throw new NotFoundException('Board not found');
    }

    // Execute domain logic
    const listId = randomUUID();
    aggregate.addList(listId, name, userId);

    // Save aggregate (includes event publishing)
    await this.boardAggregateRepo.save(aggregate);

    return listId;
  }
}
```

## Benefits of Aggregate Implementation

1. **Consistency**: All changes to related entities are atomic
2. **Encapsulation**: Business rules enforced at aggregate level
3. **Event-Driven**: Domain events enable audit logging, notifications, real-time updates
4. **Testability**: Aggregates can be tested in isolation
5. **Scalability**: Clear transactional boundaries
6. **Domain Logic**: Business rules centralized in domain layer

## Implementation Priority

### Phase 1: Core Aggregates (Week 1)

- ✅ Task 1: Board Aggregate implementation
- ✅ Task 2: Card Aggregate implementation
- ✅ Task 3: Domain Events

### Phase 2: Infrastructure (Week 1)

- ✅ Task 4: Aggregate Repositories
- ✅ Task 5: Update Command Handlers

### Phase 3: Migration (Week 2)

- Migrate existing code to use aggregates
- Add unit tests for aggregates
- Integration tests for repositories
- E2E tests validation

## Testing Strategy

### Unit Tests

```typescript
describe('BoardAggregate', () => {
  it('should add list to board', () => {
    const aggregate = BoardAggregate.create(...);
    aggregate.addList('list-1', 'To Do', 'user-1');

    expect(aggregate.getLists()).toHaveLength(1);
    expect(aggregate.getDomainEvents()).toHaveLength(1);
    expect(aggregate.getDomainEvents()[0]).toBeInstanceOf(ListAddedEvent);
  });

  it('should enforce max list count', () => {
    const aggregate = BoardAggregate.create(...);
    // Add 50 lists
    for (let i = 0; i < 50; i++) {
      aggregate.addList(`list-${i}`, `List ${i}`, 'user-1');
    }

    // 51st should fail
    expect(() => {
      aggregate.addList('list-51', 'List 51', 'user-1');
    }).toThrow('Board cannot have more than 50 lists');
  });
});
```

## References

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://vaughnvernon.com/)
- [Aggregates Pattern](https://martinfowler.com/bliki/DDD_Aggregate.html)

## Status

**Current**: ⚠️ Basic domain models exist, aggregates not properly implemented  
**Target**: ✅ Full aggregate implementation with domain events and transactional consistency  
**Timeline**: 2 weeks for full implementation and migration
