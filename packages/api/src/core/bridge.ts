/**
 * Converts between engine types and DB rows.
 */

import { Effect } from "effect";
import type { JournalEntry, EntryLine, Account } from "@emisso/accounting";
import type { AccountRow } from "../db/schema/accounts.js";
import type { JournalEntryRow } from "../db/schema/journal-entries.js";
import type { EntryLineRow } from "../db/schema/entry-lines.js";
import type { EntryWithLines, EntryRepo } from "../repos/entry-repo.js";
import type { DbError } from "./effect/app-error.js";

// ── Account ──

export function accountRowToEngine(row: AccountRow): Account {
  return {
    code: row.code,
    name: row.name,
    type: row.type as Account["type"],
    parentCode: row.parentCode ?? undefined,
    siiClassifier: row.siiClassifier ?? undefined,
    description: row.description ?? undefined,
  };
}

// ── Entry Lines ──

export function entryLineRowToEngine(row: EntryLineRow): EntryLine {
  return {
    accountCode: row.accountCode,
    debit: Number(row.debit),
    credit: Number(row.credit),
  };
}

// ── Journal Entry ──

export function entryWithLinesToEngine(row: EntryWithLines): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    lines: row.lines.map(entryLineRowToEngine),
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    voidedBy: row.voidedBy ?? undefined,
    voidsEntry: row.voidsEntry ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── Shared helpers ──

export function loadPeriodEntries(
  entryRepo: EntryRepo,
  tenantId: string,
  year: number,
  month: number,
): Effect.Effect<JournalEntry[], DbError> {
  return entryRepo.findByPeriod(tenantId, year, month).pipe(
    Effect.map((rows) => rows.map(entryWithLinesToEngine)),
  );
}
