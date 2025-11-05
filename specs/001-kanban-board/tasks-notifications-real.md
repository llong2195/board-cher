# Enhanced Tasks: Real Notification System for Kanban Board

**Feature**: 001-kanban-board - Notification Enhancement  
**Branch**: `001-kanban-board`  
**Date**: 2025-11-05  
**Purpose**: Add comprehensive real-time notification system with persistent storage, WebSocket delivery, and UI components

---

## Overview

This document provides **REAL, ACTIONABLE tasks** for implementing a production-ready notification system as specified in **User Story 6 - Card Assignment and Notifications**.

### Key Requirements from Spec:

1. Users receive notifications when assigned to cards
2. Users receive notifications when someone comments on their assigned cards
3. Users receive reminder notifications 24 hours before due date
4. Notifications appear in real-time without page refresh
5. Notification icon shows unread count
6. Notification center displays all notifications with read/unread status

---

## Phase 1: Notification Data Layer

**Purpose**: Create persistent storage for notifications

- [ ] T301 [P] Create Notification entity (TypeORM) in `packages/backend/src/infrastructure/persistence/entities/notification.entity.ts` with fields:
  - id (UUID, PK)
  - userId (UUID, FK to User)
  - type (enum: CARD_ASSIGNED, COMMENT_ADDED, DUE_DATE_REMINDER, CARD_MOVED, CHECKLIST_COMPLETED)
  - title (string, 200 chars) - e.g., "You were assigned to a card"
  - message (string, 500 chars) - e.g., "John assigned you to 'Design landing page'"
  - actionUrl (string, nullable) - link to relevant card/board
  - metadata (jsonb) - additional data (cardId, boardId, actorId, actorName)
  - isRead (boolean, default false)
  - readAt (timestamp, nullable)
  - createdAt (timestamp)
  - expiresAt (timestamp, nullable) - auto-delete old notifications

- [ ] T302 [P] Create NotificationPreferences entity in `packages/backend/src/infrastructure/persistence/entities/notification-preferences.entity.ts` with fields:
  - id (UUID, PK)
  - userId (UUID, FK to User, unique)
  - emailEnabled (boolean, default true)
  - pushEnabled (boolean, default true)
  - cardAssignmentEnabled (boolean, default true)
  - commentEnabled (boolean, default true)
  - dueDateReminderEnabled (boolean, default true)
  - quietHoursStart (time, nullable) - e.g., 22:00
  - quietHoursEnd (time, nullable) - e.g., 08:00

- [ ] T303 Create database migration `5-create-notifications.ts` in `packages/backend/migrations/` for Notification and NotificationPreferences tables with:
  - Index on (userId, isRead, createdAt DESC) for unread count queries
  - Index on (userId, createdAt DESC) for notification list pagination
  - Index on expiresAt for cleanup job
  - Foreign key userId references User(id) ON DELETE CASCADE

---

## Phase 2: Notification Domain Layer

**Purpose**: Domain models and business logic for notifications

- [ ] T304 [P] Create Notification domain model in `packages/backend/src/domain/notification/notification.model.ts` with:
  - Properties matching entity fields
  - Factory method: `Notification.create(userId, type, title, message, metadata, actionUrl?)`
  - Method: `markAsRead()` - sets isRead=true, readAt=now
  - Method: `isExpired()` - checks if expiresAt < now
  - Validation: title required, message required, type must be valid enum

- [ ] T305 [P] Create NotificationPreferences domain model in `packages/backend/src/domain/notification/notification-preferences.model.ts` with:
  - Factory method: `NotificationPreferences.createDefaults(userId)` - creates with default values
  - Method: `shouldSendNotification(type, currentTime)` - checks if type enabled and not in quiet hours
  - Validation: userId required, all boolean fields have defaults

