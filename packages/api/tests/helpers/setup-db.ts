/**
 * PGLite test helper — creates an in-memory PostgreSQL instance
 * with the accounting schema applied via raw SQL DDL.
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";

/**
 * Creates a PGLite instance and applies the accounting schema.
 * Returns the raw PGLite instance and the Drizzle DB wrapper.
 */
export async function setupTestDb(): Promise<{
  pglite: PGlite;
  db: PgliteDatabase;
}> {
  const pglite = new PGlite();
  const db = drizzle(pglite);

  await pglite.exec(SCHEMA_SQL);

  return { pglite, db };
}

/**
 * Truncates all tables in the accounting schema (for afterEach cleanup).
 */
export async function truncateAll(pglite: PGlite): Promise<void> {
  await pglite.exec(`
    TRUNCATE TABLE
      accounting.entry_lines,
      accounting.journal_entries,
      accounting.periods,
      accounting.accounts
    CASCADE;
  `);
}

// ── Raw DDL for all tables ──────────────────────────────────────────────

const SCHEMA_SQL = `
CREATE SCHEMA IF NOT EXISTS accounting;

-- Accounts (chart of accounts)
CREATE TABLE IF NOT EXISTS accounting.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parent_code TEXT,
  sii_classifier TEXT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Journal entries
CREATE TABLE IF NOT EXISTS accounting.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  voided_by UUID,
  voids_entry UUID,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Entry lines
CREATE TABLE IF NOT EXISTS accounting.entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES accounting.journal_entries(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  debit NUMERIC(16,0) NOT NULL DEFAULT 0,
  credit NUMERIC(16,0) NOT NULL DEFAULT 0
);

-- Periods
CREATE TABLE IF NOT EXISTS accounting.periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  closed_at TIMESTAMP,
  locked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, year, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounting_entries_tenant_period
  ON accounting.journal_entries(tenant_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_accounting_entry_lines_entry
  ON accounting.entry_lines(entry_id);
`;
