/**
 * accounting import invoice — generate journal entry from invoice data
 */

import { readFileSync } from "node:fs";
import { Command } from "@effect/cli";
import { Effect } from "effect";
import { fromInvoice, type InvoiceInput } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
  inputFileOption,
} from "@emisso/cli-core";
import { entryLineColumns, formatEntryLines } from "../../formatters/accounting-table.js";
import { ledgerOption } from "../../config/options.js";
import { resolveLedgerPathEffect } from "../../config/resolve.js";
import { loadLedgerEffect, saveLedgerEffect } from "../../config/ledger-io.js";

const options = {
  ledger: ledgerOption,
  input: inputFileOption,
  format: formatOption,
  json: jsonFlag,
};

export const importInvoiceCommand = Command.make(
  "invoice",
  options,
  ({ ledger, input, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const invoiceData = yield* Effect.try({
        try: () => JSON.parse(readFileSync(input, "utf-8")) as InvoiceInput,
        catch: (error) => new CliError({
          kind: "bad-args",
          message: `Failed to read invoice file: ${input}`,
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const template = yield* Effect.try({
        try: () => fromInvoice(invoiceData),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to generate entry from invoice",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const l = yield* loadLedgerEffect(ledgerPath);

      const entry = yield* Effect.try({
        try: () => {
          const builder = l.entry(template.description).date(invoiceData.date);
          for (const line of template.lines) {
            if (line.debit > 0) builder.debit(line.accountCode, line.debit);
            if (line.credit > 0) builder.credit(line.accountCode, line.credit);
          }
          builder.meta(template.metadata);
          return builder.commit();
        },
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to commit entry",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      yield* saveLedgerEffect(ledgerPath, l);

      const rows = formatEntryLines(entry.lines, l.chart);

      yield* renderer.render(rows, {
        columns: entryLineColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Import an invoice as a journal entry (venta or compra)"));
