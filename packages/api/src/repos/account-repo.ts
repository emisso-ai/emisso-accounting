import { Effect } from "effect";
import { eq, and } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { accounts, type AccountRow, type NewAccountRow } from "../db/schema/accounts.js";
import { DbError, NotFoundError } from "../core/effect/app-error.js";
import { queryOneOrFail } from "../core/effect/repo-helpers.js";

export function createAccountRepo(db: PgDatabase<any>) {
  return {
    findAll(tenantId: string): Effect.Effect<AccountRow[], DbError> {
      return Effect.tryPromise({
        try: () => db.select().from(accounts).where(eq(accounts.tenantId, tenantId)),
        catch: (e) => DbError.make("account.findAll", e),
      });
    },

    findByCode(tenantId: string, code: string): Effect.Effect<AccountRow, DbError | NotFoundError> {
      return queryOneOrFail("account.findByCode", "Account", code, () =>
        db.select().from(accounts)
          .where(and(eq(accounts.tenantId, tenantId), eq(accounts.code, code)))
          .then((rows) => rows[0]),
      );
    },

    upsert(tenantId: string, data: Omit<NewAccountRow, "tenantId">): Effect.Effect<AccountRow, DbError> {
      return Effect.tryPromise({
        try: () =>
          db.insert(accounts)
            .values({ ...data, tenantId })
            .onConflictDoUpdate({
              target: [accounts.tenantId, accounts.code],
              set: { name: data.name, type: data.type, parentCode: data.parentCode, siiClassifier: data.siiClassifier, description: data.description, updatedAt: new Date() },
            })
            .returning()
            .then((rows) => rows[0]!),
        catch: (e) => DbError.make("account.upsert", e),
      });
    },

    deleteByCode(tenantId: string, code: string): Effect.Effect<void, DbError> {
      return Effect.tryPromise({
        try: () => db.delete(accounts).where(and(eq(accounts.tenantId, tenantId), eq(accounts.code, code))).then(() => {}),
        catch: (e) => DbError.make("account.delete", e),
      });
    },
  };
}

export type AccountRepo = ReturnType<typeof createAccountRepo>;
