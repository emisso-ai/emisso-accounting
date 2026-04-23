/**
 * accounting tax ppm — calculate PPM for a period
 */

import { Command, Options } from "@effect/cli";
import { Effect, Option as O } from "effect";
import { calculatePpm, formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { keyValueColumns } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect, resolveRegimeEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption, regimeOption } from "../../config/options.js";

const rateOption = Options.text("rate").pipe(
  Options.optional,
  Options.withDescription("Custom PPM rate (e.g. 0.025 for 2.5%)"),
);

const options = {
  ledger: ledgerOption,
  period: periodOption,
  regime: regimeOption,
  rate: rateOption,
  format: formatOption,
  json: jsonFlag,
};

export const taxPpmCommand = Command.make(
  "ppm",
  options,
  ({ ledger, period, regime, rate, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });
      const fiscalPeriod = yield* resolvePeriodEffect({ period });
      const resolvedRegime = yield* resolveRegimeEffect({ regime });
      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({});
      const customRate = O.getOrUndefined(O.map(rate, (v) => parseFloat(v)));

      const result = yield* Effect.try({
        try: () => calculatePpm(entries, fiscalPeriod, {
          regime: resolvedRegime,
          rate: customRate,
        }),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to calculate PPM",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows = [
        { field: "Base Imponible", value: formatCLP(result.baseImponible) },
        { field: "Tasa", value: `${(result.rate * 100).toFixed(2)}%` },
        { field: "PPM a Pagar", value: formatCLP(result.ppmAmount) },
      ];

      yield* renderer.render(rows, {
        columns: keyValueColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Calculate PPM (Pago Provisional Mensual) for a period"));
