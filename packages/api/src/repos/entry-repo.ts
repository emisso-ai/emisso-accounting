import { Effect } from "effect";
import { eq, and, inArray } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { journalEntries, type JournalEntryRow, type NewJournalEntryRow } from "../db/schema/journal-entries.js";
import { entryLines, type EntryLineRow, type NewEntryLineRow } from "../db/schema/entry-lines.js";
import { DbError, NotFoundError } from "../core/effect/app-error.js";
import { queryOneOrFail } from "../core/effect/repo-helpers.js";

export interface EntryWithLines extends JournalEntryRow {
  lines: EntryLineRow[];
}

export function createEntryRepo(db: PgDatabase<any>) {
  async function batchLoadLines(entries: JournalEntryRow[]): Promise<EntryWithLines[]> {
    const entryIds = entries.map((e) => e.id);
    if (entryIds.length === 0) return [];

    const allLines = await db.select().from(entryLines).where(inArray(entryLines.entryId, entryIds));

    const linesByEntry = new Map<string, EntryLineRow[]>();
    for (const line of allLines) {
      const existing = linesByEntry.get(line.entryId) ?? [];
      existing.push(line);
      linesByEntry.set(line.entryId, existing);
    }

    return entries.map((entry) => ({
      ...entry,
      lines: linesByEntry.get(entry.id) ?? [],
    }));
  }

  return {
    create(
      entry: NewJournalEntryRow,
      lines: Omit<NewEntryLineRow, "entryId">[],
    ): Effect.Effect<EntryWithLines, DbError> {
      return Effect.tryPromise({
        try: async () => {
          const [inserted] = await db.insert(journalEntries).values(entry).returning();
          const entryRow = inserted!;
          const lineValues = lines.map((l) => ({ ...l, entryId: entryRow.id }));
          const insertedLines = await db.insert(entryLines).values(lineValues).returning();
          return { ...entryRow, lines: insertedLines };
        },
        catch: (e) => DbError.make("entry.create", e),
      });
    },

    findById(entryId: string): Effect.Effect<EntryWithLines, DbError | NotFoundError> {
      return Effect.tryPromise({
        try: async () => {
          const rows = await db.select().from(journalEntries).where(eq(journalEntries.id, entryId));
          const entryRow = rows[0];
          if (!entryRow) return undefined;
          const lines = await db.select().from(entryLines).where(eq(entryLines.entryId, entryId));
          return { ...entryRow, lines };
        },
        catch: (e) => DbError.make("entry.findById", e),
      }).pipe(
        Effect.flatMap((row) =>
          row
            ? Effect.succeed(row)
            : Effect.fail(NotFoundError.make("JournalEntry", entryId)),
        ),
      );
    },

    findByPeriod(
      tenantId: string,
      year: number,
      month: number,
    ): Effect.Effect<EntryWithLines[], DbError> {
      return Effect.tryPromise({
        try: async () => {
          const entries = await db.select().from(journalEntries).where(
            and(
              eq(journalEntries.tenantId, tenantId),
              eq(journalEntries.periodYear, year),
              eq(journalEntries.periodMonth, month),
            ),
          );
          return batchLoadLines(entries);
        },
        catch: (e) => DbError.make("entry.findByPeriod", e),
      });
    },

    findByTenant(tenantId: string): Effect.Effect<EntryWithLines[], DbError> {
      return Effect.tryPromise({
        try: async () => {
          const entries = await db.select().from(journalEntries).where(
            eq(journalEntries.tenantId, tenantId),
          );
          return batchLoadLines(entries);
        },
        catch: (e) => DbError.make("entry.findByTenant", e),
      });
    },

    markVoided(entryId: string, voidedBy: string): Effect.Effect<void, DbError> {
      return Effect.tryPromise({
        try: () =>
          db.update(journalEntries)
            .set({ voidedBy })
            .where(eq(journalEntries.id, entryId))
            .then(() => {}),
        catch: (e) => DbError.make("entry.markVoided", e),
      });
    },
  };
}

export type EntryRepo = ReturnType<typeof createEntryRepo>;
