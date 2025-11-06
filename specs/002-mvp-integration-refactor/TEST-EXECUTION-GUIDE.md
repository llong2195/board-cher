# Test Execution Guide - Quick Reference

**Feature**: 002-mvp-integration-refactor  
**Last Updated**: 2025-01-31

---

## Prerequisites

### Development Environment Setup

```bash
# Install dependencies (if not already done)
pnpm install

# Start backend server (terminal 1)
cd packages/backend
pnpm dev

# Start frontend dev server (terminal 2)
cd packages/frontend
pnpm dev

# Ensure database is running
# PostgreSQL should be running on port 5432
# Redis should be running on port 6379
```

---

## Unit Tests

### Run All Unit Tests

```bash
cd packages/frontend
pnpm test test/unit/
```

### Run Specific Test Suites

```bash
# Test all hooks
pnpm test test/unit/hooks/

# Test all services
pnpm test test/unit/services/

# Test specific file
pnpm test test/unit/hooks/useGetBoard.test.ts
```

### Run with Coverage

```bash
pnpm test:coverage
```

### Run in Watch Mode

```bash
pnpm test test/unit/ --watch
```

### Run with UI

```bash
pnpm test:ui
```

**Expected Result**: All unit tests should pass (80+ tests)

---

## E2E Tests (Playwright)

### Prerequisites

```bash
# Ensure Playwright browsers are installed
npx playwright install

# Verify backend is running on localhost:3000
curl http://localhost:3000/health

# Verify frontend is running on localhost:5173
curl http://localhost:5173
```

### Run All E2E Tests

```bash
cd packages/frontend
pnpm test:e2e
```

### Run Specific Test Files

```bash
# Board CRUD tests
pnpm test:e2e test/e2e/board.spec.ts

# Card management tests
pnpm test:e2e test/e2e/cards.spec.ts

# Real-time collaboration tests
pnpm test:e2e test/e2e/collaboration.spec.ts

# Error handling tests
pnpm test:e2e test/e2e/errors.spec.ts

# Authentication tests
pnpm test:e2e test/e2e/auth.spec.ts

# Search tests
pnpm test:e2e test/e2e/search.spec.ts
```

### Run with UI (Interactive)

```bash
pnpm test:e2e --ui
```

### Run in Headed Mode (See Browser)

```bash
pnpm test:e2e --headed
```

### Run with Debugging

```bash
pnpm test:e2e:debug
```

### Generate Test Report

```bash
pnpm test:e2e
pnpm test:e2e:report
```

**Expected Result**: All E2E tests should pass (70+ scenarios)

---

## Full Test Suite

### Run Everything

```bash
# From project root
pnpm test

# Or run sequentially
cd packages/frontend
pnpm test && pnpm test:e2e
```

### Run with Coverage + E2E

```bash
pnpm test:coverage
pnpm test:e2e
```

---

## Quality Checks

### ESLint

```bash
cd packages/frontend
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

**Expected Result**: ✅ No errors, no warnings

### TypeScript Compilation

```bash
cd packages/frontend
npx tsc -b --noEmit
```

**Expected Result**: ✅ No compilation errors

### Build Verification

```bash
cd packages/frontend
pnpm build
```

**Expected Result**: ✅ Build succeeds without errors

---

## Manual Testing Checklist (T058-T063)

### Test 1: Board CRUD Operations

- [ ] Create a new board
- [ ] View board details
- [ ] Update board name
- [ ] Delete board
- [ ] Verify toast notifications appear

### Test 2: List Management

- [ ] Create lists in a board
- [ ] Rename list
- [ ] Reorder lists (drag & drop)
- [ ] Delete list
- [ ] Verify real-time updates

### Test 3: Card Management

- [ ] Create card in a list
- [ ] Open card modal
- [ ] Edit card title and description
- [ ] Add comments
- [ ] Add checklist
- [ ] Check checklist items
- [ ] Move card between lists (drag & drop)
- [ ] Delete card

### Test 4: Real-Time Updates

- [ ] Open same board in two browser windows
- [ ] Create card in window 1
- [ ] Verify card appears in window 2 automatically
- [ ] Move card in window 1
- [ ] Verify movement in window 2
- [ ] Add comment in window 2
- [ ] Verify comment in window 1

### Test 5: WebSocket Reconnection

- [ ] Open board with DevTools Network tab
- [ ] Disconnect network (offline simulation)
- [ ] Verify "Reconnecting..." toast appears
- [ ] Restore network connection
- [ ] Verify "Connected" success toast appears
- [ ] Verify board data syncs correctly

### Test 6: Error Handling

- [ ] Try to create board with empty name (validation error)
- [ ] Try to create card with empty title (validation error)
- [ ] Disconnect network and try to create card (network error)
- [ ] Navigate to non-existent board URL (404 error)
- [ ] Verify all error toasts display correctly
- [ ] Verify recovery after errors

---

## Performance Testing (T118)

### Lighthouse Audit

```bash
# 1. Build production version
cd packages/frontend
pnpm build
pnpm preview

