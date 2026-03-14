import type {
  JournalEntry,
  FiscalPeriod,
  AccountBalance,
  BalanceSheet,
} from "../types.js";
import type { Chart } from "../accounts/chart.js";
import { getAccountBalancesFromEntries } from "../ledger/ledger.js";

/**
 * Generates a balance sheet (Balance General) grouped by SII classification code prefix.
 *
 * SII classification prefixes:
 * - 1.1 → Activo Circulante (current assets)
 * - 1.2 → Activo Fijo (fixed assets)
 * - 1.3 → Otros Activos (other assets)
 * - 2.1 → Pasivo Circulante (current liabilities)
 * - 2.2 → Pasivo Largo Plazo (long-term liabilities)
 * - 3.x → Patrimonio (equity)
 */
export function generateBalanceSheet(
  chart: Chart,
  entries: JournalEntry[],
  period: FiscalPeriod,
): BalanceSheet {
  const balances = getAccountBalancesFromEntries(chart, entries);

  const currentAssets: AccountBalance[] = [];
  const fixedAssets: AccountBalance[] = [];
  const otherAssets: AccountBalance[] = [];
  const currentLiabilities: AccountBalance[] = [];
  const longTermLiabilities: AccountBalance[] = [];
  const equityAccounts: AccountBalance[] = [];

  for (const ab of balances) {
    if (ab.accountCode.startsWith("1.1")) {
      currentAssets.push(ab);
    } else if (ab.accountCode.startsWith("1.2")) {
      fixedAssets.push(ab);
    } else if (ab.accountCode.startsWith("1.3")) {
      otherAssets.push(ab);
    } else if (ab.accountCode.startsWith("2.1")) {
      currentLiabilities.push(ab);
    } else if (ab.accountCode.startsWith("2.2")) {
      longTermLiabilities.push(ab);
    } else if (ab.accountCode.startsWith("3.")) {
      equityAccounts.push(ab);
    }
  }

  const totalAssets =
    currentAssets.reduce((sum, a) => sum + a.balance, 0) +
    fixedAssets.reduce((sum, a) => sum + a.balance, 0) +
    otherAssets.reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities =
    currentLiabilities.reduce((sum, a) => sum + a.balance, 0) +
    longTermLiabilities.reduce((sum, a) => sum + a.balance, 0);

  const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);

  return {
    period,
    assets: {
      current: currentAssets,
      fixed: fixedAssets,
      other: otherAssets,
      total: totalAssets,
    },
    liabilities: {
      current: currentLiabilities,
      longTerm: longTermLiabilities,
      total: totalLiabilities,
    },
    equity: {
      accounts: equityAccounts,
      total: totalEquity,
    },
    isBalanced: totalAssets === totalLiabilities + totalEquity,
  };
}
