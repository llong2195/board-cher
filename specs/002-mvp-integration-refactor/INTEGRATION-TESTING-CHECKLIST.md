# Integration Testing Checklist (T058-T063)

**Date**: 2025-11-06  
**Feature**: 002-mvp-integration-refactor  
**Dev Server**: http://localhost:5174  
**Backend**: http://localhost:3000

---

## Testing Instructions

### Setup

1. ✅ Frontend server running on http://localhost:5174
2. ⏹️ Backend server (verify running on http://localhost:3000)
3. ⏹️ PostgreSQL (verify via docker-compose)
4. ⏹️ Redis (verify via docker-compose)

### Testing Environment

- **Browser**: Chrome (primary), Firefox (secondary)
- **Console**: Open DevTools Console (F12) to monitor for errors
- **Network**: Use DevTools Network tab to verify API calls
- **WebSocket**: Monitor WebSocket connection in Network → WS tab

---

## T058: Board CRUD Operations

### Create Board

- [ ] Navigate to home page (/)
- [ ] Click "Create Board" button
- [ ] Enter board name: "Integration Test Board"
- [ ] Click "Create" or submit
- [ ] **Verify**: New board appears in board list
- [ ] **Verify**: No console errors
- [ ] **Verify**: Success toast appears

### Read Board

- [ ] Click on the newly created board
- [ ] **Verify**: Board view page loads (showing lists section)
- [ ] **Verify**: Board name appears in header
- [ ] **Verify**: No console errors
- [ ] **Verify**: URL changes to /boards/{boardId}

### Update Board

- [ ] On board view page, click board name or settings
- [ ] Click "Edit" or board title
- [ ] Change name to: "Updated Test Board"
- [ ] Save changes
- [ ] **Verify**: Board name updates in UI
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

### Delete Board

- [ ] Click board menu/settings
- [ ] Click "Delete Board"
- [ ] Confirm deletion in ConfirmDialog
- [ ] **Verify**: Redirect to home page
- [ ] **Verify**: Board removed from list
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

**Status**: ⏹️ Not Started

---

## T059: List CRUD Operations

### Create List

- [ ] Navigate to a board view page
- [ ] Click "Add List" or "+" button
- [ ] Enter list name: "To Do"
- [ ] Submit form
- [ ] **Verify**: New list appears on board
- [ ] **Verify**: List has correct name
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

### Create Multiple Lists

- [ ] Create second list: "In Progress"
- [ ] Create third list: "Done"
- [ ] **Verify**: All lists appear in order
- [ ] **Verify**: Each list can accept cards

### Rename List

- [ ] Click list title
- [ ] Change name to: "Backlog"
- [ ] Save changes (blur or Enter)
- [ ] **Verify**: List name updates
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

### Reorder Lists (Drag-and-Drop)

- [ ] Drag "In Progress" list to first position
- [ ] Release mouse
- [ ] **Verify**: List order updates immediately (optimistic)
- [ ] **Verify**: API call succeeds (check Network tab)
- [ ] **Verify**: Order persists after page refresh
- [ ] **Verify**: No console errors

### Delete List

- [ ] Click list menu (three dots)
- [ ] Click "Delete List"
- [ ] Confirm deletion in ConfirmDialog
- [ ] **Verify**: List disappears
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

**Status**: ⏹️ Not Started

---

## T060: Card CRUD Operations

### Create Card

- [ ] Click "Add Card" in a list
- [ ] Enter card title: "Test Task 1"
- [ ] Submit form
- [ ] **Verify**: New card appears in list
- [ ] **Verify**: Card has correct title
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

### Create Multiple Cards

- [ ] Create 5 cards in "To Do" list
- [ ] Create 3 cards in "In Progress" list
- [ ] **Verify**: All cards appear correctly
- [ ] **Verify**: No console errors

### Edit Card (Update)

- [ ] Click on a card to open CardModal
- [ ] **Verify**: Modal opens with card details
- [ ] Change title to: "Updated Task"
- [ ] Add description: "This is a test card"
- [ ] Click "Save" or update
- [ ] **Verify**: Card updates in list view
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

### Edit Card Details (in Modal)

- [ ] Open card modal
- [ ] Set due date
- [ ] Add labels
- [ ] Add checklist items
- [ ] Add attachment (if implemented)
- [ ] Add comment
- [ ] **Verify**: All changes save correctly
- [ ] **Verify**: Activity feed shows changes
- [ ] **Verify**: No console errors

### Move Card Between Lists (Drag-and-Drop)

- [ ] Drag card from "To Do" to "In Progress"
- [ ] Release mouse
- [ ] **Verify**: Card moves immediately (optimistic update)
- [ ] **Verify**: API call succeeds (check Network tab)
- [ ] **Verify**: Card persists in new list after refresh
- [ ] **Verify**: No console errors

### Reorder Cards Within List

- [ ] Drag card to different position in same list
- [ ] Release mouse
- [ ] **Verify**: Card position updates
- [ ] **Verify**: Order persists after refresh
- [ ] **Verify**: No console errors

### Delete Card

- [ ] Open card modal
- [ ] Click "Delete Card"
- [ ] Confirm deletion in ConfirmDialog
- [ ] **Verify**: Card disappears from list
- [ ] **Verify**: Modal closes
- [ ] **Verify**: Success toast appears
- [ ] **Verify**: No console errors

**Status**: ⏹️ Not Started

---

## T061: Real-Time Updates (Multi-Browser Test)

### Setup

- [ ] Open Browser A: http://localhost:5174 (primary testing browser)
- [ ] Open Browser B: http://localhost:5174 (in incognito or different browser)
- [ ] **Both browsers**: Navigate to same board
- [ ] **Both browsers**: Verify both are viewing same board

### Test Board Updates

- [ ] **Browser A**: Update board name
- [ ] **Browser B**: **Verify** board name updates automatically (within 1s)
- [ ] **Verify**: No manual refresh needed
- [ ] **Verify**: No console errors in either browser

### Test List Creation

- [ ] **Browser A**: Create new list "Real-Time Test"
- [ ] **Browser B**: **Verify** new list appears automatically
- [ ] **Verify**: List appears in correct position
- [ ] **Verify**: No console errors

### Test List Reordering

- [ ] **Browser A**: Drag list to new position
- [ ] **Browser B**: **Verify** list order updates automatically
- [ ] **Verify**: Smooth transition/animation
- [ ] **Verify**: No console errors

### Test Card Creation

- [ ] **Browser A**: Create card "Realtime Card 1"
- [ ] **Browser B**: **Verify** card appears automatically in same list
- [ ] **Verify**: Card appears within 1 second
- [ ] **Verify**: No console errors

### Test Card Movement

- [ ] **Browser A**: Drag card from List 1 to List 2
- [ ] **Browser B**: **Verify** card moves automatically
- [ ] **Verify**: Card removed from List 1, added to List 2
- [ ] **Verify**: No console errors

### Test Card Updates

- [ ] **Browser A**: Open card, update title
- [ ] **Browser B**: **Verify** title updates in card list view
- [ ] **Browser A**: Add comment
- [ ] **Browser B**: Open same card, **Verify** comment appears
- [ ] **Verify**: No console errors

### Test Card Deletion

- [ ] **Browser A**: Delete a card
- [ ] **Browser B**: **Verify** card disappears automatically
- [ ] **Verify**: No console errors

### Test Event Deduplication

- [ ] **Browser A**: Create multiple cards rapidly (5 cards in 5 seconds)
- [ ] **Browser B**: **Verify** all cards appear once (no duplicates)
- [ ] **Browser A**: **Verify** no duplicate toasts
- [ ] **Browser A**: **Verify** no duplicate renders (check React DevTools if needed)

**Status**: ⏹️ Not Started

---

## T062: Error Handling Flows

### Network Error (API Down)

- [ ] Stop backend server (Ctrl+C in backend terminal)
- [ ] Try to create a board
- [ ] **Verify**: Error toast appears with message
- [ ] **Verify**: Toast shows "Retry" button
- [ ] Start backend server again
- [ ] Click "Retry" button in toast
- [ ] **Verify**: Operation succeeds
- [ ] **Verify**: Success toast appears

### Validation Error

- [ ] Try to create board with empty name
- [ ] **Verify**: Validation error toast appears
- [ ] **Verify**: Error message is descriptive
- [ ] Try to create card with very long title (>500 chars)
- [ ] **Verify**: Validation error appears
- [ ] **Verify**: No console errors (handled gracefully)

### Permission Error (if implemented)

- [ ] Try to delete board as non-owner (if auth implemented)
- [ ] **Verify**: Permission error toast appears
- [ ] **Verify**: Operation does not succeed
- [ ] **Verify**: Error message is clear

### Not Found Error

- [ ] Navigate to non-existent board URL: /boards/999999
- [ ] **Verify**: 404 page appears or error toast
- [ ] **Verify**: User can navigate back to home
- [ ] **Verify**: No console errors

### Concurrent Edit Conflict

- [ ] **Browser A**: Open card modal
- [ ] **Browser B**: Delete same card
- [ ] **Browser A**: Try to save changes
- [ ] **Verify**: Error toast indicates card no longer exists
- [ ] **Verify**: Modal closes or shows appropriate message
- [ ] **Verify**: No console errors

### API Timeout

- [ ] (If possible) Simulate slow API response
- [ ] Perform operation that takes >30 seconds
- [ ] **Verify**: Timeout error toast appears
- [ ] **Verify**: Retry option available
- [ ] **Verify**: No console errors

**Status**: ⏹️ Not Started

---

## T063: WebSocket Reconnection

### Manual Disconnect Test

- [ ] Open DevTools → Console
- [ ] Verify WebSocket connection status (should show "Connected" indicator if UI has one)
- [ ] Open DevTools → Network → WS tab
- [ ] Verify WebSocket connection is established
- [ ] **Disconnect computer from network** (disable WiFi or unplug ethernet)
- [ ] **Verify**: "Connection lost" or "Reconnecting..." toast appears
- [ ] **Verify**: WebSocket status indicator shows "Disconnected" or "Reconnecting"
- [ ] **Reconnect computer to network** (enable WiFi or plug ethernet)
- [ ] **Verify**: "Reconnected" toast appears
- [ ] **Verify**: WebSocket status shows "Connected"
- [ ] **Verify**: No console errors

### Reconnection Sync

- [ ] After reconnection, verify data is up-to-date
- [ ] Open a board
- [ ] **Verify**: All lists and cards are current (refetched on reconnect)
- [ ] **Verify**: No stale data visible
- [ ] **Verify**: No duplicate items

### Test Operations After Reconnect

- [ ] After reconnection, create a new card
- [ ] **Verify**: Card creation succeeds
- [ ] **Verify**: Real-time updates resume working
- [ ] **Verify**: No console errors

### Browser Tab Sleep/Wake

- [ ] Leave browser tab idle for 5+ minutes (let computer sleep if possible)
- [ ] Return to tab
- [ ] **Verify**: WebSocket reconnects automatically
- [ ] **Verify**: Data refreshes
- [ ] **Verify**: No console errors

### Multiple Reconnection Cycles

- [ ] Disconnect/reconnect network 3 times rapidly
- [ ] **Verify**: App handles reconnections gracefully
- [ ] **Verify**: No infinite reconnection loops
- [ ] **Verify**: No memory leaks (check DevTools Memory tab)
- [ ] **Verify**: No console errors

**Status**: ⏹️ Not Started

---

## Console Error Monitoring

Throughout all tests, monitor browser console for:

- ❌ **TypeScript errors**: Should be zero
- ❌ **React errors**: No uncaught errors or warnings
- ❌ **Network errors**: Only expected errors (during error testing)
- ❌ **WebSocket errors**: Should reconnect cleanly
- ❌ **Memory leaks**: Monitor DevTools Performance/Memory tabs
- ❌ **404 errors**: For static assets or API endpoints

---

## Success Criteria Summary

**All tests must pass with**:

- ✅ Zero unhandled console errors
- ✅ All CRUD operations work without errors
- ✅ Real-time updates appear within 1 second
- ✅ Error toasts show with retry buttons
- ✅ WebSocket reconnection works reliably
- ✅ No data loss or corruption
- ✅ Optimistic updates work correctly
- ✅ Event deduplication prevents duplicates
- ✅ No memory leaks or performance issues

---

## Testing Notes

**Date**: ******\_******  
**Tester**: ******\_******  
**Environment**:

- Frontend: http://localhost:5174
- Backend: http://localhost:3000
- Database: PostgreSQL (Docker)
- Cache: Redis (Docker)

**Issues Found**: (document any bugs discovered)

1. ***
2. ***
3. ***

**Overall Status**: ⏹️ Not Started / 🟡 In Progress / ✅ Complete / ❌ Failed

---

## Next Steps After Integration Testing

Once all integration tests pass:

1. **Mark tasks complete** in tasks.md (T058-T063)
2. **Proceed to Unit Tests** (T096-T099)
3. **Document any issues** found in IMPLEMENTATION-NOTES.md
4. **Update quickstart.md** if testing revealed gaps in documentation
