/**
 * accounting report balance-8 — generate Balance de 8 Columnas for a period
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import { generateBalance8Columnas, formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { balance8Columns } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption } from "../../config/options.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  format: formatOption,
  json: jsonFlag,
};

export const reportBalance8Command = Command.make(
  "balance-8",
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
        try: () => generateBalance8Columnas(l.chart, entries, fiscalPeriod),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate balance de 8 columnas",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows = result.rows.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        debitMovement: row.debitMovement > 0 ? formatCLP(row.debitMovement) : "",
        creditMovement: row.creditMovement > 0 ? formatCLP(row.creditMovement) : "",
        debitBalance: row.debitBalance > 0 ? formatCLP(row.debitBalance) : "",
        creditBalance: row.creditBalance > 0 ? formatCLP(row.creditBalance) : "",
        activo: row.activo > 0 ? formatCLP(row.activo) : "",
        pasivo: row.pasivo > 0 ? formatCLP(row.pasivo) : "",
        perdida: row.perdida > 0 ? formatCLP(row.perdida) : "",
        ganancia: row.ganancia > 0 ? formatCLP(row.ganancia) : "",
      }));

      yield* renderer.render(rows, {
        columns: balance8Columns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Generate Balance de 8 Columnas report"));
