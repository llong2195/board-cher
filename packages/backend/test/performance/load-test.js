/**
 * T269 [Phase 10] K6 Performance Testing Script
 *
 * Performance test script for critical API endpoints.
 * Target: 1000 req/s with p95 latency <200ms
 *
 * Run with: k6 run packages/backend/test/performance/load-test.js
 *
 * Test stages:
 * 1. Ramp up: 0 → 100 VUs over 1 minute
 * 2. Sustained load: 100 VUs for 3 minutes
 * 3. Spike test: 100 → 500 VUs over 1 minute
 * 4. Recovery: 500 → 0 VUs over 1 minute
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const boardCreationTime = new Trend('board_creation_duration');
const cardCreationTime = new Trend('card_creation_duration');
const searchResponseTime = new Trend('search_response_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp up to 100 VUs
    { duration: '3m', target: 100 }, // Stay at 100 VUs
    { duration: '1m', target: 500 }, // Spike to 500 VUs
    { duration: '1m', target: 0 }, // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must be < 200ms
    http_req_failed: ['rate<0.01'], // Error rate must be < 1%
    errors: ['rate<0.01'], // Custom error rate < 1%
    http_reqs: ['rate>1000'], // Must handle > 1000 req/s
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
let authToken = '';
let testOrgId = '';
let testBoardId = '';
let testListId = '';

// Setup function - runs once per VU
export function setup() {
  // Create test user and get auth token
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'loadtest@example.com',
      password: 'Test123!@#',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (loginRes.status === 200) {
    const token = loginRes.json('token');
    console.log('Setup: Auth token obtained');
    return { token };
  }

  // If login fails, try to register
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email: 'loadtest@example.com',
      password: 'Test123!@#',
      name: 'Load Test User',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (registerRes.status === 201) {
    const token = registerRes.json('token');
    console.log('Setup: New user registered');
    return { token };
  }

  console.error('Setup failed: Could not obtain auth token');
  return { token: '' };
}

// Main test function
export default function (data) {
  if (!data.token) {
    console.error('No auth token available, skipping test');
    return;
  }

  authToken = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  // Test 1: Organization Management
  group('Organization Management', () => {
    // Create organization
    const orgPayload = JSON.stringify({
      name: `Test Org ${__VU}-${__ITER}`,
      slug: `test-org-${__VU}-${__ITER}`,
    });

    const orgRes = http.post(`${BASE_URL}/api/organizations`, orgPayload, {
      headers,
    });

    const orgSuccess = check(orgRes, {
      'org created': (r) => r.status === 201,
      'org has ID': (r) => r.json('id') !== undefined,
    });

    errorRate.add(!orgSuccess);

    if (orgSuccess) {
      testOrgId = orgRes.json('id');
    }

    sleep(0.1);
  });

  // Test 2: Board CRUD Operations
  group('Board Operations', () => {
    if (!testOrgId) return;

    // Create board
    const boardPayload = JSON.stringify({
      name: `Test Board ${__VU}-${__ITER}`,
      organizationId: testOrgId,
    });

    const createStart = Date.now();
    const boardRes = http.post(`${BASE_URL}/api/boards`, boardPayload, {
      headers,
    });
    boardCreationTime.add(Date.now() - createStart);

    const boardSuccess = check(boardRes, {
      'board created': (r) => r.status === 201,
      'board has ID': (r) => r.json('id') !== undefined,
    });

    errorRate.add(!boardSuccess);

    if (boardSuccess) {
      testBoardId = boardRes.json('id');
    }

    sleep(0.1);

    // Get board
    if (testBoardId) {
      const getRes = http.get(`${BASE_URL}/api/boards/${testBoardId}`, {
        headers,
      });

      check(getRes, {
        'board retrieved': (r) => r.status === 200,
        'board data valid': (r) => r.json('name') !== undefined,
      });

      sleep(0.1);
    }
  });

  // Test 3: List and Card Operations
  group('List and Card Operations', () => {
    if (!testBoardId) return;

    // Create list
    const listPayload = JSON.stringify({
      name: `Test List ${__VU}-${__ITER}`,
    });

    const listRes = http.post(
      `${BASE_URL}/api/boards/${testBoardId}/lists`,
      listPayload,
      { headers },
    );

    const listSuccess = check(listRes, {
      'list created': (r) => r.status === 201,
    });

    if (listSuccess) {
      testListId = listRes.json('id');
    }

    sleep(0.1);

    // Create cards
    if (testListId) {
      for (let i = 0; i < 3; i++) {
        const cardPayload = JSON.stringify({
          title: `Test Card ${__VU}-${__ITER}-${i}`,
          description: `Description for card ${i}`,
        });

        const createStart = Date.now();
        const cardRes = http.post(
          `${BASE_URL}/api/lists/${testListId}/cards`,
          cardPayload,
          { headers },
        );
        cardCreationTime.add(Date.now() - createStart);

        check(cardRes, {
          'card created': (r) => r.status === 201,
        });

        sleep(0.05);
      }
    }
  });

  // Test 4: Search and Filter Operations
  group('Search Operations', () => {
    if (!testBoardId) return;

    const searchStart = Date.now();
    const searchRes = http.get(
      `${BASE_URL}/api/boards/${testBoardId}/cards/search?q=Test&limit=20`,
      { headers },
    );
    searchResponseTime.add(Date.now() - searchStart);

    check(searchRes, {
      'search completed': (r) => r.status === 200,
      'search has results': (r) => r.json('data') !== undefined,
    });

    sleep(0.1);
  });

  // Test 5: Real-time Activity Feed
  group('Activity Feed', () => {
    if (!testBoardId) return;

    const activityRes = http.get(
      `${BASE_URL}/api/activity/board/${testBoardId}?page=1&limit=20`,
      { headers },
    );

    check(activityRes, {
      'activity retrieved': (r) => r.status === 200,
      'activity has pagination': (r) => r.json('pagination') !== undefined,
    });

    sleep(0.1);
  });

  // Test 6: Cleanup (optional - every 10th iteration)
  if (__ITER % 10 === 0 && testBoardId) {
    http.del(`${BASE_URL}/api/boards/${testBoardId}`, { headers });
  }

  // Random think time between iterations
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Teardown function
export function teardown(data) {
  if (!data.token) return;

  const headers = {
    Authorization: `Bearer ${data.token}`,
  };

  // Clean up test data (optional)
  console.log('Teardown: Performance test completed');
}
