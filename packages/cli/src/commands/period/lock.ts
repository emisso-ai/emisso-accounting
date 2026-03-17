/**
 * accounting period lock — lock a period permanently (no reopening)
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import { formatPeriod } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { keyValueColumns } from "../../formatters/accounting-table.js";
import { ledgerOption, periodOption } from "../../config/options.js";
import { resolveLedgerPathEffect, resolvePeriodEffect } from "../../config/resolve.js";
import { loadLedgerEffect, saveLedgerEffect } from "../../config/ledger-io.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  format: formatOption,
  json: jsonFlag,
};

export const periodLockCommand = Command.make(
  "lock",
  options,
  ({ ledger, period, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });
      const fiscalPeriod = yield* resolvePeriodEffect({ period });

      const l = yield* loadLedgerEffect(ledgerPath);

      const result = yield* Effect.try({
        try: () => l.periods.lockPeriod(fiscalPeriod.year, fiscalPeriod.month),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to lock period",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      yield* saveLedgerEffect(ledgerPath, l);

      yield* renderer.render(
        [
          { field: "Period", value: formatPeriod(fiscalPeriod) },
          { field: "Status", value: result.status },
          { field: "Locked At", value: result.lockedAt ?? "" },
        ],
        { columns: keyValueColumns, ttyDefault: "table" },
        { format: resolvedFormat },
      );
    }),
).pipe(Command.withDescription("Lock an accounting period permanently"));
