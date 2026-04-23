/**
 * accounting chart show <code> — show account detail + children
 */

import { Command, Args } from "@effect/cli";
import { Effect } from "effect";
import { getNormalBalance } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { chartColumns } from "../../formatters/accounting-table.js";
import { ledgerOption } from "../../config/options.js";
import { resolveLedgerPathEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";

const codeArg = Args.text({ name: "code" }).pipe(
  Args.withDescription("Account code (e.g. 1.1.03.001)"),
);

const options = { ledger: ledgerOption, format: formatOption, json: jsonFlag };

export const chartShowCommand = Command.make(
  "show",
  { args: codeArg, ...options },
  ({ args: code, ledger, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const l = yield* loadLedgerEffect(ledgerPath);

      const account = l.chart.getAccount(code);
      if (!account) {
        return yield* Effect.fail(new CliError({
          kind: "not-found",
          message: `Account not found: ${code}`,
        }));
      }

      const children = l.chart.getChildren(code);
      const allAccounts = [account, ...children];

      const rows = allAccounts.map((a) => ({
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
).pipe(Command.withDescription("Show account details and children"));
