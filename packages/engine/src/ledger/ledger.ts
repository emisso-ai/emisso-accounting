import type {
  JournalEntry,
  FiscalPeriod,
  AccountBalance,
  LedgerConfig,
  TrialBalance,
  Balance8Columnas,
  IncomeStatement,
  BalanceSheet,
} from "../types.js";
import type { Chart } from "../accounts/chart.js";
import { getNormalBalance } from "../accounts/chart.js";
import { createEntryBuilder, type EntryBuilder } from "./entry.js";
import { createPeriodManager, type PeriodManager } from "./period.js";
import { filterEntriesByPeriod } from "../period-utils.js";
import { generateTrialBalance } from "../reports/trial-balance.js";
import { generateBalance8Columnas } from "../reports/balance-8-columnas.js";
import { generateIncomeStatement } from "../reports/income-statement.js";
import { generateBalanceSheet } from "../reports/balance-sheet.js";

export interface Ledger {
  // Configuration
  readonly config: LedgerConfig;
  readonly chart: Chart;

  // Entry creation
  entry(description: string): EntryBuilder;

  // Bulk import (for hydration from persistence)
  importEntries(entries: JournalEntry[]): void;

  // Voiding (creates reverse entry, links via voidedBy/voidsEntry)
  void(entryId: string, reason: string): JournalEntry;

  // Balance queries
  balance(accountCode: string, options?: { from?: string; to?: string }): number;
  accountBalance(accountCode: string, options?: { from?: string; to?: string }): AccountBalance;

  // Entries
  getEntries(options?: {
    from?: string;
    to?: string;
    accountCode?: string;
  }): JournalEntry[];

  // Period management
  readonly periods: PeriodManager;

  // Serialization
  toJSON(): { config: LedgerConfig; entries: JournalEntry[] };

  // Reports
  trialBalance(period?: FiscalPeriod): TrialBalance;
  balance8Columnas(period?: FiscalPeriod): Balance8Columnas;
  incomeStatement(period?: FiscalPeriod): IncomeStatement;
  balanceSheet(period?: FiscalPeriod): BalanceSheet;
}

