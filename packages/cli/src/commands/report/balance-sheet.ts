/**
 * accounting report balance-sheet — generate balance sheet for a period
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import { generateBalanceSheet, formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { balanceSheetColumns } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption } from "../../config/options.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  format: formatOption,
  json: jsonFlag,
};

export const reportBalanceSheetCommand = Command.make(
  "balance-sheet",
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
        try: () => generateBalanceSheet(l.chart, entries, fiscalPeriod),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate balance sheet",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows: Array<{ concept: string; amount: string }> = [];

      rows.push({ concept: "── Activos ──", amount: "" });
      for (const a of result.assets?.current ?? []) {
        rows.push({ concept: `  ${a.accountName}`, amount: formatCLP(a.balance) });
      }
      for (const a of result.assets?.fixed ?? []) {
        rows.push({ concept: `  ${a.accountName}`, amount: formatCLP(a.balance) });
      }
      rows.push({ concept: "Total Activos", amount: formatCLP(result.assets?.total ?? 0) });

      rows.push({ concept: "── Pasivos ──", amount: "" });
      for (const a of result.liabilities?.current ?? []) {
        rows.push({ concept: `  ${a.accountName}`, amount: formatCLP(a.balance) });
      }
      for (const a of result.liabilities?.longTerm ?? []) {
        rows.push({ concept: `  ${a.accountName}`, amount: formatCLP(a.balance) });
      }
      rows.push({ concept: "Total Pasivos", amount: formatCLP(result.liabilities?.total ?? 0) });

      rows.push({ concept: "── Patrimonio ──", amount: "" });
      for (const a of result.equity?.accounts ?? []) {
        rows.push({ concept: `  ${a.accountName}`, amount: formatCLP(a.balance) });
      }
      rows.push({ concept: "Total Patrimonio", amount: formatCLP(result.equity?.total ?? 0) });

      yield* renderer.render(rows, {
        columns: balanceSheetColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Generate balance sheet (Balance General)"));
