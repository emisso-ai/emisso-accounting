/**
 * accounting report income-statement — generate income statement for a period
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import { generateIncomeStatement, formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { incomeStatementColumns } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption } from "../../config/options.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  format: formatOption,
  json: jsonFlag,
};

export const reportIncomeStatementCommand = Command.make(
  "income-statement",
  options,
  ({ ledger, period, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });
      const fiscalPeriod = yield* resolvePeriodEffect({ period });
      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({});
      const result = yield* Effect.try({
        try: () => generateIncomeStatement(l.chart, entries, fiscalPeriod),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate income statement",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows: Array<{ concept: string; amount: string }> = [];

      rows.push({ concept: "── Ingresos ──", amount: "" });
      for (const a of result.revenue?.accounts ?? []) {
        rows.push({ concept: `  ${a.accountName}`, amount: formatCLP(a.balance) });
      }
      rows.push({ concept: "Total Ingresos", amount: formatCLP(result.revenue?.total ?? 0) });

      rows.push({ concept: "── Costo de Ventas ──", amount: "" });
      rows.push({ concept: "Total Costo de Ventas", amount: formatCLP(result.costOfSales?.total ?? 0) });

      rows.push({ concept: "Utilidad Bruta", amount: formatCLP(result.grossProfit ?? 0) });

      rows.push({ concept: "── Gastos Operacionales ──", amount: "" });
      for (const a of result.operatingExpenses?.accounts ?? []) {
        rows.push({ concept: `  ${a.accountName}`, amount: formatCLP(a.balance) });
      }
      rows.push({ concept: "Total Gastos Operacionales", amount: formatCLP(result.operatingExpenses?.total ?? 0) });

      rows.push({ concept: "Resultado Operacional", amount: formatCLP(result.operatingIncome ?? 0) });
      rows.push({ concept: "Resultado Neto", amount: formatCLP(result.netIncome ?? 0) });

      yield* renderer.render(rows, {
        columns: incomeStatementColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Generate income statement (Estado de Resultados)"));
