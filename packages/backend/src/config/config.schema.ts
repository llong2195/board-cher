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

  // Database
  DATABASE_TYPE: Joi.string().valid('sqlite', 'postgres').default('sqlite'),
  DATABASE_PATH: Joi.string().when('DATABASE_TYPE', {
    is: 'sqlite',
    then: Joi.when('NODE_ENV', {
      is: 'test',
      then: Joi.optional().default('./test.sqlite3'),
      otherwise: Joi.required(),
    }),
  }),
  DATABASE_HOST: Joi.string().when('DATABASE_TYPE', {
    is: 'postgres',
    then: Joi.required(),
  }),
  DATABASE_PORT: Joi.number().when('DATABASE_TYPE', {
    is: 'postgres',
    then: Joi.required(),
  }),
  DATABASE_USER: Joi.string().when('DATABASE_TYPE', {
    is: 'postgres',
    then: Joi.required(),
  }),
  DATABASE_PASSWORD: Joi.string().when('DATABASE_TYPE', {
    is: 'postgres',
    then: Joi.required(),
  }),
  DATABASE_NAME: Joi.string().when('DATABASE_TYPE', {
    is: 'postgres',
    then: Joi.required(),
  }),

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
