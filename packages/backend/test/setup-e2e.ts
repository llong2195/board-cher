// Setup for E2E tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
process.env.DATABASE_PORT = process.env.DATABASE_PORT || '5432';
process.env.DATABASE_USER = process.env.DATABASE_USER || 'trello';
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || 'trello';
process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'trello_test';
