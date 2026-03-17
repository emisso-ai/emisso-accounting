/**
 * accounting xml balance — generate Balance XML (8 columnas) for SII
 */

import { Command } from "@effect/cli";
import { Effect, Option as O } from "effect";
import {
  generateBalance8Columnas,
  generateBalanceXml,
} from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
  outputFileOption,
} from "@emisso/cli-core";
import { keyValueColumns, writeXmlOutput } from "../../formatters/accounting-table.js";
import { resolveLedgerPathEffect, resolvePeriodEffect, resolveCompanyEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";
import { ledgerOption, periodOption, rutOption, razonSocialOption } from "../../config/options.js";

const options = {
  ledger: ledgerOption,
  period: periodOption,
  rut: rutOption,
  razonSocial: razonSocialOption,
  output: outputFileOption,
  format: formatOption,
  json: jsonFlag,
};

export const xmlBalanceCommand = Command.make(
  "balance",
  options,
  ({ ledger, period, rut, razonSocial, output, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });
      const fiscalPeriod = yield* resolvePeriodEffect({ period });
      const company = yield* resolveCompanyEffect({ rut, razonSocial });
      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({});

      const balanceData = yield* Effect.try({
        try: () => generateBalance8Columnas(l.chart, entries, fiscalPeriod),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate balance data",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const xml = yield* Effect.try({
        try: () => generateBalanceXml(balanceData, {
          rut: company.rut,
          razonSocial: company.razonSocial,
          period: fiscalPeriod,
        }),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate Balance XML",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      yield* writeXmlOutput(xml, output);

      if (O.isSome(output)) {
        yield* renderer.render(
          [{ field: "Output", value: output.value }, { field: "Size", value: `${xml.length} bytes` }],
          { columns: keyValueColumns, ttyDefault: "table" },
          { format: resolvedFormat },
        );
      }
    }),
).pipe(Command.withDescription("Generate Balance (8 columnas) XML for SII"));
