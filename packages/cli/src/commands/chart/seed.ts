/**
 * accounting chart seed — initialize ledger with SII standard chart of accounts
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import { siiAccounts } from "@emisso/accounting";
import {
  OutputRenderer,
  CliError,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { keyValueColumns } from "../../formatters/accounting-table.js";
import { ledgerOption } from "../../config/options.js";
import { resolveLedgerPathEffect } from "../../config/resolve.js";
import { initLedger } from "../../config/ledger-io.js";

const options = {
  ledger: ledgerOption,
  format: formatOption,
  json: jsonFlag,
};

export const chartSeedCommand = Command.make(
  "seed",
  options,
  ({ ledger, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      yield* Effect.try({
        try: () => initLedger(ledgerPath),
        catch: (error) => error instanceof CliError ? error : new CliError({
          kind: "general", message: "Failed to initialize ledger",
          detail: error instanceof Error ? error.message : String(error),
        }),
      });

      const rows = [
        { field: "File", value: ledgerPath },
        { field: "Accounts", value: String(siiAccounts.length) },
        { field: "Status", value: "Initialized" },
      ];

      yield* renderer.render(rows, {
        columns: keyValueColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Initialize a new ledger with SII standard chart of accounts (207 accounts)"));