export function createLedger(options: {
  chart: Chart;
  config?: LedgerConfig;
  entries?: JournalEntry[];
}): Ledger {
  const config: LedgerConfig = options.config ?? { currency: "CLP" };
  const chart = options.chart;
  const entries: JournalEntry[] = [];
  const periods = createPeriodManager();

  // Import initial entries if provided
  if (options.entries) {
    entries.push(...options.entries);
  }

  function filterEntries(opts?: {
    from?: string;
    to?: string;
    accountCode?: string;
  }): JournalEntry[] {
    let filtered = entries;
    if (opts?.from) {
      filtered = filtered.filter((e) => e.date >= opts.from!);
    }
    if (opts?.to) {
      filtered = filtered.filter((e) => e.date <= opts.to!);
    }
    if (opts?.accountCode) {
      filtered = filtered.filter((e) =>
        e.lines.some((l) => l.accountCode === opts.accountCode),
      );
    }
    return filtered;
  }

  function filterByPeriod(period?: FiscalPeriod): JournalEntry[] {
    if (!period) return [...entries];
    return filterEntriesByPeriod(entries, period);
  }

  function resolvePeriod(period?: FiscalPeriod): FiscalPeriod {
    if (period) return period;
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  const ledger: Ledger = {
    config,
    chart,
    periods,

    entry(description: string): EntryBuilder {
      return createEntryBuilder(description, chart, (entry) => {
        // Check period is open
        const [yearStr, monthStr] = entry.date.split("-");
        const year = parseInt(yearStr!, 10);
        const month = parseInt(monthStr!, 10);
        if (!periods.canAddEntries(year, month)) {
          throw new Error(
            `Cannot add entries to period ${year}-${String(month).padStart(2, "0")}: period is not open`,
          );
        }
        entries.push(entry);
      });
    },

    importEntries(newEntries: JournalEntry[]): void {
      entries.push(...newEntries);
    },

    void(entryId: string, reason: string): JournalEntry {
      const original = entries.find((e) => e.id === entryId);
      if (!original) throw new Error(`Entry not found: ${entryId}`);
      if (original.voidedBy) throw new Error(`Entry already voided: ${entryId}`);

      // Create reverse entry
      const reversedLines = original.lines.map((line) => ({
        accountCode: line.accountCode,
        debit: line.credit,
        credit: line.debit,
      }));

      const voidEntry: JournalEntry = {
        id: crypto.randomUUID(),
        date: original.date,
        description: `ANULACION: ${reason}`,
        lines: reversedLines,
        voidsEntry: original.id,
        metadata: { voidReason: reason, originalEntryId: original.id },
        createdAt: new Date().toISOString(),
      };

      // Mark original as voided (immutable update)
      const idx = entries.indexOf(original);
      entries[idx] = { ...original, voidedBy: voidEntry.id };

      entries.push(voidEntry);
      return voidEntry;
    },

    balance(
      accountCode: string,
      options?: { from?: string; to?: string },
    ): number {
      const relevantEntries = filterEntries({ ...options, accountCode });
      const balances = getAccountBalancesFromEntries(chart, relevantEntries);
      const found = balances.find((b) => b.accountCode === accountCode);
      return found?.balance ?? 0;
    },

    accountBalance(
      accountCode: string,
      options?: { from?: string; to?: string },
    ): AccountBalance {
      const relevantEntries = filterEntries(options);
      const balances = getAccountBalancesFromEntries(chart, relevantEntries);
      const found = balances.find((b) => b.accountCode === accountCode);
      if (found) return found;
      const account = chart.getAccount(accountCode);
      if (!account) throw new Error(`Account not found: ${accountCode}`);
      return { accountCode, accountName: account.name, debit: 0, credit: 0, balance: 0 };
    },

    getEntries(options?: {
      from?: string;
      to?: string;
      accountCode?: string;
    }): JournalEntry[] {
      return filterEntries(options);
    },

    toJSON() {
      return { config, entries: [...entries] };
    },

    trialBalance(period?: FiscalPeriod): TrialBalance {
      const resolved = resolvePeriod(period);
      const relevant = filterByPeriod(resolved);
      return generateTrialBalance(chart, relevant, resolved);
    },

    balance8Columnas(period?: FiscalPeriod): Balance8Columnas {
      const resolved = resolvePeriod(period);
      const relevant = filterByPeriod(resolved);
      return generateBalance8Columnas(chart, relevant, resolved);
    },

    incomeStatement(period?: FiscalPeriod): IncomeStatement {
      const resolved = resolvePeriod(period);
      const relevant = filterByPeriod(resolved);
      return generateIncomeStatement(chart, relevant, resolved);
    },

    balanceSheet(period?: FiscalPeriod): BalanceSheet {
      const resolved = resolvePeriod(period);
      const relevant = filterByPeriod(resolved);
      return generateBalanceSheet(chart, relevant, resolved);
    },
  };

  return ledger;
}

// Expose helper for report modules — single-pass aggregation
export function getAccountBalancesFromEntries(
  chart: Chart,
  entries: JournalEntry[],
): AccountBalance[] {
  const map = new Map<string, { debit: number; credit: number }>();

  for (const entry of entries) {
    for (const line of entry.lines) {
      const existing = map.get(line.accountCode);
      if (existing) {
        existing.debit += line.debit;
        existing.credit += line.credit;
      } else {
        map.set(line.accountCode, { debit: line.debit, credit: line.credit });
      }
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, { debit, credit }]) => {
      const account = chart.getAccount(code);
      if (!account) throw new Error(`Account not found: ${code}`);
      const normal = getNormalBalance(account.type);
      const balance = normal === "debit" ? debit - credit : credit - debit;
      return { accountCode: code, accountName: account.name, debit, credit, balance };
    });
}
