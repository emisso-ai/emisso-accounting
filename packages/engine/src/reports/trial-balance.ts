import type { JournalEntry, FiscalPeriod, TrialBalance } from "../types.js";
import type { Chart } from "../accounts/chart.js";
import { getAccountBalancesFromEntries } from "../ledger/ledger.js";

export function generateTrialBalance(
  chart: Chart,
  entries: JournalEntry[],
  period: FiscalPeriod,
): TrialBalance {
  const accounts = getAccountBalancesFromEntries(chart, entries);
  const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);

  return {
    period,
    accounts,
    totalDebits,
    totalCredits,
    isBalanced: totalDebits === totalCredits,
  };
}
