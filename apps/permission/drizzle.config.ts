import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://openone:openone_dev@localhost:5432/openone',
    },
    schemaFilter: ['GJgUM0k-UkbS6v0L87Fio_permission'],
});