- [ ] T306 [P] Create notification type enum in `packages/backend/src/domain/notification/notification-type.enum.ts`:

  ```typescript
  export enum NotificationType {
    CARD_ASSIGNED = 'CARD_ASSIGNED',
    CARD_UNASSIGNED = 'CARD_UNASSIGNED',
    COMMENT_ADDED = 'COMMENT_ADDED',
    DUE_DATE_REMINDER = 'DUE_DATE_REMINDER',
    DUE_DATE_OVERDUE = 'DUE_DATE_OVERDUE',
    CARD_MOVED = 'CARD_MOVED',
    CHECKLIST_COMPLETED = 'CHECKLIST_COMPLETED',
    BOARD_INVITE = 'BOARD_INVITE',
    ORGANIZATION_INVITE = 'ORGANIZATION_INVITE',
  }
  ```

- [ ] T307 [P] Create domain events in `packages/backend/src/domain/notification/events/`:
  - `NotificationCreatedEvent` - emitted when new notification created
  - `NotificationReadEvent` - emitted when notification marked as read
  - `NotificationDeletedEvent` - emitted when notification deleted

- [ ] T308 Create NotificationRepository interface in `packages/backend/src/domain/notification/notification.repository.ts` with methods:
  - `create(notification: Notification): Promise<Notification>`
  - `findById(id: string): Promise<Notification | null>`
  - `findByUserId(userId: string, options: { limit, offset, isRead? }): Promise<Notification[]>`
  - `countUnread(userId: string): Promise<number>`
  - `markAsRead(notificationId: string): Promise<void>`
  - `markAllAsRead(userId: string): Promise<void>`
  - `deleteExpired(): Promise<number>` - cleanup old notifications
  - `deleteById(id: string): Promise<void>`

- [ ] T309 Create NotificationPreferencesRepository interface in `packages/backend/src/domain/notification/notification-preferences.repository.ts` with methods:
  - `findByUserId(userId: string): Promise<NotificationPreferences | null>`
  - `save(preferences: NotificationPreferences): Promise<void>`
  - `createDefaults(userId: string): Promise<NotificationPreferences>`

---

## Phase 3: Notification Application Layer

**Purpose**: Business logic and notification creation service

- [ ] T310 Implement NotificationRepository in `packages/backend/src/infrastructure/persistence/repositories/notification.repository.impl.ts`:
  - Use TypeORM with proper error handling
  - Include pagination support with cursor-based approach
  - Optimize countUnread query (use COUNT with WHERE isRead=false)
  - Map between domain model and TypeORM entity

- [ ] T311 Implement NotificationPreferencesRepository in `packages/backend/src/infrastructure/persistence/repositories/notification-preferences.repository.impl.ts`:
  - Handle user not found gracefully
  - Create defaults on first access if not exists
  - Cache preferences in Redis with 10-minute TTL

- [ ] T312 Create NotificationService in `packages/backend/src/application/services/notification.service.ts` with methods:
  - `createNotification(userId, type, title, message, metadata, actionUrl?): Promise<Notification>` - creates and publishes event
  - `getNotifications(userId, options: { limit, offset, isRead? }): Promise<{ notifications: Notification[], total: number }>`
  - `getUnreadCount(userId): Promise<number>` - cached in Redis (1-minute TTL)
  - `markAsRead(notificationId, userId): Promise<void>` - verify ownership, emit event
  - `markAllAsRead(userId): Promise<void>`
  - `deleteNotification(notificationId, userId): Promise<void>` - verify ownership
  - `shouldSendNotification(userId, type): Promise<boolean>` - check preferences and quiet hours

- [ ] T313 Create NotificationFactory in `packages/backend/src/application/factories/notification.factory.ts` with template methods:
  - `createCardAssignmentNotification(assigneeId, cardTitle, assignerName, cardId, boardId): Notification`
  - `createCommentNotification(assigneeIds, cardTitle, commenterName, commentText, cardId): Notification[]`
  - `createDueDateReminderNotification(assigneeIds, cardTitle, dueDate, cardId): Notification[]`
  - `createDueDateOverdueNotification(assigneeIds, cardTitle, dueDate, cardId): Notification[]`
  - `createCardMovedNotification(assigneeIds, cardTitle, fromList, toList, cardId): Notification[]`
  - `createChecklistCompletedNotification(assigneeIds, cardTitle, checklistTitle, cardId): Notification[]`

