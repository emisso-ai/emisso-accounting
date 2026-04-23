/**
 * accounting chart list — list all accounts in the chart
 */

import { Command, Options } from "@effect/cli";
import { Effect } from "effect";
import { getNormalBalance } from "@emisso/accounting";
import {
  OutputRenderer,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { chartColumns } from "../../formatters/accounting-table.js";
import { ledgerOption } from "../../config/options.js";
import { resolveLedgerPathEffect, resolveAccountTypeEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";

const typeOption = Options.text("type").pipe(
  Options.optional,
  Options.withDescription("Filter by account type: asset, liability, equity, revenue, expense"),
);

const options = {
  ledger: ledgerOption,
  type: typeOption,
  format: formatOption,
  json: jsonFlag,
};

export const chartListCommand = Command.make(
  "list",
  options,
  ({ ledger, type, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const l = yield* loadLedgerEffect(ledgerPath);

      let accounts = l.chart.toArray();

      const typeFilter = yield* resolveAccountTypeEffect(type);
      if (typeFilter) {
        accounts = accounts.filter((a) => a.type === typeFilter);
      }

      const rows = accounts.map((a) => ({
        code: a.code,
        name: a.name,
        type: a.type,
        parentCode: a.parentCode ?? "",
        normalBalance: getNormalBalance(a.type),
      }));

      yield* renderer.render(rows, {
        columns: chartColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("List all accounts in the chart of accounts"));
