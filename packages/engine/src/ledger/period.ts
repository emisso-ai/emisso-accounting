import type { JournalEntry, PeriodStatus, AccountBalance } from "../types.js";
import type { Chart } from "../accounts/chart.js";

export interface Period {
  year: number;
  month: number;
  status: PeriodStatus;
  closedAt?: string;
  lockedAt?: string;
}

export interface PeriodManager {
  getPeriod(year: number, month: number): Period;
  openPeriod(year: number, month: number): Period;
  closePeriod(year: number, month: number): Period;
  lockPeriod(year: number, month: number): Period;
  reopenPeriod(year: number, month: number): Period;
  canAddEntries(year: number, month: number): boolean;
  generateClosingEntries(
    year: number,
    month: number,
    accountBalances: AccountBalance[],
    chart: Chart,
    retainedEarningsCode: string,
  ): JournalEntry[];
}

export function createPeriodManager(): PeriodManager {
  const periods = new Map<string, Period>();

  function key(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  function getOrCreate(year: number, month: number): Period {
    const k = key(year, month);
    if (!periods.has(k)) {
      periods.set(k, { year, month, status: "open" });
    }
    return periods.get(k)!;
  }

  return {
    getPeriod(year: number, month: number): Period {
      return getOrCreate(year, month);
    },

    openPeriod(year: number, month: number): Period {
      const period = getOrCreate(year, month);
      period.status = "open";
      period.closedAt = undefined;
      return period;
    },

    closePeriod(year: number, month: number): Period {
      const period = getOrCreate(year, month);
      if (period.status === "locked") {
        throw new Error(`Period ${key(year, month)} is locked and cannot be closed`);
      }
      period.status = "closed";
      period.closedAt = new Date().toISOString();
      return period;
    },

    lockPeriod(year: number, month: number): Period {
      const period = getOrCreate(year, month);
      if (period.status === "open") {
        throw new Error(`Period ${key(year, month)} must be closed before locking`);
      }
      period.status = "locked";
      period.lockedAt = new Date().toISOString();
      return period;
    },

    reopenPeriod(year: number, month: number): Period {
      const period = getOrCreate(year, month);
      if (period.status === "locked") {
        throw new Error(`Period ${key(year, month)} is locked and cannot be reopened`);
      }
      period.status = "open";
      period.closedAt = undefined;
      return period;
    },

    canAddEntries(year: number, month: number): boolean {
      return getOrCreate(year, month).status === "open";
    },

    generateClosingEntries(
      year: number,
      month: number,
      accountBalances: AccountBalance[],
      chart: Chart,
      retainedEarningsCode: string,
    ): JournalEntry[] {
      // Only close revenue and expense accounts (temporary accounts)
      const revenueBalances = accountBalances.filter((ab) => {
        const acct = chart.getAccount(ab.accountCode);
        return acct?.type === "revenue" && ab.balance !== 0;
      });

      const expenseBalances = accountBalances.filter((ab) => {
        const acct = chart.getAccount(ab.accountCode);
        return acct?.type === "expense" && ab.balance !== 0;
      });

      const entries: JournalEntry[] = [];
      const lastDay = new Date(year, month, 0).getDate();
      const closingDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      // Close revenue accounts (debit revenue, credit retained earnings)
      if (revenueBalances.length > 0) {
        const lines: Array<{ accountCode: string; debit: number; credit: number }> = [];
        let totalRevenue = 0;

        for (const ab of revenueBalances) {
          // Revenue has credit normal balance, so balance is positive when credit > debit
          // To close: debit the revenue account by its balance
          lines.push({ accountCode: ab.accountCode, debit: Math.abs(ab.balance), credit: 0 });
          totalRevenue += Math.abs(ab.balance);
        }

        lines.push({ accountCode: retainedEarningsCode, debit: 0, credit: totalRevenue });

        entries.push({
          id: crypto.randomUUID(),
          date: closingDate,
          description: `Cierre de ingresos periodo ${key(year, month)}`,
          lines,
          metadata: { type: "closing", period: { year, month } },
          createdAt: new Date().toISOString(),
        });
      }

      // Close expense accounts (credit expense, debit retained earnings)
      if (expenseBalances.length > 0) {
        const lines: Array<{ accountCode: string; debit: number; credit: number }> = [];
        let totalExpenses = 0;

        for (const ab of expenseBalances) {
          // Expense has debit normal balance, so balance is positive when debit > credit
          // To close: credit the expense account by its balance
          lines.push({ accountCode: ab.accountCode, debit: 0, credit: Math.abs(ab.balance) });
          totalExpenses += Math.abs(ab.balance);
        }

        lines.push({ accountCode: retainedEarningsCode, debit: totalExpenses, credit: 0 });

        entries.push({
          id: crypto.randomUUID(),
          date: closingDate,
          description: `Cierre de gastos periodo ${key(year, month)}`,
          lines,
          metadata: { type: "closing", period: { year, month } },
          createdAt: new Date().toISOString(),
        });
      }

      return entries;
    },
  };
}
