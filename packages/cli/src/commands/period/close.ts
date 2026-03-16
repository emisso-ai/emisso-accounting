/**
 * accounting period close — close a period (prevents new entries)
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

export const periodCloseCommand = Command.make(
  "close",
  options,
  ({ ledger, period, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });
      const fiscalPeriod = yield* resolvePeriodEffect({ period });

      const l = yield* loadLedgerEffect(ledgerPath);

      const result = yield* Effect.try({
        try: () => l.periods.closePeriod(fiscalPeriod.year, fiscalPeriod.month),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to close period",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      yield* saveLedgerEffect(ledgerPath, l);

      yield* renderer.render(
        [
          { field: "Period", value: formatPeriod(fiscalPeriod) },
          { field: "Status", value: result.status },
          { field: "Closed At", value: result.closedAt ?? "" },
        ],
        { columns: keyValueColumns, ttyDefault: "table" },
        { format: resolvedFormat },
      );
    }),
).pipe(Command.withDescription("Close an accounting period"));
