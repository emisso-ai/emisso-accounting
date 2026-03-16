/**
 * accounting tax f29 — prepare F29 tax form data for a period
 */

import { Command } from "@effect/cli";
import { Effect, Option as O } from "effect";
import { prepareF29, formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { f29Columns } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect, resolveRegimeEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption, regimeOption, remanenteOption } from "../../config/options.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  regime: regimeOption,
  remanente: remanenteOption,
  format: formatOption,
  json: jsonFlag,
};

export const taxF29Command = Command.make(
  "f29",
  options,
  ({ ledger, period, regime, remanente, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });
      const fiscalPeriod = yield* resolvePeriodEffect({ period });
      const resolvedRegime = yield* resolveRegimeEffect({ regime });
      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({});
      const ivaRemanenteAnterior = O.getOrUndefined(remanente);

      const result = yield* Effect.try({
        try: () => prepareF29(entries, fiscalPeriod, {
          regime: resolvedRegime,
          ivaRemanenteAnterior,
        }),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to prepare F29",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows = Object.entries(result.fields).map(([code, value]) => ({
        field: code,
        value: formatCLP(value),
      }));

      yield* renderer.render(rows, {
        columns: f29Columns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Prepare F29 tax form data (IVA + PPM)"));
