/**
 * accounting entry add — create journal entry from JSON file
 */

import { readFileSync } from "node:fs";
import { Command } from "@effect/cli";
import { Effect } from "effect";
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

interface EntryInput {
  date: string;
  description: string;
  lines: Array<{ accountCode: string; debit: number; credit: number }>;
  metadata?: Record<string, unknown>;
}

export const entryAddCommand = Command.make(
  "add",
  options,
  ({ ledger, input, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const entryData = yield* Effect.try({
        try: () => {
          const raw = readFileSync(input, "utf-8");
          return JSON.parse(raw) as EntryInput;
        },
        catch: (error) => new CliError({
          kind: "bad-args",
          message: `Failed to read entry file: ${input}`,
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const l = yield* loadLedgerEffect(ledgerPath);

      const entry = yield* Effect.try({
        try: () => {
          const builder = l.entry(entryData.description).date(entryData.date);
          for (const line of entryData.lines) {
            if (line.debit > 0) builder.debit(line.accountCode, line.debit);
            if (line.credit > 0) builder.credit(line.accountCode, line.credit);
          }
          if (entryData.metadata) builder.meta(entryData.metadata);
          return builder.commit();
        },
        catch: (error) => new CliError({
          kind: "validation",
          message: "Failed to create entry",
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
).pipe(Command.withDescription("Create a journal entry from a JSON file"));