- [ ] T314 Create NotificationEventSubscriber in `packages/backend/src/application/subscribers/notification-event.subscriber.ts`:
  - Subscribe to `CardAssigned` domain event → call NotificationFactory.createCardAssignmentNotification
  - Subscribe to `CommentAdded` domain event → check if card has assignees → create notifications
  - Subscribe to `ChecklistItemToggled` domain event → if checklist 100% complete, notify assignees
  - Subscribe to `CardMoved` domain event → notify assignees
  - For each event: check user preferences before creating notification

- [ ] T315 Create DueDateReminderJob in `packages/backend/src/application/jobs/due-date-reminder.job.ts`:
  - Scheduled job (runs every hour via cron: `0 * * * *`)
  - Query cards with dueDate in next 24 hours that haven't been reminded
  - For each card: get assignees, create DUE_DATE_REMINDER notifications
  - Mark card as reminded (add `reminderSent` field to Card entity or use Activity log)

- [ ] T316 Create NotificationCleanupJob in `packages/backend/src/application/jobs/notification-cleanup.job.ts`:
  - Scheduled job (runs daily at 3 AM: `0 3 * * *`)
  - Delete notifications where expiresAt < now OR (isRead=true AND createdAt < 30 days ago)
  - Log count of deleted notifications

---

## Phase 4: Notification WebSocket Integration

**Purpose**: Real-time notification delivery to connected clients

- [ ] T317 Create NotificationGateway in `packages/backend/src/infrastructure/websocket/notification.gateway.ts`:
  - `@WebSocketGateway()` decorator
  - JWT authentication in connection handshake
  - On connect: join room `notifications:${userId}`
  - Implement `handleConnection(client: Socket)` - join user's notification room
  - Implement `handleDisconnect(client: Socket)` - leave notification room

- [ ] T318 Create NotificationEventPublisher in `packages/backend/src/infrastructure/websocket/notification-event-publisher.service.ts`:
  - Subscribe to `NotificationCreatedEvent` domain event
  - When notification created: emit WebSocket event to `notifications:${userId}` room
  - Event payload: `{ type: 'notification:created', data: { id, title, message, type, actionUrl, createdAt, metadata } }`
  - Also emit `notification:unread-count-updated` with new unread count

- [ ] T319 Update WebSocket event types in `packages/shared/src/types/websocket-events.ts`:

  ```typescript
  export interface NotificationCreatedEvent {
    type: 'notification:created';
    data: {
      id: string;
      title: string;
      message: string;
      notificationType: NotificationType;
      actionUrl?: string;
      createdAt: string;
      metadata: Record<string, any>;
    };
  }

  export interface NotificationUnreadCountUpdatedEvent {
    type: 'notification:unread-count-updated';
    data: {
      count: number;
    };
  }
  ```

- [ ] T320 Add notification event handlers to frontend WebSocket service in `packages/frontend/src/services/websocket.service.ts`:
  - Listen for `notification:created` event
  - Listen for `notification:unread-count-updated` event
  - Emit events through EventEmitter or callback system for components to subscribe

---

## Phase 5: Notification REST API

**Purpose**: HTTP endpoints for notification management

- [ ] T321 Create Notification DTOs in `packages/backend/src/presentation/dto/notification/`:
  - `NotificationResponseDto` - maps Notification domain model
  - `NotificationListResponseDto` - includes notifications array + total count + pagination
  - `UpdateNotificationPreferencesDto` - for user to update their preferences
  - `MarkAsReadDto` - optional array of notificationIds (if empty, mark all as read)

