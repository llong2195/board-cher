# Migrations

This directory contains TypeORM database migrations for schema versioning.

## Commands

```bash
# Generate a new migration from entity changes
pnpm run migration:generate --name=MigrationName

# Create an empty migration file
pnpm run migration:create --name=MigrationName

# Run pending migrations
pnpm run migration:run

# Revert the last migration
pnpm run migration:revert

# Show all migrations and their status
pnpm run migration:show
```

## Naming Convention

Migrations are automatically timestamped: `[timestamp]-[name].ts`

Example: `1730419200000-CreateUserTable.ts`

## Best Practices

1. **Never modify existing migrations** - Create new ones for changes
2. **Test migrations** both up and down before committing
3. **Keep migrations focused** - One logical change per migration
4. **Add indexes** for foreign keys and frequently queried columns
5. **Use transactions** for data migrations to ensure atomicity
