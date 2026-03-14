import type {
  JournalEntry,
  FiscalPeriod,
  AccountBalance,
  IncomeStatement,
} from "../types.js";
import type { Chart } from "../accounts/chart.js";
import { getAccountBalancesFromEntries } from "../ledger/ledger.js";

/**
 * Generates an income statement (Estado de Resultados) grouped by SII classification code prefix.
 *
 * SII classification prefixes:
 * - 4.1 → Ingresos de Explotacion (revenue)
 * - 4.2 → Costos de Explotacion (cost of sales)
 * - 4.3 → Gastos de Administracion y Ventas (operating expenses)
 * - 4.4 → Ingresos Fuera de Explotacion (other income)
 * - 4.5 → Egresos Fuera de Explotacion (other expenses)
 * - 4.6 → Impuesto a la Renta (income tax)
 */
export function generateIncomeStatement(
  chart: Chart,
  entries: JournalEntry[],
  period: FiscalPeriod,
): IncomeStatement {
  const balances = getAccountBalancesFromEntries(chart, entries);

  const revenueAccounts: AccountBalance[] = [];
  const costOfSalesAccounts: AccountBalance[] = [];
  const operatingExpenseAccounts: AccountBalance[] = [];
  const otherIncomeAccounts: AccountBalance[] = [];
  const otherExpenseAccounts: AccountBalance[] = [];
  const incomeTaxAccounts: AccountBalance[] = [];

  for (const ab of balances) {
    if (ab.accountCode.startsWith("4.1")) {
      revenueAccounts.push(ab);
    } else if (ab.accountCode.startsWith("4.2")) {
      costOfSalesAccounts.push(ab);
    } else if (ab.accountCode.startsWith("4.3")) {
      operatingExpenseAccounts.push(ab);
    } else if (ab.accountCode.startsWith("4.4")) {
      otherIncomeAccounts.push(ab);
    } else if (ab.accountCode.startsWith("4.5")) {
      otherExpenseAccounts.push(ab);
    } else if (ab.accountCode.startsWith("4.6")) {
      incomeTaxAccounts.push(ab);
    }
  }

  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCostOfSales = costOfSalesAccounts.reduce((sum, a) => sum + a.balance, 0);
  const grossProfit = totalRevenue - totalCostOfSales;

  const totalOperatingExpenses = operatingExpenseAccounts.reduce(
    (sum, a) => sum + a.balance,
    0,
  );
  const operatingIncome = grossProfit - totalOperatingExpenses;

  const totalOtherIncome = otherIncomeAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalOtherExpenses = otherExpenseAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalIncomeTax = incomeTaxAccounts.reduce((sum, a) => sum + a.balance, 0);

  const netIncome =
    operatingIncome + totalOtherIncome - totalOtherExpenses - totalIncomeTax;

  return {
    period,
    revenue: { accounts: revenueAccounts, total: totalRevenue },
    costOfSales: { accounts: costOfSalesAccounts, total: totalCostOfSales },
    grossProfit,
    operatingExpenses: {
      accounts: operatingExpenseAccounts,
      total: totalOperatingExpenses,
    },
    operatingIncome,
    otherIncome: { accounts: otherIncomeAccounts, total: totalOtherIncome },
    otherExpenses: { accounts: otherExpenseAccounts, total: totalOtherExpenses },
    incomeTax: { accounts: incomeTaxAccounts, total: totalIncomeTax },
    netIncome,
  };
}