- [ ] T322 Create NotificationController in `packages/backend/src/presentation/controllers/notification.controller.ts`:
  - `GET /api/v1/notifications` - get user's notifications (paginated, query params: limit, offset, isRead)
    - Auth required (JWT)
    - Return NotificationListResponseDto
  - `GET /api/v1/notifications/unread-count` - get unread count
    - Auth required (JWT)
    - Return `{ count: number }`
  - `PUT /api/v1/notifications/:id/read` - mark notification as read
    - Auth required (JWT)
    - Verify notification belongs to user
    - Return updated notification
  - `PUT /api/v1/notifications/mark-all-read` - mark all as read
    - Auth required (JWT)
    - Return `{ marked: number }`
  - `DELETE /api/v1/notifications/:id` - delete notification
    - Auth required (JWT)
    - Verify notification belongs to user
    - Return 204 No Content
  - `GET /api/v1/notifications/preferences` - get user's notification preferences
    - Auth required (JWT)
    - Create defaults if not exist
  - `PUT /api/v1/notifications/preferences` - update user's notification preferences
    - Auth required (JWT)
    - Validate input with UpdateNotificationPreferencesDto

- [ ] T323 Add @ApiTags('notifications') and Swagger documentation to NotificationController:
  - Document all endpoints with @ApiOperation
  - Add @ApiResponse decorators for success/error responses
  - Add request/response examples
  - Document query parameters and path parameters

---

## Phase 6: Frontend Notification Store

**Purpose**: Client-side notification state management

- [ ] T324 Create Notification API client in `packages/frontend/src/services/api/notification.api.ts`:
  - `getNotifications(options: { limit?, offset?, isRead? }): Promise<NotificationListResponse>`
  - `getUnreadCount(): Promise<{ count: number }>`
  - `markAsRead(notificationId: string): Promise<Notification>`
  - `markAllAsRead(): Promise<{ marked: number }>`
  - `deleteNotification(notificationId: string): Promise<void>`
  - `getPreferences(): Promise<NotificationPreferences>`
  - `updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>`

- [ ] T325 Create notification store in `packages/frontend/src/stores/notification.store.ts` using Zustand:

  ```typescript
  interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;

    // Actions
    fetchNotifications: (options?: { limit?; offset?; isRead? }) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    addNotification: (notification: Notification) => void; // For WebSocket updates
    setUnreadCount: (count: number) => void; // For WebSocket updates

    // Preferences
    preferences: NotificationPreferences | null;
    fetchPreferences: () => Promise<void>;
    updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  }
  ```

- [ ] T326 Create useNotifications hook in `packages/frontend/src/hooks/useNotifications.ts`:
  - Wraps notification store
  - Sets up WebSocket listeners on mount
  - Listens for `notification:created` → calls store.addNotification
  - Listens for `notification:unread-count-updated` → calls store.setUnreadCount
  - Shows toast notification when new notification received
  - Plays notification sound (optional, user preference)
  - Returns store state and actions

---

## Phase 7: Frontend Notification UI Components

**Purpose**: User interface for notifications

- [ ] T327 Install toast library: `pnpm add sonner` (or use shadcn/ui toast)

- [ ] T328 Create NotificationIcon component in `packages/frontend/src/components/notification/NotificationIcon.tsx`:
  - Bell icon with badge showing unread count
  - Click opens notification dropdown/panel
  - Badge color: red if count > 0, gray if 0
  - Badge hidden if count === 0
  - Accessibility: aria-label="Notifications, X unread"
  - Animation: bell shake when new notification arrives

- [ ] T329 Create NotificationDropdown component in `packages/frontend/src/components/notification/NotificationDropdown.tsx`:
  - Dropdown panel (shadcn/ui DropdownMenu or Popover)
  - Header: "Notifications" + "Mark all as read" button
  - List of notifications (max 10, with "View all" link)
  - Each notification item shows:
    - Icon based on notification type (bell, user-plus, message-square, calendar, check-circle)
    - Title (bold if unread)
    - Message (truncated to 100 chars)
    - Relative timestamp ("2 minutes ago", "1 hour ago")
    - Dot indicator if unread
  - Click notification item: mark as read + navigate to actionUrl
  - Empty state: "No notifications"
  - Loading state: Skeleton placeholders

