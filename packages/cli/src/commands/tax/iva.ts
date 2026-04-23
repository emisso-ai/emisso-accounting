/**
 * accounting tax iva — calculate IVA for a period
 */

import { Command } from "@effect/cli";
import { Effect, Option as O } from "effect";
import { calculateIva, formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { ivaColumns } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption, remanenteOption } from "../../config/options.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  remanente: remanenteOption,
  format: formatOption,
  json: jsonFlag,
};

export const taxIvaCommand = Command.make(
  "iva",
  options,
  ({ ledger, period, remanente, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });
      const fiscalPeriod = yield* resolvePeriodEffect({ period });
      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({});
      const ivaRemanenteAnterior = O.getOrUndefined(remanente);

      const result = yield* Effect.try({
        try: () => calculateIva(entries, fiscalPeriod, { ivaRemanenteAnterior }),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to calculate IVA",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows = [
        { field: "Débito Fiscal", value: formatCLP(result.debitoFiscal) },
        { field: "Crédito Fiscal", value: formatCLP(result.creditoFiscal) },
        { field: "Remanente Anterior", value: formatCLP(result.ivaRemanenteAnterior) },
        { field: "IVA Determinado", value: formatCLP(result.ivaDeterminado) },
        { field: "Remanente", value: formatCLP(result.ivaRemanente) },
      ];

      yield* renderer.render(rows, {
        columns: ivaColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Calculate IVA (VAT) for a period"));
