import * as Joi from 'joi';

/**
 * Configuration schema validation using Joi
 */
export const configSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional().default('http://localhost:3001'),
    otherwise: Joi.required(),
  }),

  // Database - PostgreSQL only
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().default('postgres'),
  DATABASE_PASSWORD: Joi.string().default('password'),
  DATABASE_NAME: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional().default('trello_test'),
    otherwise: Joi.optional().default('trello'),
  }),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),
  DATABASE_LOGGING: Joi.boolean().default(false),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional().default('test-secret'),
    otherwise: Joi.required(),
  }),
  JWT_REFRESH_SECRET: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional().default('test-refresh-secret'),
    otherwise: Joi.required(),
  }),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // File Storage
  STORAGE_TYPE: Joi.string().valid('local', 's3').default('local'),
  STORAGE_PATH: Joi.string().when('STORAGE_TYPE', {
    is: 'local',
    then: Joi.when('NODE_ENV', {
      is: 'test',
      then: Joi.optional().default('./test-storage'),
      otherwise: Joi.required(),
    }),
  }),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
