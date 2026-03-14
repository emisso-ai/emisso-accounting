import type { FiscalPeriod, CorreccionMonetariaResult, JournalEntry, AccountBalance } from "../types.js";
import { formatPeriod, periodDateRange } from "../period-utils.js";
import { percentage } from "../money.js";

// Revalorizacion del Capital Propio account
const REVAL_CAPITAL_CODE = "3.1.03.001";
// Correccion Monetaria gain/loss accounts
const CM_GANANCIA_CODE = "4.4.02.002";
const CM_PERDIDA_CODE = "4.5.02.002";
// Equity codes for capital propio calculation
const EQUITY_PREFIXES = ["3.1", "3.2"];
// Fixed asset codes
const FIXED_ASSET_PREFIXES = ["1.2.01", "1.2.02", "1.2.03", "1.2.04", "1.2.05", "1.2.06"];
// Depreciation codes (contra-assets)
const DEPRECIATION_PREFIXES = ["1.2.07"];

export function calculateCorreccionMonetaria(
  accountBalances: AccountBalance[],
  period: FiscalPeriod,
  ipcVariation: number, // e.g. 0.3 for 0.3%
): CorreccionMonetariaResult {
  // 1. Calculate Capital Propio Inicial (equity at start of period)
  const capitalPropioInicial = accountBalances
    .filter((ab) => EQUITY_PREFIXES.some((prefix) => ab.accountCode.startsWith(prefix)))
    .reduce((sum, ab) => sum + ab.balance, 0);

  // 2. Calculate revalorizacion
  const revalorizacion = percentage(capitalPropioInicial, ipcVariation);

  // 3. Generate adjustment entries
  const entries: JournalEntry[] = [];
  const closingDate = periodDateRange(period).to;

  if (revalorizacion !== 0) {
    // Revalorize capital propio
    // If positive IPC: Debit CM Perdida, Credit Reval Capital Propio
    // (inflation erodes capital, so it's an expense offset by equity increase)
    const lines = revalorizacion > 0
      ? [
          { accountCode: CM_PERDIDA_CODE, debit: revalorizacion, credit: 0 },
          { accountCode: REVAL_CAPITAL_CODE, debit: 0, credit: revalorizacion },
        ]
      : [
          { accountCode: REVAL_CAPITAL_CODE, debit: Math.abs(revalorizacion), credit: 0 },
          { accountCode: CM_GANANCIA_CODE, debit: 0, credit: Math.abs(revalorizacion) },
        ];

    entries.push({
      id: crypto.randomUUID(),
      date: closingDate,
      description: `Correccion Monetaria Capital Propio ${formatPeriod(period)}`,
      lines,
      metadata: { type: "correccion-monetaria", ipcVariation },
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Revalorize fixed assets (simplified — applies same IPC to all)
  for (const ab of accountBalances) {
    if (FIXED_ASSET_PREFIXES.some((prefix) => ab.accountCode.startsWith(prefix)) && ab.balance > 0) {
      const adjustment = percentage(ab.balance, ipcVariation);
      if (adjustment !== 0) {
        entries.push({
          id: crypto.randomUUID(),
          date: closingDate,
          description: `CM Activo Fijo: ${ab.accountName}`,
          lines: adjustment > 0
            ? [
                { accountCode: ab.accountCode, debit: adjustment, credit: 0 },
                { accountCode: CM_GANANCIA_CODE, debit: 0, credit: adjustment },
              ]
            : [
                { accountCode: CM_PERDIDA_CODE, debit: Math.abs(adjustment), credit: 0 },
                { accountCode: ab.accountCode, debit: 0, credit: Math.abs(adjustment) },
              ],
          metadata: { type: "correccion-monetaria", asset: ab.accountCode, ipcVariation },
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return {
    capitalPropioInicial,
    revalorizacion,
    entries,
  };
}
