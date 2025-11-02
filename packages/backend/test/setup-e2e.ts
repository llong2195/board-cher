// Setup for E2E tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = process.env.DATABASE_HOST_TEST || 'localhost';
process.env.DATABASE_PORT = process.env.DATABASE_PORT_TEST || '5432';
process.env.DATABASE_USER = process.env.DATABASE_USER_TEST || 'postgres';
process.env.DATABASE_PASSWORD =
  process.env.DATABASE_PASSWORD_TEST || 'password';
process.env.DATABASE_NAME = process.env.DATABASE_NAME_TEST || 'trello_test';
