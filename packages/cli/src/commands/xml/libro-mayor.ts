/**
 * accounting xml libro-mayor — generate Libro Mayor XML for SII
 */

import { Command } from "@effect/cli";
import { Effect, Option as O } from "effect";
import { generateLibroMayorXml } from "@emisso/accounting";
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

export const xmlLibroMayorCommand = Command.make(
  "libro-mayor",
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
      const xml = yield* Effect.try({
        try: () => generateLibroMayorXml(l.chart, entries, {
          rut: company.rut,
          razonSocial: company.razonSocial,
          period: fiscalPeriod,
        }),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate Libro Mayor XML",
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
).pipe(Command.withDescription("Generate Libro Mayor XML for SII"));