- [ ] T330 Create NotificationItem component in `packages/frontend/src/components/notification/NotificationItem.tsx`:
  - Props: notification, onRead, onDelete, onClick
  - Styled differently for read vs unread
  - Hover actions: "Mark as read" button, delete button (trash icon)
  - Click entire item: navigate to actionUrl + mark as read
  - Accessibility: proper keyboard navigation

- [ ] T331 Create NotificationCenter page in `packages/frontend/src/pages/NotificationCenterPage.tsx`:
  - Full page view of all notifications
  - Tabs: "All", "Unread", "Read"
  - Infinite scroll or pagination
  - Bulk actions: "Mark all as read", "Delete all read"
  - Filter by notification type (dropdown)
  - Search notifications (client-side filter)
  - Each notification expandable to show full message
  - Link in notification navigates to relevant card/board

- [ ] T332 Create NotificationPreferencesDialog component in `packages/frontend/src/components/notification/NotificationPreferencesDialog.tsx`:
  - Dialog/modal for editing notification preferences
  - Toggle switches for each notification type:
    - Email notifications
    - Push notifications
    - Card assignments
    - Comments
    - Due date reminders
  - Quiet hours time picker (start/end time)
  - Save button → calls updatePreferences
  - Cancel button closes dialog

- [ ] T333 Add NotificationIcon to main navigation in `packages/frontend/src/components/layout/Header.tsx`:
  - Position in top-right, before user profile menu
  - Always visible when user logged in
  - Real-time unread count badge

---

## Phase 8: Notification Testing

**Purpose**: Comprehensive test coverage for notification system

- [ ] T334 [P] Unit test NotificationService in `packages/backend/test/unit/application/notification.service.spec.ts`:
  - Test createNotification: creates notification + emits event
  - Test getUnreadCount: returns correct count
  - Test markAsRead: updates notification + emits event
  - Test markAllAsRead: updates all user's notifications
  - Test shouldSendNotification: respects user preferences and quiet hours

- [ ] T335 [P] Unit test NotificationFactory in `packages/backend/test/unit/application/notification.factory.spec.ts`:
  - Test each factory method returns correct notification structure
  - Test metadata includes all required fields
  - Test actionUrl is correctly formatted

- [ ] T336 [P] Unit test NotificationEventSubscriber in `packages/backend/test/unit/application/notification-event-subscriber.spec.ts`:
  - Test CardAssigned event → creates CARD_ASSIGNED notification
  - Test CommentAdded event → creates COMMENT_ADDED notification for assignees only
  - Test respects user preferences (doesn't create if type disabled)

- [ ] T337 [P] Integration test notification API in `packages/backend/test/e2e/notification/notification-api.e2e-spec.ts`:
  - Test GET /notifications returns user's notifications (not others')
  - Test GET /notifications/unread-count returns accurate count
  - Test PUT /notifications/:id/read marks as read
  - Test DELETE /notifications/:id deletes notification (owner only)
  - Test 403 error when trying to access another user's notification

- [ ] T338 [P] Integration test WebSocket notifications in `packages/backend/test/e2e/notification/notification-websocket.e2e-spec.ts`:
  - Connect two clients (User A and User B)
  - User A assigns card to User B
  - Verify User B receives `notification:created` event via WebSocket
  - Verify User B's unread count updated via `notification:unread-count-updated` event

- [ ] T339 [P] Frontend component test NotificationIcon in `packages/frontend/test/components/notification/notification-icon.test.tsx`:
  - Test badge shows correct unread count
  - Test badge hidden when count is 0
  - Test click opens dropdown
  - Test accessibility attributes

- [ ] T340 [P] Frontend component test NotificationDropdown in `packages/frontend/test/components/notification/notification-dropdown.test.tsx`:
  - Test displays list of notifications
  - Test "Mark all as read" button works
  - Test click notification item navigates and marks as read
  - Test empty state displayed when no notifications

