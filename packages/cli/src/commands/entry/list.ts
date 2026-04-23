/**
 * accounting entry list — list journal entries
 */

import { Command, Options } from "@effect/cli";
import { Effect, Option as O } from "effect";
import { formatCLP } from "@emisso/accounting";
import {
  OutputRenderer,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { entryColumns } from "../../formatters/accounting-table.js";
import { ledgerOption } from "../../config/options.js";
import { resolveLedgerPathEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";

const fromOption = Options.text("from").pipe(
  Options.optional,
  Options.withDescription("Start date filter (YYYY-MM-DD)"),
);

const toOption = Options.text("to").pipe(
  Options.optional,
  Options.withDescription("End date filter (YYYY-MM-DD)"),
);

const accountOption = Options.text("account").pipe(
  Options.optional,
  Options.withDescription("Filter by account code"),
);

const options = {
  ledger: ledgerOption,
  from: fromOption,
  to: toOption,
  account: accountOption,
  format: formatOption,
  json: jsonFlag,
};

export const entryListCommand = Command.make(
  "list",
  options,
  ({ ledger, from, to, account, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({
        from: O.getOrUndefined(from),
        to: O.getOrUndefined(to),
        accountCode: O.getOrUndefined(account),
      });

      const rows = entries.map((e) => {
        const totalDebit = e.lines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = e.lines.reduce((sum, l) => sum + l.credit, 0);
        return {
          id: e.id.slice(0, 8),
          date: e.date,
          description: e.description,
          totalDebit: formatCLP(totalDebit),
          totalCredit: formatCLP(totalCredit),
        };
      });

      yield* renderer.render(rows, {
        columns: entryColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("List journal entries with optional date and account filters"));
