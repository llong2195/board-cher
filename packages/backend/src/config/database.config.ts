import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const databaseType = process.env.DATABASE_TYPE || 'sqlite';

    const baseConfig: Partial<TypeOrmModuleOptions> = {
      entities: [
        __dirname +
          '/../infrastructure/persistence/entities/**/*.entity{.ts,.js}',
      ],
      migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
      logging: process.env.DATABASE_LOGGING === 'true' || isDevelopment,
    };

    if (databaseType === 'postgres') {
      return {
        ...baseConfig,
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'trello',
        password: process.env.DATABASE_PASSWORD || 'trello123',
        database: process.env.DATABASE_NAME || 'trello_vibe',
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false,
      } as TypeOrmModuleOptions;
    }

    // SQLite for development
    return {
      ...baseConfig,
      type: 'sqlite',
      database: process.env.DATABASE_NAME || './dev.sqlite3',
    } as TypeOrmModuleOptions;
  },
);

// DataSource for migrations CLI
export const AppDataSource = new DataSource({
  type: process.env.DATABASE_TYPE === 'postgres' ? 'postgres' : 'sqlite',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'trello',
  password: process.env.DATABASE_PASSWORD || 'trello123',
  database:
    process.env.DATABASE_NAME ||
    (process.env.DATABASE_TYPE === 'postgres'
      ? 'trello_vibe'
      : './dev.sqlite3'),
  entities: [
    __dirname + '/../infrastructure/persistence/entities/**/*.entity{.ts,.js}',
  ],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true' || false,
} as DataSourceOptions);