- [ ] T341 [P] E2E test notification flow in `packages/frontend/test/e2e/notifications.spec.ts` (Playwright):
  - Login as User A
  - Assign card to User B
  - Login as User B in separate window
  - Verify notification icon badge shows "1"
  - Click notification icon
  - Verify notification appears in dropdown
  - Click notification
  - Verify navigated to card
  - Verify notification marked as read
  - Verify badge shows "0"

---

## Phase 9: Notification Performance & Optimization

**Purpose**: Ensure notifications scale and perform well

- [ ] T342 Add Redis caching for unread count in NotificationService:
  - Cache key: `notification:unread:${userId}`
  - TTL: 1 minute
  - Invalidate on new notification or mark as read
  - Reduces database queries for frequent checks

- [ ] T343 Add database indexes for notification queries in migration:
  - Index on (userId, isRead, createdAt DESC) - for filtered queries
  - Index on (userId, createdAt DESC) - for all notifications query
  - Index on expiresAt - for cleanup job
  - Verify query performance with EXPLAIN ANALYZE

- [ ] T344 Implement notification batching in NotificationEventPublisher:
  - If multiple notifications created within 100ms for same user, batch into single WebSocket message
  - Reduces WebSocket traffic for bulk operations (e.g., assigning 10 users to card)
  - Batch payload: `{ type: 'notification:batch-created', data: [notification1, notification2, ...] }`

- [ ] T345 Add rate limiting for notification creation:
  - Max 100 notifications per user per hour (prevent spam)
  - Use Redis counter with TTL
  - Return error if limit exceeded
  - Admins exempt from rate limit

- [ ] T346 Optimize notification query pagination:
  - Use cursor-based pagination (last notification ID + createdAt)
  - More efficient than OFFSET for large datasets
  - Update API to support cursor parameter

---

## Phase 10: Notification Polish & Edge Cases

**Purpose**: Handle edge cases and improve UX

- [ ] T347 Add notification grouping/summarization:
  - If user has 5+ unread notifications of same type for same card, group them
  - Display: "5 new comments on 'Design landing page'" instead of 5 separate notifications
  - Clicking grouped notification shows all individual notifications

- [ ] T348 Add notification sound (optional):
  - Play subtle sound when notification arrives (respects browser/OS settings)
  - User preference toggle in NotificationPreferencesDialog
  - Use Web Audio API or simple <audio> element
  - Sound file: `public/sounds/notification.mp3`

- [ ] T349 Add browser push notifications (optional, advanced):
  - Request permission on first login (non-intrusive)
  - Use Web Push API + Service Worker
  - Send push notifications even when app not open
  - Requires VAPID keys setup on backend
  - User preference toggle in NotificationPreferencesDialog

- [ ] T350 Add email notifications (optional, advanced):
  - Integration with email service (SendGrid, AWS SES, etc.)
  - Send digest email for important notifications (assignments, due dates)
  - Configurable: instant, hourly, daily digest
  - Unsubscribe link in emails
  - HTML + plain text email templates

- [ ] T351 Handle deleted entities in notifications:
  - If card deleted, notification actionUrl shows "Card deleted" message
  - If user deleted, show "[Deleted User]" in notification actor name
  - Add check in backend before rendering notification

- [ ] T352 Add notification filtering by date range:
  - In NotificationCenterPage, add date picker for filtering
  - Query params: fromDate, toDate
  - Backend support in GET /notifications endpoint

- [ ] T353 Add notification export (optional):
  - Download user's notifications as JSON or CSV
  - Useful for record-keeping or debugging
  - Endpoint: GET /api/v1/notifications/export

---

## Dependencies & Execution Order

### Phase Dependencies:

1. **Phase 1** (Data Layer) → No dependencies
2. **Phase 2** (Domain Layer) → Depends on Phase 1
3. **Phase 3** (Application Layer) → Depends on Phase 2
4. **Phase 4** (WebSocket) → Depends on Phase 3
5. **Phase 5** (REST API) → Depends on Phase 3
6. **Phase 6** (Frontend Store) → Depends on Phase 5
7. **Phase 7** (Frontend UI) → Depends on Phase 6
8. **Phase 8** (Testing) → Depends on Phases 3-7
9. **Phase 9** (Optimization) → Depends on Phases 3-5
10. **Phase 10** (Polish) → Depends on all previous phases

