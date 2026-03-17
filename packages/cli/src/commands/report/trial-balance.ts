/**
 * accounting report trial-balance — generate trial balance for a period
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import { generateTrialBalance, formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { trialBalanceColumns } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption } from "../../config/options.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  format: formatOption,
  json: jsonFlag,
};

export const reportTrialBalanceCommand = Command.make(
  "trial-balance",
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
        try: () => generateTrialBalance(l.chart, entries, fiscalPeriod),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate trial balance",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows = result.accounts.map((row) => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        debit: row.debit > 0 ? formatCLP(row.debit) : "",
        credit: row.credit > 0 ? formatCLP(row.credit) : "",
      }));

      yield* renderer.render(rows, {
        columns: trialBalanceColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Generate trial balance report for a period"));
