/**
 * accounting entry show <id> — show entry detail with lines
 */

import { Command, Args } from "@effect/cli";
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
import { loadLedgerEffect } from "../../config/ledger-io.js";

const idArg = Args.text({ name: "id" }).pipe(
  Args.withDescription("Entry ID (full or prefix)"),
);

const options = { ledger: ledgerOption, format: formatOption, json: jsonFlag };

export const entryShowCommand = Command.make(
  "show",
  { args: idArg, ...options },
  ({ args: id, ledger, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({});
      const entry = entries.find((e) => e.id === id || e.id.startsWith(id));

      if (!entry) {
        return yield* Effect.fail(new CliError({
          kind: "not-found",
          message: `Entry not found: ${id}`,
        }));
      }

      const rows = formatEntryLines(entry.lines, l.chart);

      yield* renderer.render(rows, {
        columns: entryLineColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Show journal entry detail with all lines"));