### Parallel Opportunities:

- **Phase 1**: T301, T302 can run in parallel
- **Phase 2**: T304, T305, T306, T307 can run in parallel
- **Phase 3**: T310, T311 can run in parallel; T313, T314 can run in parallel after T312
- **Phase 4**: T317, T318 can run in parallel
- **Phase 5**: T321, T322 can be done together
- **Phase 6**: T324, T325, T326 sequential but T324 can start early
- **Phase 7**: T328, T329, T330 can run in parallel; T331, T332 can run in parallel
- **Phase 8**: All test tasks (T334-T341) can run in parallel
- **Phase 9**: T342, T343, T344 can run in parallel
- **Phase 10**: T347-T353 mostly independent, can run in parallel

### Critical Path (MVP for notifications):

```
Phase 1 → Phase 2 → Phase 3 (T312, T313) → Phase 4 → Phase 6 → Phase 7 (T328, T329) → MVP Demo
```

This delivers:

- ✅ Notifications created when card assigned
- ✅ Real-time WebSocket delivery
- ✅ Notification icon with unread count
- ✅ Notification dropdown with recent notifications

---

## Task Count Summary

- **Phase 1** (Data Layer): 3 tasks
- **Phase 2** (Domain Layer): 6 tasks
- **Phase 3** (Application Layer): 7 tasks
- **Phase 4** (WebSocket): 4 tasks
- **Phase 5** (REST API): 3 tasks
- **Phase 6** (Frontend Store): 3 tasks
- **Phase 7** (Frontend UI): 7 tasks
- **Phase 8** (Testing): 8 tasks
- **Phase 9** (Optimization): 5 tasks
- **Phase 10** (Polish): 7 tasks

**Total**: 53 new notification tasks

**MVP Scope**: 20 tasks (Phases 1-4 + T324-T329) for basic real-time notifications

**Full Feature**: 53 tasks for production-ready notification system with preferences, cleanup, optimization, and polish

---

## Implementation Notes

### Real-Time Architecture:

The notification system uses WebSocket (Socket.io) for instant delivery:

1. User connects → joins `notifications:${userId}` room
2. Backend creates notification → publishes to room
3. All user's connected clients receive notification instantly
4. Frontend shows toast + updates badge count

### Scalability:

- Redis caching for unread counts (reduces DB load)
- Cursor-based pagination (efficient for large datasets)
- Notification expiration (auto-cleanup old notifications)
- Batching multiple notifications (reduces WebSocket traffic)

### User Experience:

- Toast notifications for important events
- Bell shake animation for new notifications
- Unread badge on notification icon
- Mark as read on click (reduces friction)
- Notification preferences (user control)
- Quiet hours (respect user time)

### Testing Strategy:

- Unit tests for service logic
- Integration tests for API endpoints
- E2E tests for WebSocket delivery
- Component tests for UI elements
- Full user journey test (assignment → notification → read → navigate)

---

## Success Criteria

- ✅ User receives notification within 1 second of being assigned to card
- ✅ User receives notification when someone comments on their assigned card
- ✅ User receives reminder notification 24 hours before due date
- ✅ Notification icon shows accurate unread count at all times
- ✅ Notifications persist across browser sessions
- ✅ Clicking notification navigates to relevant card/board
- ✅ User can mark notifications as read individually or all at once
- ✅ User can configure notification preferences
- ✅ System handles 1000+ notifications per user without performance degradation
- ✅ Notifications expire after 30 days to prevent database bloat

---

**Status**: ✅ **READY FOR IMPLEMENTATION**

This task list provides **REAL, ACTIONABLE steps** to build a production-ready notification system with persistent storage, real-time delivery, and comprehensive UI.

---

**Last Updated**: 2025-11-05  
**Created By**: AI Task Generator following speckit.tasks.prompt.md guidelines
