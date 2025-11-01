import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const baseConfig: Partial<TypeOrmModuleOptions> = {
      entities: [
        __dirname +
          '/../infrastructure/persistence/entities/**/*.entity{.ts,.js}',
      ],
      migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
      logging: process.env.DATABASE_LOGGING === 'true' || isDevelopment,
    };

    // PostgreSQL configuration
    return {
      ...baseConfig,
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'trello',
      password: process.env.DATABASE_PASSWORD || 'trello',
      database: process.env.DATABASE_NAME || 'trello',
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
    } as TypeOrmModuleOptions;
  },
);

// DataSource for migrations CLI - created lazily
let appDataSource: DataSource | null = null;

export const getAppDataSource = (): DataSource => {
  if (!appDataSource) {
    appDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'trello',
      entities: [
        __dirname +
          '/../infrastructure/persistence/entities/**/*.entity{.ts,.js}',
      ],
      migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
      synchronize: false,
      logging: process.env.DATABASE_LOGGING === 'true' || false,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
    } as DataSourceOptions);
  }
  return appDataSource;
};

// Export for migrations - but don't eagerly create it
// Use: `getAppDataSource()` in migration scripts
export { getAppDataSource as AppDataSource };