# 2. Open Chrome DevTools
# 3. Navigate to Lighthouse tab
# 4. Run audit with Performance category
```

**Target Metrics**:

- Page load: <2 seconds
- First Contentful Paint: <1.5s
- Time to Interactive: <2.5s
- API response time: <200ms

### Manual Performance Check

```bash
# 1. Open DevTools Network tab
# 2. Perform these actions and verify timings:

# Board list page load
Navigate to /boards
Verify: Initial load <2s, API call <200ms

# Board detail page load
Click on a board
Verify: Load <2s, API call <200ms

# Card creation
Create a card
Verify: API call <200ms, UI update immediate

# Real-time update
Create card in another window
Verify: Update appears <1s
```

---

## Browser Compatibility Testing (T123)

### Test Matrix

```
✓ Chrome (Latest)
✓ Firefox (Latest)
✓ Edge (Latest)
✓ Safari (Latest) - macOS only
```

### Test Scenarios (Per Browser)

1. **Board CRUD**: Create, view, update, delete board
2. **Card Drag-Drop**: Move card between lists
3. **Real-Time**: Open two tabs, verify updates
4. **Responsive Design**: Test at 1920x1080, 1366x768, 375x667
5. **Console Errors**: Check for any console errors during operations

### How to Test

```bash
# Chrome (default)
pnpm test:e2e --project=chromium

# Firefox
pnpm test:e2e --project=firefox

# Safari (macOS only)
pnpm test:e2e --project=webkit

# All browsers
pnpm test:e2e
```

---

## Troubleshooting

### Unit Tests Failing

**Issue**: `Cannot find module '@/...'`  
**Solution**: TypeScript path aliases issue - run via `pnpm test` which uses Vitest config

**Issue**: `vi.mocked is not a function`  
**Solution**: Ensure Vitest version >= 4.0

**Issue**: `ReferenceError: document is not defined`  
**Solution**: Test file should use `renderHook` from `@testing-library/react`

### E2E Tests Failing

**Issue**: `Timeout waiting for element`  
**Solution**:

- Increase timeout: `expect(...).toBeVisible({ timeout: 10000 })`
- Check backend is running
- Check WebSocket connection

**Issue**: `Cannot connect to localhost:3000`  
**Solution**: Start backend server first

**Issue**: `Test user already exists`  
**Solution**: Tests use dynamic emails with timestamps - should auto-resolve

**Issue**: Drag-drop not working  
**Solution**:

- Verify element has proper data attributes
- Use `dragTo()` method from Playwright
- Add wait before drag: `await page.waitForLoadState('networkidle')`

### Backend Issues

**Issue**: Database connection error  
**Solution**:

- Verify PostgreSQL is running
- Check connection string in `.env`
- Run migrations: `pnpm migration:run`

**Issue**: WebSocket connection failing  
**Solution**:

- Verify Redis is running (required for scaling)
- Check WebSocket URL in frontend `.env`
- Check CORS settings in backend

---

## CI/CD Integration (Future)

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Quick Command Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm preview                # Preview production build

# Testing
pnpm test                   # Run unit tests
pnpm test:coverage          # Unit tests with coverage
pnpm test:ui                # Interactive test UI
pnpm test:e2e               # Run E2E tests
pnpm test:e2e --ui          # Interactive E2E UI
pnpm test:e2e:debug         # Debug E2E tests

# Quality
pnpm lint                   # Run ESLint
pnpm lint --fix             # Auto-fix ESLint issues
npx tsc -b --noEmit         # TypeScript check

# Utilities
npx playwright codegen      # Generate E2E test code
npx playwright show-report  # View test report
```

---

## Test Execution Checklist

### Before Running Tests

- [ ] Backend server running on port 3000
- [ ] Frontend dev server running on port 5173
- [ ] PostgreSQL database running on port 5432
- [ ] Redis running on port 6379
- [ ] Database migrations applied
- [ ] Environment variables set

### Test Execution Order

1. [ ] Run ESLint check
2. [ ] Run TypeScript compilation check
3. [ ] Run unit tests
4. [ ] Run E2E tests
5. [ ] Manual integration testing
6. [ ] Performance testing
7. [ ] Browser compatibility testing

### Post-Test Actions

- [ ] Review test coverage report
- [ ] Document any failures
- [ ] Fix failing tests
- [ ] Update test documentation if needed
- [ ] Commit test improvements

---

**For Questions**: See `PHASE6-TESTING-STATUS.md` or `SESSION-SUMMARY.md`
