import { Effect } from "effect";
import {
  createLedger,
  createSiiChart,
  type JournalEntry,
  type TrialBalance,
  type Balance8Columnas,
  type IncomeStatement,
  type BalanceSheet,
} from "@emisso/accounting";
import type { EntryRepo, EntryWithLines } from "../repos/entry-repo.js";
import type { AccountRepo } from "../repos/account-repo.js";
import type { PeriodService } from "./period-service.js";
import {
  UnbalancedEntryError,
  AccountNotFoundError,
  type AppError,
} from "../core/effect/app-error.js";
import { entryWithLinesToEngine, loadPeriodEntries } from "../core/bridge.js";
import type { CreateEntryInput } from "../validation/schemas.js";

const siiChart = createSiiChart();

export interface LedgerServiceDeps {
  entryRepo: EntryRepo;
  accountRepo: AccountRepo;
  periodService: PeriodService;
}

export function createLedgerService(deps: LedgerServiceDeps) {
  const { entryRepo, accountRepo, periodService } = deps;

  /**
   * Hydrate engine entries from DB for a given tenant + period.
   */
  function loadEntries(
    tenantId: string,
    year: number,
    month: number,
  ): Effect.Effect<JournalEntry[], AppError> {
    return loadPeriodEntries(entryRepo, tenantId, year, month);
  }

  /**
   * Hydrate all entries for a tenant (for cross-period reports).
   */
  function loadAllEntries(
    tenantId: string,
  ): Effect.Effect<JournalEntry[], AppError> {
    return entryRepo.findByTenant(tenantId).pipe(
      Effect.map((rows) => rows.map(entryWithLinesToEngine)),
    );
  }

  /**
   * Build a Ledger instance from DB state.
   */
  function buildLedger(entries: JournalEntry[]) {
    return createLedger({ chart: siiChart, entries });
  }

  return {
    createEntry(
      tenantId: string,
      input: CreateEntryInput,
    ): Effect.Effect<EntryWithLines, AppError> {
      // Validate balanced
      const totalDebits = input.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredits = input.lines.reduce((s, l) => s + l.credit, 0);
      if (totalDebits !== totalCredits) {
        return Effect.fail(UnbalancedEntryError.make(totalDebits, totalCredits));
      }

      // Parse period from date
      const [yearStr, monthStr] = input.date.split("-");
      const year = parseInt(yearStr!, 10);
      const month = parseInt(monthStr!, 10);

      // Validate all account codes exist
      return accountRepo.findAll(tenantId).pipe(
        Effect.flatMap((accounts) => {
          const codeSet = new Set(accounts.map((a) => a.code));
          for (const line of input.lines) {
            if (!codeSet.has(line.accountCode)) {
              return Effect.fail(AccountNotFoundError.make(line.accountCode));
            }
          }
          return Effect.void;
        }),
        // Check period is open
        Effect.flatMap(() => periodService.assertOpen(tenantId, year, month)),
        // Persist
        Effect.flatMap(() =>
          entryRepo.create(
            {
              tenantId,
              date: input.date,
              description: input.description,
              metadata: input.metadata ?? null,
              periodYear: year,
              periodMonth: month,
            },
            input.lines.map((l) => ({
              accountCode: l.accountCode,
              debit: String(l.debit),
              credit: String(l.credit),
            })),
          ),
        ),
      );
    },

    voidEntry(
      tenantId: string,
      entryId: string,
      reason: string,
    ): Effect.Effect<EntryWithLines, AppError> {
      return entryRepo.findById(entryId).pipe(
        Effect.flatMap((original) => {
          const year = original.periodYear;
          const month = original.periodMonth;

          return periodService.assertOpen(tenantId, year, month).pipe(
            Effect.flatMap(() => {
              // Create reverse entry
              const reversedLines = original.lines.map((l) => ({
                accountCode: l.accountCode,
                debit: l.credit,
                credit: l.debit,
              }));

              return entryRepo.create(
                {
                  tenantId,
                  date: original.date,
                  description: `ANULACION: ${reason}`,
                  metadata: { voidReason: reason, originalEntryId: original.id },
                  voidsEntry: original.id,
                  periodYear: year,
                  periodMonth: month,
                },
                reversedLines,
              );
            }),
            Effect.tap((voidEntry) =>
              entryRepo.markVoided(entryId, voidEntry.id),
            ),
          );
        }),
      );
    },

    listEntries(
      tenantId: string,
      year: number,
      month: number,
    ): Effect.Effect<EntryWithLines[], AppError> {
      return entryRepo.findByPeriod(tenantId, year, month);
    },

    getTrialBalance(
      tenantId: string,
      year: number,
      month: number,
    ): Effect.Effect<TrialBalance, AppError> {
      return loadEntries(tenantId, year, month).pipe(
        Effect.map((entries) => {
          const ledger = buildLedger(entries);
          return ledger.trialBalance({ year, month });
        }),
      );
    },

    getBalance8Columnas(
      tenantId: string,
      year: number,
      month: number,
    ): Effect.Effect<Balance8Columnas, AppError> {
      return loadEntries(tenantId, year, month).pipe(
        Effect.map((entries) => {
          const ledger = buildLedger(entries);
          return ledger.balance8Columnas({ year, month });
        }),
      );
    },

    getIncomeStatement(
      tenantId: string,
      year: number,
      month: number,
    ): Effect.Effect<IncomeStatement, AppError> {
      return loadEntries(tenantId, year, month).pipe(
        Effect.map((entries) => {
          const ledger = buildLedger(entries);
          return ledger.incomeStatement({ year, month });
        }),
      );
    },

    getBalanceSheet(
      tenantId: string,
      year: number,
      month: number,
    ): Effect.Effect<BalanceSheet, AppError> {
      return loadEntries(tenantId, year, month).pipe(
        Effect.map((entries) => {
          const ledger = buildLedger(entries);
          return ledger.balanceSheet({ year, month });
        }),
      );
    },
  };
}

export type LedgerService = ReturnType<typeof createLedgerService>;
