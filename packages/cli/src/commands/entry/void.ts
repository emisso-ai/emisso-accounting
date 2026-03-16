/**
 * accounting entry void <id> — void a journal entry
 */

import { Command, Args, Options } from "@effect/cli";
import { Effect } from "effect";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { entryLineColumns, formatEntryLines } from "../../formatters/accounting-table.js";
import { ledgerOption } from "../../config/options.js";
import { resolveLedgerPathEffect } from "../../config/resolve.js";
import { loadLedgerEffect, saveLedgerEffect } from "../../config/ledger-io.js";

const idArg = Args.text({ name: "id" }).pipe(
  Args.withDescription("Entry ID to void"),
);

const reasonOption = Options.text("reason").pipe(
  Options.withDescription("Reason for voiding"),
);

const options = {
  ledger: ledgerOption,
  reason: reasonOption,
  format: formatOption,
  json: jsonFlag,
};

export const entryVoidCommand = Command.make(
  "void",
  { args: idArg, ...options },
  ({ args: id, ledger, reason, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const l = yield* loadLedgerEffect(ledgerPath);

      const reversal = yield* Effect.try({
        try: () => l.void(id, reason),
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to void entry",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      yield* saveLedgerEffect(ledgerPath, l);

      const rows = formatEntryLines(reversal.lines, l.chart);

      yield* renderer.render(rows, {
        columns: entryLineColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Void a journal entry (creates a reversing entry)"));
