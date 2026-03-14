import { Effect } from "effect";
import { siiAccounts } from "@emisso/accounting";
import type { AccountRepo } from "../repos/account-repo.js";
import type { AccountRow } from "../db/schema/accounts.js";
import type { UpsertAccountInput } from "../validation/schemas.js";
import type { AppError } from "../core/effect/app-error.js";

export interface AccountServiceDeps {
  accountRepo: AccountRepo;
}

export function createAccountService(deps: AccountServiceDeps) {
  const { accountRepo } = deps;

  return {
    listAccounts(tenantId: string): Effect.Effect<AccountRow[], AppError> {
      return accountRepo.findAll(tenantId);
    },

    upsertAccount(tenantId: string, data: UpsertAccountInput): Effect.Effect<AccountRow, AppError> {
      return accountRepo.upsert(tenantId, data);
    },

    deleteAccount(tenantId: string, code: string): Effect.Effect<void, AppError> {
      return accountRepo.deleteByCode(tenantId, code);
    },

    /**
     * Seed the standard SII chart of accounts for a tenant.
     */
    seedSiiChart(tenantId: string): Effect.Effect<AccountRow[], AppError> {
      return Effect.forEach(siiAccounts, (account) =>
        accountRepo.upsert(tenantId, {
          code: account.code,
          name: account.name,
          type: account.type,
          parentCode: account.parentCode,
          siiClassifier: account.siiClassifier,
          description: account.description,
        }),
      );
    },
  };
}

export type AccountService = ReturnType<typeof createAccountService>;
