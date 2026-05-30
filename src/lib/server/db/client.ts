import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const fallbackDatabaseUrl = 'postgres://postgres:postgres@localhost:5432/postgres';
const databaseUrl = env.DATABASE_URL || fallbackDatabaseUrl;

const client = postgres(databaseUrl, {
  prepare: false
});

export const db = drizzle(client, { schema });

export function assertDatabaseConfigured(): void {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diatur. Isi dengan connection string Supabase Postgres.');
  }
}
