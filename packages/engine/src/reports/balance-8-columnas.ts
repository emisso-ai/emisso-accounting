import type {
  JournalEntry,
  FiscalPeriod,
  Balance8Columnas,
  Balance8ColumnasRow,
} from "../types.js";
import type { Chart } from "../accounts/chart.js";
import { getAccountBalancesFromEntries } from "../ledger/ledger.js";

export function generateBalance8Columnas(
  chart: Chart,
  entries: JournalEntry[],
  period: FiscalPeriod,
): Balance8Columnas {
  const balances = getAccountBalancesFromEntries(chart, entries);

  const rows: Balance8ColumnasRow[] = balances.map((ab) => {
    const account = chart.getAccount(ab.accountCode)!;

    // Saldo deudor/acreedor based on net movement
    const netMovement = ab.debit - ab.credit;
    const debitBalance = netMovement > 0 ? netMovement : 0;
    const creditBalance = netMovement < 0 ? -netMovement : 0;

    // Classification into 4 final columns
    // Handles abnormal balances: e.g. asset with credit balance goes to pasivo
    let activo = 0;
    let pasivo = 0;
    let perdida = 0;
    let ganancia = 0;

    if (account.type === "asset") {
      if (debitBalance > 0) activo = debitBalance;
      else if (creditBalance > 0) pasivo = creditBalance;
    } else if (account.type === "liability" || account.type === "equity") {
      if (creditBalance > 0) pasivo = creditBalance;
      else if (debitBalance > 0) activo = debitBalance;
    } else if (account.type === "expense") {
      if (debitBalance > 0) perdida = debitBalance;
      else if (creditBalance > 0) ganancia = creditBalance;
    } else if (account.type === "revenue") {
      if (creditBalance > 0) ganancia = creditBalance;
      else if (debitBalance > 0) perdida = debitBalance;
    }

    return {
      accountCode: ab.accountCode,
      accountName: ab.accountName,
      debitMovement: ab.debit,
      creditMovement: ab.credit,
      debitBalance,
      creditBalance,
      activo,
      pasivo,
      perdida,
      ganancia,
    };
  });

  const totals = rows.reduce(
    (t, r) => ({
      debitMovement: t.debitMovement + r.debitMovement,
      creditMovement: t.creditMovement + r.creditMovement,
      debitBalance: t.debitBalance + r.debitBalance,
      creditBalance: t.creditBalance + r.creditBalance,
      activo: t.activo + r.activo,
      pasivo: t.pasivo + r.pasivo,
      perdida: t.perdida + r.perdida,
      ganancia: t.ganancia + r.ganancia,
    }),
    {
      debitMovement: 0,
      creditMovement: 0,
      debitBalance: 0,
      creditBalance: 0,
      activo: 0,
      pasivo: 0,
      perdida: 0,
      ganancia: 0,
    },
  );

  return { period, rows, totals };
}
