import { Effect } from "effect";
import { eq, and } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { periods, type PeriodRow, type NewPeriodRow } from "../db/schema/periods.js";
import { DbError, NotFoundError } from "../core/effect/app-error.js";
import { queryOneOrFail } from "../core/effect/repo-helpers.js";

export function createPeriodRepo(db: PgDatabase<any>) {
  return {
    findAll(tenantId: string): Effect.Effect<PeriodRow[], DbError> {
      return Effect.tryPromise({
        try: () => db.select().from(periods).where(eq(periods.tenantId, tenantId)),
        catch: (e) => DbError.make("period.findAll", e),
      });
    },

    findByYearMonth(
      tenantId: string,
      year: number,
      month: number,
    ): Effect.Effect<PeriodRow, DbError | NotFoundError> {
      return queryOneOrFail("period.findByYearMonth", "Period", `${year}-${month}`, () =>
        db.select().from(periods)
          .where(and(eq(periods.tenantId, tenantId), eq(periods.year, year), eq(periods.month, month)))
          .then((rows) => rows[0]),
      );
    },

    upsert(data: NewPeriodRow): Effect.Effect<PeriodRow, DbError> {
      return Effect.tryPromise({
        try: () =>
          db.insert(periods)
            .values(data)
            .onConflictDoUpdate({
              target: [periods.tenantId, periods.year, periods.month],
              set: { status: data.status, closedAt: data.closedAt, lockedAt: data.lockedAt, updatedAt: new Date() },
            })
            .returning()
            .then((rows) => rows[0]!),
        catch: (e) => DbError.make("period.upsert", e),
      });
    },

    updateStatus(
      tenantId: string,
      year: number,
      month: number,
      status: string,
      timestamp?: Date,
    ): Effect.Effect<PeriodRow, DbError | NotFoundError> {
      return Effect.tryPromise({
        try: async () => {
          const set: Record<string, unknown> = { status, updatedAt: new Date() };
          if (status === "closed") set.closedAt = timestamp ?? new Date();
          if (status === "locked") set.lockedAt = timestamp ?? new Date();
          const rows = await db.update(periods)
            .set(set)
            .where(and(eq(periods.tenantId, tenantId), eq(periods.year, year), eq(periods.month, month)))
            .returning();
          return rows[0];
        },
        catch: (e) => DbError.make("period.updateStatus", e),
      }).pipe(
        Effect.flatMap((row) =>
          row
            ? Effect.succeed(row)
            : Effect.fail(NotFoundError.make("Period", `${year}-${month}`)),
        ),
      );
    },
  };
}

export type PeriodRepo = ReturnType<typeof createPeriodRepo>;
